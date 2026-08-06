import { supabase } from "../lib/supabaseClient";
import { normalizeUserAccount } from "./authStorage";

function normalizeRole(row) {
    const databaseRole = row.role || "user";

    if (
        databaseRole === "user" &&
        row.entityType === "organization"
    ) {
        return "organization_admin";
    }

    if (
        databaseRole === "user" &&
        row.entityType === "club"
    ) {
        return "club";
    }

    return databaseRole;
}

function normalizeAdminUser(row) {
    const entityType = row.entityType || null;
    const role = normalizeRole(row);

    const permissions = [
        ...new Set([
            ...(row.permissions || []),
            ...(role === "organization_admin"
                ? ["organization_admin"]
                : [])
        ])
    ];

    return normalizeUserAccount({
        id: row.id,
        email: row.email || "",
        name: row.name || row.email || "Usuario sin nombre",
        role,
        profiles: row.profileTypes || ["user"],
        permissions,
        professionalProfile: {
            active: row.professionalActive === true
        },
        entityId: row.entityId || null,
        entityName: row.entityName || "",
        entityType,
        organizationType: row.organizationType || "",
        clubId:
            entityType === "club"
                ? row.entityId || null
                : null,
        clubName:
            entityType === "club"
                ? row.entityName || ""
                : "",
        organizationId:
            entityType === "organization"
                ? row.entityId || null
                : row.organizationId || null,
        organizationName:
            entityType === "organization"
                ? row.entityName || ""
                : row.organizationName || "",
        createdAt: row.createdAt || ""
    });
}

export async function fetchSuperadminUsers() {
    const { data, error } = await supabase.rpc(
        "get_superadmin_users"
    );

    if (error) {
        throw error;
    }

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map(normalizeAdminUser);
}
