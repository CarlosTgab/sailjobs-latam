import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="footer">

            <Link className="footer-brand" to="/">
                <img src="/sailjobs-mark.svg" alt="" aria-hidden="true" />
                <span>SailJobs LATAM</span>
            </Link>

            <p>
                La plataforma náutica de Sudamérica.
            </p>

            <div className="footer-links">
                <Link to="/about">
                    Sobre nosotros
                </Link>

                <Link to="/contact">
                    Feedback / Contacto
                </Link>
            </div>

            <p>
                © 2026 SailJobs LATAM
            </p>

        </footer>
    );
}

export default Footer;
