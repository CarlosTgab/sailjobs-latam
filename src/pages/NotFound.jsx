import { useNavigate } from "react-router-dom";

function NotFound() {

    const navigate = useNavigate();

    return (

        <div className="page not-found-page">

            <div className="detail-card not-found-card">

                <h1>404</h1>

                <h2>Página no encontrada</h2>

                <p>
                    La página que estás buscando no existe o fue movida.
                </p>

                <div className="dashboard-actions">

                    <button
                        className="apply-button"
                        onClick={() => navigate("/")}
                    >
                        Volver al inicio
                    </button>

                    <button
                        className="back-button"
                        onClick={() => navigate(-1)}
                    >
                        Volver atrás
                    </button>

                </div>

            </div>

        </div>

    );
}

export default NotFound;