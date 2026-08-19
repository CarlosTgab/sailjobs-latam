import { useNavigate } from "react-router-dom";

function About() {
    const navigate = useNavigate();

    return (
        <div className="dashboard-page">

            <div className="dashboard-hero">

                <div>
                    <span className="sidebar-tag">
                        Sobre SailJobs LATAM
                    </span>

                    <h1>
                        La plataforma náutica para conectar clubes,
                        profesionales, voluntarios y eventos.
                    </h1>

                    <p>
                        SailJobs LATAM nace para ordenar y acercar oportunidades
                        dentro del mundo de la vela: trabajos profesionales,
                        cargos técnicos de campeonato, voluntariados,
                        clasificados, clubes y calendarios deportivos.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate("/jobs")}
                    >
                        Ver oportunidades
                    </button>

                    <button
                        className="apply-button"
                        onClick={() => navigate("/clubs")}
                    >
                        Ver organizaciones
                    </button>
                </div>

            </div>

            <div className="dashboard-stats">

                <div className="dashboard-stat-card">
                    <h2>🌎</h2>
                    <p>Comunidad regional</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>⛵</h2>
                    <p>Vela deportiva</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>🤝</h2>
                    <p>Clubes y profesionales</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>🏁</h2>
                    <p>Eventos y campeonatos</p>
                </div>

            </div>

            <div className="detail-card">

                <div className="section-header">
                    <h2>Qué es SailJobs LATAM</h2>
                </div>

                <p>
                    SailJobs LATAM es una plataforma pensada para la comunidad
                    náutica latinoamericana. El objetivo es que clubes,
                    asociaciones, clases, entrenadores, oficiales de regata,
                    jurados, medidores, voluntarios y navegantes puedan
                    encontrarse en un mismo lugar.
                </p>

                <p>
                    La plataforma permite publicar oportunidades profesionales,
                    convocatorias para campeonatos, voluntariados, eventos,
                    clasificados y perfiles profesionales vinculados a la vela.
                </p>

            </div>

            <div className="detail-card">

                <div className="section-header">
                    <h2>Qué problema busca resolver</h2>
                </div>

                <p>
                    En la vela, muchas oportunidades circulan por grupos de
                    WhatsApp, contactos personales o publicaciones aisladas.
                    Eso hace que sea difícil encontrar entrenadores, oficiales,
                    voluntarios o roles técnicos para campeonatos.
                </p>

                <p>
                    SailJobs LATAM busca ordenar esa información y hacerla más
                    accesible, especialmente para clubes y personas que quieren
                    participar profesionalmente o colaborar en eventos náuticos.
                </p>

            </div>

            <div className="detail-card">

                <div className="section-header">
                    <h2>Para quién es</h2>
                </div>

                <div className="dashboard-grid">

                    <div className="dashboard-card">
                        <h3>Clubes y organizaciones</h3>

                        <p>
                            Para publicar oportunidades, buscar profesionales
                            y revisar postulaciones.
                        </p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Profesionales náuticos</h3>

                        <p>
                            Para mostrar experiencia, certificaciones,
                            especialidades, CV y postularse a oportunidades.
                        </p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Voluntarios</h3>

                        <p>
                            Para participar en campeonatos, eventos y tareas de
                            apoyo dentro de la comunidad náutica.
                        </p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Navegantes y comunidad</h3>

                        <p>
                            Para consultar eventos, clubes, clasificados y
                            oportunidades dentro de la región.
                        </p>
                    </div>

                </div>

            </div>

            <div className="detail-card">

                <div className="section-header">
                    <h2>Estado actual</h2>
                </div>

                <p>
                    Esta versión es una beta visual en desarrollo. Todavía no
                    usa base de datos real: los datos cargados se guardan
                    localmente en cada navegador.
                </p>

                <p>
                    La próxima etapa es conectar la plataforma con base de datos,
                    autenticación real, almacenamiento de imágenes y CVs, y un
                    sistema de administración más sólido.
                </p>

                <button
                    className="apply-button"
                    onClick={() => navigate("/contact")}
                >
                    Enviar feedback
                </button>

            </div>

        </div>
    );
}

export default About;
