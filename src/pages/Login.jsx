import { useState } from "react";
import {
    Link,
    useNavigate,
    useSearchParams
} from "react-router-dom";

import {
    getAuthErrorMessage,
    loginWithSupabase
} from "../utils/supabaseAuth";

import {
    getPrimaryDashboardPath
} from "../config/roleExperience";

function Login() {
    const navigate =
        useNavigate();

    const [searchParams] = useSearchParams();

    const passwordWasUpdated =
        searchParams.get("password") === "updated";

    const emailWasConfirmed =
        searchParams.get("email") === "confirmed";

    const [
        email,
        setEmail
    ] = useState("");

    const [
        password,
        setPassword
    ] = useState("");

    const [
        formMessage,
        setFormMessage
    ] = useState("");

    const [
        loading,
        setLoading
    ] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setFormMessage("");
        setLoading(true);

        try {
            const user =
                await loginWithSupabase(
                    email,
                    password
                );

            navigate(
                getPrimaryDashboardPath(user)
            );
        } catch (error) {
            setFormMessage(
                getAuthErrorMessage(
                    error,
                    "No se pudo iniciar sesión."
                )
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-card">

                <h1>Ingresar</h1>

                <p>
                    Entrá a SailJobs LATAM con tu cuenta.
                </p>

                {(passwordWasUpdated || emailWasConfirmed) && (
                    <p className="auth-message success" role="status">
                        {passwordWasUpdated
                            ? "Tu contraseña fue actualizada. Ya podés ingresar."
                            : "Tu email fue confirmado. Ya podés ingresar."}
                    </p>
                )}

                <form onSubmit={handleSubmit}>

                    <label>Email</label>

                    <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(
                                event.target.value
                            )
                        }
                        placeholder="tu@email.com"
                    />

                    <label>Contraseña</label>

                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                        placeholder="Tu contraseña"
                    />

                    <Link
                        className="auth-inline-link"
                        to="/forgot-password"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>

                    {formMessage && (
                        <p className="auth-message error" role="alert">
                            {formMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Ingresando..."
                            : "Ingresar"}
                    </button>

                </form>

                <p className="auth-switch">
                    ¿No tenés cuenta?{" "}
                    <Link to="/signup">
                        Crear cuenta
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Login;
