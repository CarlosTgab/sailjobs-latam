import { createClient } from "npm:@supabase/supabase-js@2.110.5";

type NotificationRecord = {
    id: string;
    recipient_user_id: string;
    type: string;
    title: string;
    body: string;
    link_url?: string | null;
};

type WebhookPayload = {
    type: "INSERT" | "UPDATE" | "DELETE";
    table: string;
    schema: string;
    record: NotificationRecord | null;
};

const EMAIL_NOTIFICATION_TYPES = new Set([
    "application_submitted",
    "application_received",
    "application_status_changed"
]);

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json"
        }
    });
}

function getSecretKey() {
    const currentKeys = Deno.env.get("SUPABASE_SECRET_KEYS");

    if (currentKeys) {
        try {
            const parsedKeys = JSON.parse(currentKeys);

            if (parsedKeys.default) {
                return parsedKeys.default;
            }
        } catch {
            // Continúa con la clave legacy para proyectos existentes.
        }
    }

    return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

function escapeHtml(value: string) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getActionUrl(siteUrl: string, linkUrl?: string | null) {
    if (!linkUrl || !linkUrl.startsWith("/")) {
        return siteUrl;
    }

    return `${siteUrl}${linkUrl}`;
}

function buildEmailHtml(
    recipientName: string,
    notification: NotificationRecord,
    actionUrl: string
) {
    return `
        <!doctype html>
        <html lang="es">
            <body style="margin:0;background:#eef4fb;font-family:Arial,sans-serif;color:#172033">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#eef4fb">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden">
                                <tr>
                                    <td style="padding:24px 30px;background:#0b2f57;color:#ffffff;font-size:22px;font-weight:700">
                                        SailJobs LATAM
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:30px">
                                        <p style="margin:0 0 16px">Hola ${escapeHtml(recipientName || "")},</p>
                                        <h1 style="margin:0 0 14px;color:#0b2f57;font-size:25px">
                                            ${escapeHtml(notification.title)}
                                        </h1>
                                        <p style="margin:0 0 24px;line-height:1.6;color:#475467">
                                            ${escapeHtml(notification.body)}
                                        </p>
                                        <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:13px 22px;border-radius:999px;background:#ff8400;color:#ffffff;text-decoration:none;font-weight:700">
                                            Ver en SailJobs
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:20px 30px;background:#f8fafc;color:#667085;font-size:13px;line-height:1.5">
                                        Recibís este correo por una actividad relacionada con tu cuenta de SailJobs LATAM.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
        </html>
    `;
}

Deno.serve(async (request) => {
    if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const webhookSecret = Deno.env.get("SAILJOBS_WEBHOOK_SECRET") || "";
    const receivedSecret = request.headers.get("x-sailjobs-webhook-secret") || "";

    if (!webhookSecret || receivedSecret !== webhookSecret) {
        return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const secretKey = getSecretKey();
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    const fromEmail = Deno.env.get("SAILJOBS_FROM_EMAIL") || "";
    const siteUrl = (Deno.env.get("SAILJOBS_SITE_URL") ||
        "https://sailjobs-latam.vercel.app").replace(/\/$/, "");

    if (!supabaseUrl || !secretKey || !resendApiKey || !fromEmail) {
        return jsonResponse({ error: "Missing function configuration" }, 500);
    }

    let payload: WebhookPayload;

    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    const notification = payload.record;

    if (
        payload.type !== "INSERT" ||
        payload.schema !== "public" ||
        payload.table !== "notifications" ||
        !notification
    ) {
        return jsonResponse({ skipped: true, reason: "Unsupported webhook" });
    }

    if (!EMAIL_NOTIFICATION_TYPES.has(notification.type)) {
        return jsonResponse({ skipped: true, reason: "Internal-only notification" });
    }

    const supabaseAdmin = createClient(supabaseUrl, secretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const { data: existingDelivery, error: deliveryLookupError } =
        await supabaseAdmin
            .from("email_deliveries")
            .select("id, status, attempts")
            .eq("notification_id", notification.id)
            .maybeSingle();

    if (deliveryLookupError) {
        return jsonResponse({ error: deliveryLookupError.message }, 500);
    }

    if (existingDelivery?.status === "sent") {
        return jsonResponse({ sent: true, duplicate: true });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("email, name")
        .eq("id", notification.recipient_user_id)
        .maybeSingle();

    if (profileError) {
        return jsonResponse({ error: profileError.message }, 500);
    }

    if (!profile?.email) {
        if (!existingDelivery) {
            await supabaseAdmin.from("email_deliveries").insert({
                notification_id: notification.id,
                status: "skipped",
                error_message: "Recipient has no email"
            });
        }

        return jsonResponse({ skipped: true, reason: "Recipient has no email" });
    }

    if (existingDelivery) {
        await supabaseAdmin
            .from("email_deliveries")
            .update({
                status: "processing",
                recipient_email: profile.email,
                attempts: existingDelivery.attempts + 1,
                error_message: null,
                updated_at: new Date().toISOString()
            })
            .eq("id", existingDelivery.id);
    } else {
        const { error: insertError } = await supabaseAdmin
            .from("email_deliveries")
            .insert({
                notification_id: notification.id,
                recipient_email: profile.email,
                status: "processing"
            });

        if (insertError?.code === "23505") {
            return jsonResponse({ sent: false, duplicate: true }, 202);
        }

        if (insertError) {
            return jsonResponse({ error: insertError.message }, 500);
        }
    }

    const actionUrl = getActionUrl(siteUrl, notification.link_url);
    const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: fromEmail,
            to: [profile.email],
            subject: notification.title,
            html: buildEmailHtml(profile.name, notification, actionUrl),
            text: `${notification.title}\n\n${notification.body}\n\n${actionUrl}`
        })
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
        await supabaseAdmin
            .from("email_deliveries")
            .update({
                status: "failed",
                error_message: JSON.stringify(resendResult).slice(0, 2000),
                updated_at: new Date().toISOString()
            })
            .eq("notification_id", notification.id);

        return jsonResponse({ error: "Email provider rejected the request" }, 502);
    }

    await supabaseAdmin
        .from("email_deliveries")
        .update({
            status: "sent",
            provider_message_id: resendResult.id || null,
            error_message: null,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq("notification_id", notification.id);

    return jsonResponse({ sent: true, id: resendResult.id || null });
});
