import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    useEffect,
    useState
} from "react";

import {
    getCurrentUser
} from "../utils/authStorage";

import {
    logoutWithSupabase
} from "../utils/supabaseAuth";

import {
    getExperienceLabel,
    getNavbarLinksForUser
} from "../config/roleExperience";

import NotificationsNavLink from "./NotificationsNavLink";

function Navbar() {

    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(getCurrentUser());
    const [menuOpen, setMenuOpen] = useState(false);

    const navLinks = getNavbarLinksForUser(currentUser);
    const experienceLabel = getExperienceLabel(currentUser);

    useEffect(() => {
        function syncUser() {
            setCurrentUser(getCurrentUser());
        }

        window.addEventListener("authChanged", syncUser);
        window.addEventListener("storage", syncUser);

        return () => {
            window.removeEventListener("authChanged", syncUser);
            window.removeEventListener("storage", syncUser);
        };
    }, []);

    function closeMenu() {
        setMenuOpen(false);
    }

    async function handleLogout() {
        await logoutWithSupabase();

        setCurrentUser(null);
        closeMenu();

        navigate("/");
    }

    return (
        <nav className="navbar">

            <Link className="navbar-brand" to="/" onClick={closeMenu}>
                <img
                    className="navbar-logo"
                    src="/sailjobs-mark.svg"
                    alt=""
                    aria-hidden="true"
                />
                <span className="navbar-brand-text">SailJobs LATAM</span>
            </Link>

            <button
                className="menu-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Abrir o cerrar menú"
            >
                ☰
            </button>

            <div className={`nav-links ${menuOpen ? "open" : ""}`}>

                {navLinks.map(link => (
                    <Link
                        key={`${link.to}-${link.label}`}
                        to={link.to}
                        onClick={closeMenu}
                    >
                        {link.label}
                    </Link>
                ))}

                <NotificationsNavLink
                    currentUser={currentUser}
                    onNavigate={closeMenu}
                />

                {!currentUser && (
                    <>
                        <Link to="/login" onClick={closeMenu}>
                            Ingresar
                        </Link>

                        <Link to="/signup" onClick={closeMenu}>
                            Crear cuenta
                        </Link>
                    </>
                )}

                {currentUser && (
                    <>
                        <span
                            className="navbar-user"
                            title={experienceLabel}
                        >
                            {currentUser.name || experienceLabel}
                        </span>

                        <button
                            className="nav-button"
                            onClick={handleLogout}
                        >
                            Salir
                        </button>
                    </>
                )}

            </div>

        </nav>
    );
}

export default Navbar;
