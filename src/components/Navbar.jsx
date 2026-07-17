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
    normalizeUserRole
} from "../utils/permissions";

function Navbar() {

    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(getCurrentUser());
    const [menuOpen, setMenuOpen] = useState(false);

    const normalizedRole = normalizeUserRole(currentUser);

    const isClub = normalizedRole === "club";
    const isOrganizationAdmin = normalizedRole === "organization_admin";

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

        navigate("/");
    }

    return (
        <nav className="navbar">

            <h2
                onClick={() => {
                    closeMenu();
                    navigate("/");
                }}
                style={{ cursor: "pointer" }}
            >
                SailJobs LATAM
            </h2>

            <button
                className="menu-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Abrir o cerrar menú"
            >
                ☰
            </button>

            <div className={`nav-links ${menuOpen ? "open" : ""}`}>

                <Link to="/" onClick={closeMenu}>
                    Inicio
                </Link>

                <Link to="/calendar" onClick={closeMenu}>
                    Calendario
                </Link>

                <Link to="/jobs" onClick={closeMenu}>
                    Oportunidades
                </Link>

                <Link to="/classifieds" onClick={closeMenu}>
                    Clasificados
                </Link>

                <Link to="/clubs" onClick={closeMenu}>
                    Clubes
                </Link>

                <Link to="/ranking" onClick={closeMenu}>
                    Ranking
                </Link>

                <Link to="/about" onClick={closeMenu}>
                    Sobre nosotros
                </Link>

                <Link to="/contact" onClick={closeMenu}>
                    Contacto
                </Link>

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

                {currentUser && isClub && (
                    <Link
                        to={`/club-dashboard/${currentUser.clubId}`}
                        onClick={closeMenu}
                    >
                        Mi organización
                    </Link>
                )}

                {currentUser && isOrganizationAdmin && (
                    <Link
                        to="/organization-admin"
                        onClick={closeMenu}
                    >
                        Mi organización
                    </Link>
                )}

                {currentUser && !isClub && !isOrganizationAdmin && (
                    <Link to="/profile" onClick={closeMenu}>
                        Mi perfil
                    </Link>
                )}

                {currentUser && (
                    <>
                        <span
                            className="navbar-user"
                            onClick={() => {
                                closeMenu();

                                if (isClub && currentUser.clubId) {
                                    navigate(`/club-dashboard/${currentUser.clubId}`);
                                    return;
                                }

                                if (isOrganizationAdmin) {
                                    navigate("/organization-admin");
                                    return;
                                }

                                navigate("/profile");
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            {currentUser.name}
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