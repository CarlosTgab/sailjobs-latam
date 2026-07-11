import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    useEffect,
    useState
} from "react";

import {
    getCurrentUser,
    logout,
    hasProfessionalProfile,
    hasProfile
} from "../utils/authStorage";

import {
    normalizeUserRole
} from "../utils/permissions";

function Navbar() {

    const navigate = useNavigate();

    const [
        currentUser,
        setCurrentUser
    ] = useState(
        getCurrentUser()
    );

    const [
        menuOpen,
        setMenuOpen
    ] = useState(false);

    const normalizedRole =
        normalizeUserRole(
            currentUser
        );

    const hasPersonalProfile =
        hasProfile(
            currentUser,
            "user"
        );

    const professionalProfileIsActive =
        hasProfessionalProfile(
            currentUser
        );

    useEffect(() => {

        function syncUser() {
            setCurrentUser(
                getCurrentUser()
            );
        }

        window.addEventListener(
            "authChanged",
            syncUser
        );

        window.addEventListener(
            "storage",
            syncUser
        );

        return () => {

            window.removeEventListener(
                "authChanged",
                syncUser
            );

            window.removeEventListener(
                "storage",
                syncUser
            );

        };

    }, []);

    function closeMenu() {
        setMenuOpen(false);
    }

    function handleLogout() {
        logout();

        closeMenu();

        navigate("/");
    }

    return (

        <nav className="navbar">

            <h2
                onClick={() => {

                    closeMenu();

                    navigate("/");

                }}
                style={{
                    cursor: "pointer"
                }}
            >
                SailJobs LATAM
            </h2>

            <button
                className="menu-toggle"
                onClick={() =>
                    setMenuOpen(
                        !menuOpen
                    )
                }
                aria-label={
                    "Abrir o cerrar menú"
                }
            >
                ☰
            </button>

            <div
                className={
                    `nav-links ${
                        menuOpen
                            ? "open"
                            : ""
                    }`
                }
            >

                {!currentUser && (

                    <>

                        <Link
                            to="/"
                            onClick={closeMenu}
                        >
                            Inicio
                        </Link>

                        <Link
                            to="/calendar"
                            onClick={closeMenu}
                        >
                            Calendario
                        </Link>

                        <Link
                            to="/jobs"
                            onClick={closeMenu}
                        >
                            Oportunidades
                        </Link>

                        <Link
                            to="/classifieds"
                            onClick={closeMenu}
                        >
                            Clasificados
                        </Link>

                        <Link
                            to="/clubs"
                            onClick={closeMenu}
                        >
                            Clubes
                        </Link>

                        <Link
                            to="/ranking"
                            onClick={closeMenu}
                        >
                            Ranking
                        </Link>

                        <Link
                            to="/about"
                            onClick={closeMenu}
                        >
                            Sobre nosotros
                        </Link>

                        <Link
                            to="/contact"
                            onClick={closeMenu}
                        >
                            Contacto
                        </Link>

                        <Link
                            to="/login"
                            onClick={closeMenu}
                        >
                            Ingresar
                        </Link>

                        <Link
                            to="/signup"
                            onClick={closeMenu}
                        >
                            Crear cuenta
                        </Link>

                    </>

                )}

                {currentUser &&
                    normalizedRole ===
                    "superadmin" && (

                    <>

                        <Link
                            to="/"
                            onClick={closeMenu}
                        >
                            Inicio
                        </Link>

                        <Link
                            to="/superadmin"
                            onClick={closeMenu}
                        >
                            Superadmin
                        </Link>

                        <Link
                            to="/calendar"
                            onClick={closeMenu}
                        >
                            Calendario
                        </Link>

                        <Link
                            to="/jobs"
                            onClick={closeMenu}
                        >
                            Oportunidades
                        </Link>

                        <Link
                            to="/classifieds"
                            onClick={closeMenu}
                        >
                            Clasificados
                        </Link>

                        <Link
                            to="/clubs"
                            onClick={closeMenu}
                        >
                            Clubes
                        </Link>

                        <Link
                            to="/ranking"
                            onClick={closeMenu}
                        >
                            Ranking
                        </Link>

                        <Link
                            to="/about"
                            onClick={closeMenu}
                        >
                            Sobre nosotros
                        </Link>

                        <Link
                            to="/contact"
                            onClick={closeMenu}
                        >
                            Contacto
                        </Link>

                    </>

                )}

                {currentUser &&
                    normalizedRole ===
                    "organization_admin" && (

                    <>

                        <Link
                            to="/"
                            onClick={closeMenu}
                        >
                            Inicio
                        </Link>

                        <Link
                            to="/organization-admin"
                            onClick={closeMenu}
                        >
                            Mi organización
                        </Link>

                        <Link
                            to="/calendar"
                            onClick={closeMenu}
                        >
                            Calendario
                        </Link>

                        <Link
                            to="/jobs"
                            onClick={closeMenu}
                        >
                            Oportunidades
                        </Link>

                        <Link
                            to="/ranking"
                            onClick={closeMenu}
                        >
                            Ranking
                        </Link>

                        <Link
                            to="/clubs"
                            onClick={closeMenu}
                        >
                            Clubes
                        </Link>

                        <Link
                            to="/about"
                            onClick={closeMenu}
                        >
                            Sobre nosotros
                        </Link>

                        <Link
                            to="/contact"
                            onClick={closeMenu}
                        >
                            Contacto
                        </Link>

                    </>

                )}

                {currentUser &&
                    normalizedRole ===
                    "club" && (

                    <>

                        <Link
                            to="/"
                            onClick={closeMenu}
                        >
                            Inicio
                        </Link>

                        <Link
                            to="/calendar"
                            onClick={closeMenu}
                        >
                            Calendario
                        </Link>

                        <Link
                            to="/jobs"
                            onClick={closeMenu}
                        >
                            Oportunidades
                        </Link>

                        <Link
                            to="/classifieds"
                            onClick={closeMenu}
                        >
                            Clasificados
                        </Link>

                        <Link
                            to="/clubs"
                            onClick={closeMenu}
                        >
                            Clubes
                        </Link>

                        <Link
                            to={
                                `/club-dashboard/${
                                    currentUser.clubId
                                }`
                            }
                            onClick={closeMenu}
                        >
                            Mi organización
                        </Link>

                        <Link
                            to="/about"
                            onClick={closeMenu}
                        >
                            Sobre nosotros
                        </Link>

                        <Link
                            to="/contact"
                            onClick={closeMenu}
                        >
                            Contacto
                        </Link>

                    </>

                )}

                {currentUser &&
                    hasPersonalProfile &&
                    professionalProfileIsActive && (

                    <>

                        <Link
                            to="/"
                            onClick={closeMenu}
                        >
                            Inicio
                        </Link>

                        <Link
                            to="/calendar"
                            onClick={closeMenu}
                        >
                            Calendario
                        </Link>

                        <Link
                            to="/jobs"
                            onClick={closeMenu}
                        >
                            Oportunidades
                        </Link>

                        <Link
                            to="/classifieds"
                            onClick={closeMenu}
                        >
                            Clasificados
                        </Link>

                        <Link
                            to="/clubs"
                            onClick={closeMenu}
                        >
                            Clubes
                        </Link>

                        <Link
                            to="/ranking"
                            onClick={closeMenu}
                        >
                            Ranking
                        </Link>

                        <Link
                            to="/coach-dashboard"
                            onClick={closeMenu}
                        >
                            Perfil profesional
                        </Link>

                        <Link
                            to="/user-dashboard"
                            onClick={closeMenu}
                        >
                            Perfil personal
                        </Link>

                        <Link
                            to="/about"
                            onClick={closeMenu}
                        >
                            Sobre nosotros
                        </Link>

                        <Link
                            to="/contact"
                            onClick={closeMenu}
                        >
                            Contacto
                        </Link>

                    </>

                )}

                {currentUser &&
                    hasPersonalProfile &&
                    !professionalProfileIsActive && (

                    <>

                        <Link
                            to="/"
                            onClick={closeMenu}
                        >
                            Inicio
                        </Link>

                        <Link
                            to="/calendar"
                            onClick={closeMenu}
                        >
                            Calendario
                        </Link>

                        <Link
                            to="/jobs"
                            onClick={closeMenu}
                        >
                            Oportunidades
                        </Link>

                        <Link
                            to="/classifieds"
                            onClick={closeMenu}
                        >
                            Clasificados
                        </Link>

                        <Link
                            to="/clubs"
                            onClick={closeMenu}
                        >
                            Clubes
                        </Link>

                        <Link
                            to="/ranking"
                            onClick={closeMenu}
                        >
                            Ranking
                        </Link>

                        <Link
                            to="/user-dashboard"
                            onClick={closeMenu}
                        >
                            Mi perfil
                        </Link>

                        <Link
                            to="/about"
                            onClick={closeMenu}
                        >
                            Sobre nosotros
                        </Link>

                        <Link
                            to="/contact"
                            onClick={closeMenu}
                        >
                            Contacto
                        </Link>

                    </>

                )}

                {currentUser && (

                    <>

                        <span className="navbar-user">
                            {
                                currentUser.name
                            }
                        </span>

                        <button
                            className="nav-button"
                            onClick={
                                handleLogout
                            }
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