import { Link } from "react-router-dom";

function BetaBanner() {
    return (
        <div className="beta-banner">
            <strong>Versión beta</strong>

            <span>
                SailJobs LATAM está en desarrollo. Los datos cargados en esta
                beta se guardan localmente en cada navegador. No cargues CVs ni
                información sensible todavía.
            </span>

            <Link to="/contact">
                Enviar feedback
            </Link>
        </div>
    );
}

export default BetaBanner;