import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="footer">

            <h3>SailJobs LATAM</h3>

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
