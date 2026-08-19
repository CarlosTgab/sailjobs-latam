import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createContactMessage } from "../utils/contactStorage";

function Contact() {

    const navigate = useNavigate();

    const [type, setType] = useState("general");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        if (!name || !email || !subject || !message) {
            alert("Completá todos los campos obligatorios.");
            return;
        }

        createContactMessage({
            type,
            name,
            email,
            subject,
            message
        });

        alert("Mensaje enviado correctamente.");

        setType("general");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");

        navigate("/");
    }

    return (

        <div className="page contact-page">

            <div className="contact-hero">

                <h1>Contacto</h1>

                <p>
                    Escribinos para sumar tu club, proponer mejoras,
                    consultar por oportunidades o colaborar con SailJobs LATAM.
                </p>

            </div>

            <div className="contact-layout">

                <div className="detail-card">

                    <h2>Enviar consulta</h2>

                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >

                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="general">
                                Consulta general
                            </option>

                            <option value="club">
                                Quiero sumar un club / organización
                            </option>

                            <option value="job">
                                Quiero publicar una oportunidad
                            </option>

                            <option value="event">
                                Quiero informar un evento o una corrección
                            </option>

                            <option value="classified">
                                Consulta sobre clasificados
                            </option>

                            <option value="partnership">
                                Alianza / sponsor / colaboración
                            </option>
                        </select>

                        <input
                            type="text"
                            placeholder="Nombre completo *"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <input
                            type="email"
                            placeholder="Email *"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <input
                            type="text"
                            placeholder="Asunto *"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />

                        <textarea
                            placeholder="Mensaje *"
                            rows="6"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />

                        <button
                            className="apply-button"
                            type="submit"
                        >
                            Enviar mensaje
                        </button>

                    </form>

                </div>

                <div className="detail-card contact-info-card">

                    <h2>¿Para qué podés escribir?</h2>

                    <div className="about-list">

                        <p>✅ Sumar un club u organización.</p>

                        <p>✅ Publicar oportunidades náuticas.</p>

                        <p>✅ Informar eventos o correcciones para el calendario oficial.</p>

                        <p>✅ Corregir datos de rankings, clubes o regatas.</p>

                        <p>✅ Consultar por alianzas o sponsors.</p>

                    </div>

                    <hr />

                    <h3>SailJobs LATAM</h3>

                    <p>
                        Plataforma náutica para conectar clubes,
                        profesionales, navegantes y oportunidades en la región.
                    </p>

                </div>

            </div>

        </div>

    );
}

export default Contact;
