import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";
import {
    getAuthErrorMessage,
    logoutWithSupabase,
    updateAccountPassword
} from "../utils/supabaseAuth";

function getLinkError() {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);

    return (
        hashParams.get("error_description") ||
        searchParams.get("error_description") ||
        ""
    );
}

function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [sessionReady, setSessionReady] = useState(false);
    const [message, setMessage] = useState(getLinkError());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function checkSession() {
            const { data } = await supabase.auth.getSession();

            if (isMounted && data.session) {
                setSessionReady(true);
            }
        }

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (
                    isMounted &&
                    session &&
                    (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")
                ) {
                    setSessionReady(true);
                    setMessage("");
                }
            }
        );

        const timeoutId = window.setTimeout(async () => {
            const { data } = await supabase.auth.getSession();

            if (isMounted && !data.session) {
                setMessage(currentMessage =>
                    currentMessage ||
                    "El enlace venció o ya fue utilizado. Solicitá uno nuevo."
                );
            }
        }, 10000);

        return () => {
            isMounted = false;
            window.clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");

        if (password !== passwordConfirmation) {
            setMessage("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);

        try {
            await updateAccountPassword(password);
            await logoutWithSupabase();
            navigate("/login?password=updated", { replace: true });
        } catch (error) {
            setMessage(
                getAuthErrorMessage(
                    error,
                    "No pudimos actualizar la contraseña."
                )
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1>Nueva contraseña</h1>

                {!sessionReady ? (
                    <>
                        <p className={message ? "auth-message error" : ""}>
                            {message || "Validando el enlace de recuperación..."}
                        </p>

                        {message && (
                            <p className="auth-switch">
                                <Link to="/forgot-password">
                                    Solicitar otro enlace
                                </Link>
                            </p>
                        )}
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p>
                            Elegí una contraseña de al menos 8 caracteres,
                            con una letra y un número.
                        </p>

                        <label htmlFor="new-password">Contraseña nueva</label>
                        <input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />

                        <label htmlFor="new-password-confirmation">
                            Repetir contraseña
                        </label>
                        <input
                            id="new-password-confirmation"
                            type="password"
                            autoComplete="new-password"
                            value={passwordConfirmation}
                            onChange={(event) =>
                                setPasswordConfirmation(event.target.value)
                            }
                            required
                        />

                        {message && (
                            <p className="auth-message error" role="alert">
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading ? "Guardando..." : "Guardar contraseña"}
                        </button>
                    </form>
                )}
            </section>
        </main>
    );
}

export default ResetPassword;
