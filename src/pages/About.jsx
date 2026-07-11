import { useNavigate } from "react-router-dom";

function About() {

    const navigate = useNavigate();

    return (

        <div className="page about-page">

            <section className="about-hero">

                <h1>Sobre SailJobs LATAM</h1>

                <p>
                    Una plataforma creada para conectar clubes, coaches, navegantes y organizaciones
                    de vela deportiva en Latinoamérica.
                </p>

            </section>

            <section className="about-section">

                <h2>Qué es SailJobs LATAM</h2>

                <p>
                    SailJobs LATAM es una plataforma digital pensada para ordenar y profesionalizar
                    el ecosistema de la vela en la región. Reúne oportunidades laborales, clubes,
                    regatas, clasificados, rankings y postulaciones en un solo lugar.
                </p>

                <p>
                    La idea nace de una necesidad real: hoy mucha información importante de la vela
                    circula de manera dispersa por grupos de WhatsApp, Instagram, PDFs, planillas,
                    contactos personales o publicaciones aisladas. SailJobs LATAM busca centralizar
                    esa información y hacerla más accesible.
                </p>

            </section>

            <section className="about-grid">

                <div className="about-card">
                    <h3>Para clubes</h3>

                    <p>
                        Los clubes pueden publicar empleos, recibir postulaciones, proponer eventos,
                        mostrar su actividad y conectar con coaches o navegantes interesados.
                    </p>
                </div>

                <div className="about-card">
                    <h3>Para coaches</h3>

                    <p>
                        Los entrenadores pueden encontrar oportunidades laborales, postularse,
                        cargar su información y seguir el estado de sus postulaciones.
                    </p>
                </div>

                <div className="about-card">
                    <h3>Para navegantes</h3>

                    <p>
                        Los navegantes pueden consultar calendarios, rankings, clubes y clasificados
                        relacionados con el mundo de la vela deportiva.
                    </p>
                </div>

                <div className="about-card">
                    <h3>Para la comunidad</h3>

                    <p>
                        La plataforma también funciona como punto de encuentro para comprar y vender
                        equipamiento náutico, difundir eventos y fortalecer la red regional de la vela.
                    </p>
                </div>

            </section>

            <section className="about-section">

                <h2>Nuestra visión</h2>

                <p>
                    Queremos que SailJobs LATAM sea una herramienta útil para clubes, entrenadores,
                    navegantes y organizadores. Un espacio donde la información esté ordenada,
                    sea fácil de encontrar y ayude a generar más oportunidades dentro de la vela.
                </p>

                <p>
                    El objetivo no es reemplazar a los clubes ni a las organizaciones existentes,
                    sino darles una herramienta moderna para amplificar su alcance y mejorar la conexión
                    entre las personas que forman parte del deporte.
                </p>

            </section>

            <section className="about-section">

                <h2>Qué podés hacer en la plataforma</h2>

                <div className="about-list">

                    <p>✅ Buscar empleos náuticos y oportunidades para coaches.</p>
                    <p>✅ Publicar empleos desde el panel de un club.</p>
                    <p>✅ Postularte a trabajos como entrenador.</p>
                    <p>✅ Consultar eventos y regatas aprobadas.</p>
                    <p>✅ Proponer eventos desde un club.</p>
                    <p>✅ Ver rankings reales cargados desde planillas oficiales.</p>
                    <p>✅ Publicar clasificados con fotos y datos de contacto.</p>
                    <p>✅ Contactar vendedores por email o WhatsApp.</p>

                </div>

            </section>

            <section className="about-cta">

                <h2>Construido desde la vela, para la vela</h2>

                <p>
                    SailJobs LATAM está pensado desde la experiencia real de quienes entrenan,
                    compiten, organizan regatas y participan activamente en clubes náuticos.
                </p>

                <div className="dashboard-actions">

                    <button
                        className="apply-button"
                        onClick={() => navigate("/jobs")}
                    >
                        Ver empleos
                    </button>

                    <button
                        className="apply-button"
                        onClick={() => navigate("/calendar")}
                    >
                        Ver calendario
                    </button>

                    <button
                        className="apply-button"
                        onClick={() => navigate("/classifieds")}
                    >
                        Ver clasificados
                    </button>

                </div>

            </section>

        </div>

    );
}

export default About;