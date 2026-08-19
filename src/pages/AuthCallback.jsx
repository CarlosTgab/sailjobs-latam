import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";
import { getPrimaryDashboardPath } from "../config/roleExperience";
import { syncSupabaseSession } from "../utils/supabaseAuth";

function getCallbackError() {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);

    return (
        hashParams.get("error_description") ||
        searchParams.get("error_description") ||
        ""
    );
}

function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const completed = useRef(false);
    const [message, setMessage] = useState(
        getCallbackError() || "Confirmando tu cuenta..."
    );
    const hasInitialError = Boolean(getCallbackError());

    useEffect(() => {
        if (hasInitialError) return undefined;

        let isMounted = true;

        async function finishAuthentication(session) {
            if (!session?.user || completed.current) return;

            completed.current = true;

            try {
                const user = await syncSupabaseSession();

                if (!isMounted) return;

                if (searchParams.get("email") === "updated") {
                    navigate("/account?email=updated", { replace: true });
                    return;
                }

                navigate(getPrimaryDashboardPath(user), { replace: true });
            } catch (error) {
                completed.current = false;

                if (isMounted) {
                    setMessage(
                        error.message ||
                        "El email fue confirmado, pero no pudimos terminar de preparar el perfil."
                    );
                }
            }
        }

        async function loadSession() {
            const { data, error } = await supabase.auth.getSession();

            if (error && isMounted) {
                setMessage(error.message);
                return;
            }

            if (data.session) {
                await finishAuthentication(data.session);
            }
        }

        loadSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                window.setTimeout(() => {
                    finishAuthentication(session);
                }, 0);
            }
        );

        const timeoutId = window.setTimeout(() => {
            if (isMounted && !completed.current) {
                setMessage(
                    "El enlace venció o ya fue utilizado. Podés iniciar sesión o solicitar una nueva confirmación."
                );
            }
        }, 10000);

        return () => {
            isMounted = false;
            window.clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [hasInitialError, navigate, searchParams]);

    return (
        <main className="auth-page">
            <section className="auth-card auth-status-card">
                <h1>Verificación de cuenta</h1>

                <p
                    className={
                        message === "Confirmando tu cuenta..."
                            ? "auth-message"
                            : "auth-message error"
                    }
                    role="status"
                >
                    {message}
                </p>

                {message !== "Confirmando tu cuenta..." && (
                    <div className="auth-actions">
                        <Link className="auth-button auth-button-link" to="/login">
                            Ir a ingresar
                        </Link>
                        <Link className="auth-secondary-link" to="/confirm-email">
                            Reenviar confirmación
                        </Link>
                    </div>
                )}
            </section>
        </main>
    );
}

export default AuthCallback;
