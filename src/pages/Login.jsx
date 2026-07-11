import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../utils/authStorage";

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleSubmit(event) {
        event.preventDefault();

        if (!email || !password) {
            alert("Completá email y contraseña.");
            return;
        }

        const result = login(email, password);

        if (!result.success) {
            alert(result.message);
            return;
        }

        alert("Sesión iniciada correctamente.");

        if (result.user.role === "club") {
            navigate(`/club-dashboard/${result.user.clubId}`);
        } else if (result.user.role === "coach") {
            navigate("/coach-dashboard");
        } else {
            navigate("/user-dashboard");
        }
    }

    return (

        <div className="auth-page">

            <div className="auth-card">

                <h1>Iniciar sesión</h1>

                <p>
                    Entrá a tu cuenta de SailJobs LATAM.
                </p>

                <form onSubmit={handleSubmit}>

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        className="apply-button"
                        type="submit"
                    >
                        Ingresar
                    </button>

                </form>

            </div>

        </div>

    );
}

export default Login;