import { useState } from "react";
import { Link } from "react-router-dom";

import {
    getAuthErrorMessage,
    requestPasswordReset
} from "../utils/supabaseAuth";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            await requestPasswordReset(email);
            setMessageType("success");
            setMessage(
                "Si existe una cuenta con ese email, vas a recibir un enlace para crear una contraseña nueva. Revisá también spam o correo no deseado."
            );
        } catch (error) {
            setMessageType("error");
            setMessage(
                getAuthErrorMessage(
                    error,
                    "No pudimos enviar el correo de recuperación."
                )
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1>Recuperar cuenta</h1>

                <p>
                    Ingresá el email con el que te registraste. Te enviaremos
                    un enlace seguro para cambiar la contraseña.
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="recovery-email">Email</label>

                    <input
                        id="recovery-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="tu@email.com"
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
                        {loading ? "Enviando..." : "Enviar enlace"}
                    </button>
                </form>

                <p className="auth-switch">
                    <Link to="/login">Volver a ingresar</Link>
                </p>
            </section>
        </main>
    );
}

export default ForgotPassword;
