import { useState } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    loginWithSupabase
} from "../utils/supabaseAuth";

import {
    normalizeUserRole
} from "../utils/permissions";

function getRedirectPath(user) {
    const role =
        normalizeUserRole(user);

    if (role === "club" && user.clubId) {
        return `/club-dashboard/${user.clubId}`;
    }

    if (role === "organization_admin") {
        return "/organization-admin";
    }

    return "/profile";
}

function Login() {
    const navigate =
        useNavigate();

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
                getRedirectPath(user)
            );
        } catch (error) {
            setFormMessage(
                error.message ||
                "No se pudo iniciar sesión."
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

                    {formMessage && (
                        <p
                            style={{
                                color: "#b42318"
                            }}
                        >
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