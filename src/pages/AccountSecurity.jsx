import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getCurrentUser } from "../utils/authStorage";
import {
    getAuthErrorMessage,
    requestAccountEmailChange,
    updateAccountPassword
} from "../utils/supabaseAuth";

function AccountSecurity() {
    const currentUser = getCurrentUser();
    const [searchParams] = useSearchParams();
    const [newEmail, setNewEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [emailMessage, setEmailMessage] = useState(
        searchParams.get("email") === "updated"
            ? "Tu cambio de email fue confirmado."
            : ""
    );
    const [passwordMessage, setPasswordMessage] = useState("");
    const [emailMessageType, setEmailMessageType] = useState(
        searchParams.get("email") === "updated" ? "success" : ""
    );
    const [passwordMessageType, setPasswordMessageType] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    async function handleEmailSubmit(event) {
        event.preventDefault();
        setEmailMessage("");
        setEmailLoading(true);

        try {
            await requestAccountEmailChange(newEmail);
            setEmailMessageType("success");
            setEmailMessage(
                "Enviamos los correos de verificación. El cambio se aplicará cuando completes la confirmación."
            );
            setNewEmail("");
        } catch (error) {
            setEmailMessageType("error");
            setEmailMessage(
                getAuthErrorMessage(error, "No pudimos cambiar el email.")
            );
        } finally {
            setEmailLoading(false);
        }
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();
        setPasswordMessage("");

        if (password !== passwordConfirmation) {
            setPasswordMessageType("error");
            setPasswordMessage("Las contraseñas no coinciden.");
            return;
        }

        setPasswordLoading(true);

        try {
            await updateAccountPassword(password);
            setPassword("");
            setPasswordConfirmation("");
            setPasswordMessageType("success");
            setPasswordMessage("La contraseña fue actualizada correctamente.");
        } catch (error) {
            setPasswordMessageType("error");
            setPasswordMessage(
                getAuthErrorMessage(error, "No pudimos cambiar la contraseña.")
            );
        } finally {
            setPasswordLoading(false);
        }
    }

    return (
        <main className="dashboard-page account-security-page">
            <section className="dashboard-hero">
                <div>
                    <span className="eyebrow">Seguridad</span>
                    <h1>Tu cuenta</h1>
                    <p>
                        Administrá el acceso asociado a {currentUser?.email}.
                    </p>
                </div>

                <Link className="small-action-button" to="/profile">
                    Volver al perfil
                </Link>
            </section>

            <div className="account-security-grid">
                <section className="detail-card">
                    <h2>Cambiar email</h2>
                    <p>
                        Por seguridad, Supabase solicitará confirmar el cambio
                        desde los correos correspondientes.
                    </p>

                    <form onSubmit={handleEmailSubmit}>
                        <label htmlFor="new-account-email">Email nuevo</label>
                        <input
                            id="new-account-email"
                            type="email"
                            autoComplete="email"
                            value={newEmail}
                            onChange={(event) => setNewEmail(event.target.value)}
                            required
                        />

                        {emailMessage && (
                            <p
                                className={`auth-message ${emailMessageType}`}
                                role={emailMessageType === "error" ? "alert" : "status"}
                            >
                                {emailMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="accept-button"
                            disabled={emailLoading}
                        >
                            {emailLoading ? "Enviando..." : "Solicitar cambio"}
                        </button>
                    </form>
                </section>

                <section className="detail-card">
                    <h2>Cambiar contraseña</h2>
                    <p>
                        Usá al menos 8 caracteres, una letra y un número.
                    </p>

                    <form onSubmit={handlePasswordSubmit}>
                        <label htmlFor="account-password">Contraseña nueva</label>
                        <input
                            id="account-password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />

                        <label htmlFor="account-password-confirmation">
                            Repetir contraseña
                        </label>
                        <input
                            id="account-password-confirmation"
                            type="password"
                            autoComplete="new-password"
                            value={passwordConfirmation}
                            onChange={(event) =>
                                setPasswordConfirmation(event.target.value)
                            }
                            required
                        />

                        {passwordMessage && (
                            <p
                                className={`auth-message ${passwordMessageType}`}
                                role={passwordMessageType === "error" ? "alert" : "status"}
                            >
                                {passwordMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="accept-button"
                            disabled={passwordLoading}
                        >
                            {passwordLoading ? "Guardando..." : "Guardar contraseña"}
                        </button>
                    </form>
                </section>
            </div>
        </main>
    );
}

export default AccountSecurity;
