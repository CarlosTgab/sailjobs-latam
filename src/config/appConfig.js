export const APP_INFO = {
    name: "SailJobs LATAM",
    tagline: "La plataforma náutica de Sudamérica",
    contactEmail: "contacto@sailjobs.lat",
    instagram: "",
    region: "Latinoamérica"
};

export const USER_ROLES = {
    SUPERADMIN: "superadmin",
    ORGANIZATION_ADMIN: "organization_admin",
    CLUB: "club",
    COACH: "coach",
    USER: "user"
};

export const ROLE_LABELS = {
    superadmin: "Superadministrador",
    organization_admin: "Administrador de organización",
    club: "Administrador de club",
    coach: "Profesional náutico",
    user: "Usuario general"
};

export const ENTITY_TYPES = {
    CLUB: "club",
    ORGANIZATION: "organization"
};

export const ENTITY_TYPE_LABELS = {
    club: "Club náutico",
    organization: "Organización náutica"
};

export const ORGANIZATION_TYPES = {
    FEDERATION: "federation",
    CLASS_ASSOCIATION: "class_association",
    REGIONAL_ASSOCIATION: "regional_association",
    EVENT_ORGANIZER: "event_organizer",
    SAILING_SCHOOL: "sailing_school",
    COMPANY: "company",
    OTHER: "other"
};

export const ORGANIZATION_TYPE_LABELS = {
    federation: "Federación",
    class_association: "Asociación de clase",
    regional_association: "Asociación regional",
    event_organizer: "Organizador de eventos",
    sailing_school: "Escuela / academia náutica",
    company: "Empresa / proveedor náutico",
    other: "Otra organización"
};

export const EVENT_STATUS = {
    DRAFT: "draft",
    PENDING: "pending",
    PENDING_REVIEW: "pending_review",
    CHANGES_REQUESTED: "changes_requested",
    APPROVED: "approved",
    PUBLISHED: "published",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
    ARCHIVED: "archived"
};

export const EVENT_STATUS_LABELS = {
    draft: "Borrador",
    pending: "Pendiente de revisión",
    pending_review: "Pendiente de revisión",
    changes_requested: "Cambios solicitados",
    approved: "Publicado",
    published: "Publicado",
    rejected: "Rechazado",
    cancelled: "Cancelado",
    archived: "Archivado"
};

export const APPLICATION_STATUS = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptado",
    REJECTED: "Rechazado"
};

export const SAILING_CLASSES = [
    "Optimist",
    "ILCA 4",
    "ILCA 6",
    "ILCA 7",
    "Snipe",
    "J70",
    "29er",
    "420",
    "Windsurf",
    "Kite",
    "Otro"
];

export const COUNTRIES = [
    "Argentina",
    "Uruguay",
    "Chile",
    "Brasil",
    "Paraguay",
    "Perú",
    "Colombia",
    "Ecuador",
    "México",
    "Otro"
];

export const CLASSIFIED_CATEGORIES = [
    "Barco",
    "Vela",
    "Puntera",
    "Base",
    "Mastil",
    "Botavara",
    "Timón",
    "Orza",
    "Trailer",
    "Indumentaria",
    "Electrónica",
    "Accesorios",
    "Otro"
];

export const JOB_CATEGORIES = [
    "Head Coach",
    "Coach",
    "Assistant Coach",
    "Instructor",

    "Juez",
    "Jurado",
    "Miembro del comité de protestas",
    "Chairman de campeonato",

    "Principal Race Officer",
    "Race Officer",
    "Oficial de regata",
    "Oficial de playa",

    "Medidor",
    "Inspector de equipamiento",

    "Coordinador deportivo",
    "Director técnico",
    "Administración deportiva",

    "Mantenimiento náutico",
    "Marinero / Personal de apoyo",
    "Conductor de gomón",
    "Colocador de marcas",
    "Equipo de seguridad",
    "Equipo de resultados",

    "Voluntario",
    "Prensa y fotografía",
    "Comunicación",

    "Preparador físico",
    "Meteorólogo / Analista",

    "Otro"
];

export const NAUTICAL_PROFILE_ROLES = [
    "Regatista",
    "Entrenador/a",
    "Instructor/a",
    "Oficial de regata",
    "Juez/a o jurado",
    "Medidor/a",
    "Organizador/a de eventos",
    "Personal de apoyo náutico",
    "Voluntario/a",
    "Otro rol náutico"
];

export const PROFESSIONAL_AVAILABILITY_OPTIONS = [
    "Disponible para propuestas",
    "Disponible para trabajos ocasionales",
    "Consultar disponibilidad",
    "No busco trabajo actualmente"
];

export const OPPORTUNITY_TYPES = {
    EMPLOYMENT: "employment",
    EVENT_ROLE: "event_role",
    VOLUNTEER: "volunteer"
};

export const OPPORTUNITY_TYPE_LABELS = {
    employment: "Trabajo profesional",
    event_role: "Cargo técnico de campeonato",
    volunteer: "Voluntariado"
};

export const COMPENSATION_TYPES = {
    PAID: "paid",
    EXPENSES: "expenses",
    VOLUNTEER: "volunteer",
    TO_CONFIRM: "to_confirm"
};

export const COMPENSATION_TYPE_LABELS = {
    paid: "Pago",
    expenses: "Gastos cubiertos",
    volunteer: "Voluntario",
    to_confirm: "A confirmar"
};

export const ELIGIBLE_PROFILE_TYPES = {
    PROFESSIONAL: "professional",
    USER: "user"
};

export const ELIGIBLE_PROFILE_LABELS = {
    professional: "Perfil profesional náutico",
    user: "Usuario general"
};
