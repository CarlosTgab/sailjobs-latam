import { Link } from "react-router-dom";

function BetaBanner() {
    return (
        <div className="beta-banner">
            <strong>Versión beta</strong>

            <span>
                SailJobs LATAM está en beta. Las oportunidades, postulaciones
                y los CVs adjuntos se guardan de forma centralizada y segura.
                Reportanos cualquier inconveniente.
            </span>

            <Link to="/contact">
                Enviar feedback
            </Link>
        </div>
    );
}

export default BetaBanner;
