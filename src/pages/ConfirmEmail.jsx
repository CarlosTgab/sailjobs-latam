import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
    getAuthErrorMessage,
    resendSignupConfirmation
} from "../utils/supabaseAuth";

function ConfirmEmail() {
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleResend(event) {
        event.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            await resendSignupConfirmation(email);
            setMessageType("success");
            setMessage(
                "Enviamos un nuevo correo. El enlace anterior puede dejar de ser válido."
            );
        } catch (error) {
            setMessageType("error");
            setMessage(
                getAuthErrorMessage(
                    error,
                    "No pudimos reenviar la confirmación."
                )
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1>Confirmá tu email</h1>

                <p>
                    Te enviamos un enlace para activar la cuenta y terminar
                    de crear tu perfil de SailJobs LATAM.
                </p>

                <p>
                    Revisá la bandeja de entrada, spam y correo no deseado.
                </p>

                <form onSubmit={handleResend}>
                    <label htmlFor="confirmation-email">Email</label>
                    <input
                        id="confirmation-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    {message && (
                        <p
                            className={`auth-message ${messageType}`}
                            role={messageType === "error" ? "alert" : "status"}
                        >
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Reenviando..." : "Reenviar confirmación"}
                    </button>
                </form>

                <p className="auth-switch">
                    ¿Ya confirmaste? <Link to="/login">Ingresar</Link>
                </p>
            </section>
        </main>
    );
}

export default ConfirmEmail;
