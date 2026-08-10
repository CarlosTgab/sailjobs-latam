import {
    isSuperadmin,
    isOrganizationAdmin,
    isClubAdmin,
    normalizeUserRole
} from "../utils/permissions";

export const EXPERIENCE_TYPES = {
    VISITOR: "visitor",
    USER: "user",
    PROFESSIONAL: "professional",
    CLUB: "club",
    ORGANIZATION: "organization",
    SUPERADMIN: "superadmin"
};

function hasActiveProfessionalProfile(user) {
    if (!user) {
        return false;
    }

    const profiles = Array.isArray(user.profiles)
        ? user.profiles
        : [];

    return (
        profiles.includes("professional") &&
        user.professionalProfile?.active === true
    );
}

export function getExperienceType(user) {
    if (!user) {
        return EXPERIENCE_TYPES.VISITOR;
    }

    if (isSuperadmin(user)) {
        return EXPERIENCE_TYPES.SUPERADMIN;
    }

    if (isOrganizationAdmin(user)) {
        return EXPERIENCE_TYPES.ORGANIZATION;
    }

    if (isClubAdmin(user)) {
        return EXPERIENCE_TYPES.CLUB;
    }

    const role = normalizeUserRole(user);

    if (
        role === "coach" ||
        role === "professional" ||
        hasActiveProfessionalProfile(user)
    ) {
        return EXPERIENCE_TYPES.PROFESSIONAL;
    }

    return EXPERIENCE_TYPES.USER;
}

export function isInstitutionalExperience(user) {
    const experienceType = getExperienceType(user);

    return (
        experienceType === EXPERIENCE_TYPES.CLUB ||
        experienceType === EXPERIENCE_TYPES.ORGANIZATION ||
        experienceType === EXPERIENCE_TYPES.SUPERADMIN
    );
}

export function shouldFeatureClassifieds(user) {
    const experienceType = getExperienceType(user);

    return (
        experienceType === EXPERIENCE_TYPES.VISITOR ||
        experienceType === EXPERIENCE_TYPES.USER ||
        experienceType === EXPERIENCE_TYPES.PROFESSIONAL
    );
}

export function getPrimaryDashboardPath(user) {
    const experienceType = getExperienceType(user);

    if (experienceType === EXPERIENCE_TYPES.SUPERADMIN) {
        return "/superadmin";
    }

    if (experienceType === EXPERIENCE_TYPES.ORGANIZATION) {
        return "/organization-admin";
    }

    if (experienceType === EXPERIENCE_TYPES.CLUB) {
        return user?.clubId
            ? `/club-dashboard/${user.clubId}`
            : "/clubs";
    }

    return user
        ? "/profile"
        : "/";
}

export function getExperienceLabel(user) {
    const experienceType = getExperienceType(user);

    if (experienceType === EXPERIENCE_TYPES.SUPERADMIN) {
        return "Superadmin";
    }

    if (experienceType === EXPERIENCE_TYPES.ORGANIZATION) {
        return "Organización náutica";
    }

    if (experienceType === EXPERIENCE_TYPES.CLUB) {
        return "Club náutico";
    }

    if (experienceType === EXPERIENCE_TYPES.PROFESSIONAL) {
        return "Profesional náutico";
    }

    if (experienceType === EXPERIENCE_TYPES.USER) {
        return "Usuario";
    }

    return "Visitante";
}

export function getNavbarLinksForUser(user) {
    const experienceType = getExperienceType(user);

    if (experienceType === EXPERIENCE_TYPES.SUPERADMIN) {
        return [
            { to: "/", label: "Inicio" },
            { to: "/superadmin", label: "Panel admin" },
            { to: "/admin/events", label: "Eventos" },
            { to: "/admin/jobs", label: "Oportunidades" },
            { to: "/admin/classifieds", label: "Clasificados" },
            { to: "/admin/messages", label: "Mensajes" }
        ];
    }

    if (experienceType === EXPERIENCE_TYPES.ORGANIZATION) {
        return [
            { to: "/", label: "Inicio" },
            { to: "/calendar", label: "Calendario" },
            { to: "/jobs", label: "Oportunidades" },
            { to: "/professionals", label: "Profesionales" },
            { to: "/clubs", label: "Clubes" },
            { to: "/organization-admin", label: "Mi organización" }
        ];
    }

    if (experienceType === EXPERIENCE_TYPES.CLUB) {
        const clubPath = user?.clubId
            ? `/club-dashboard/${user.clubId}`
            : "/clubs";

        return [
            { to: "/", label: "Inicio" },
            { to: "/calendar", label: "Calendario" },
            { to: "/jobs", label: "Oportunidades" },
            { to: "/professionals", label: "Profesionales" },
            { to: "/clubs", label: "Clubes" },
            { to: clubPath, label: "Mi club" }
        ];
    }

    if (experienceType === EXPERIENCE_TYPES.PROFESSIONAL) {
        return [
            { to: "/", label: "Inicio" },
            { to: "/jobs", label: "Oportunidades" },
            { to: "/calendar", label: "Calendario" },
            { to: "/classifieds", label: "Clasificados" },
            { to: "/clubs", label: "Clubes" },
            { to: "/ranking", label: "Ranking" },
            { to: "/profile", label: "Mi perfil" }
        ];
    }

    if (experienceType === EXPERIENCE_TYPES.USER) {
        return [
            { to: "/", label: "Inicio" },
            { to: "/jobs", label: "Oportunidades" },
            { to: "/calendar", label: "Calendario" },
            { to: "/classifieds", label: "Clasificados" },
            { to: "/clubs", label: "Clubes" },
            { to: "/ranking", label: "Ranking" },
            { to: "/profile", label: "Mi perfil" }
        ];
    }

    return [
        { to: "/", label: "Inicio" },
        { to: "/jobs", label: "Oportunidades" },
        { to: "/calendar", label: "Calendario" },
        { to: "/classifieds", label: "Clasificados" },
        { to: "/clubs", label: "Clubes" },
        { to: "/ranking", label: "Ranking" },
        { to: "/about", label: "Sobre nosotros" },
        { to: "/contact", label: "Contacto" }
    ];
}

export function getHomeExperienceCopy(user) {
    const experienceType = getExperienceType(user);

    if (experienceType === EXPERIENCE_TYPES.SUPERADMIN) {
        return {
            tag: "Administración global",
            title: "Panel de control de SailJobs LATAM.",
            description: "Moderá eventos, oportunidades, clasificados, mensajes y actividad general de la plataforma."
        };
    }

    if (experienceType === EXPERIENCE_TYPES.ORGANIZATION) {
        return {
            tag: "Modo organización",
            title: "Administrá calendario, eventos y actividad institucional.",
            description: "Revisá propuestas de clubes, publicá eventos oficiales y gestioná convocatorias vinculadas a tu organización náutica."
        };
    }

    if (experienceType === EXPERIENCE_TYPES.CLUB) {
        return {
            tag: "Modo club náutico",
            title: "Gestioná oportunidades, postulaciones y eventos de tu club.",
            description: "Publicá búsquedas, revisá postulaciones recibidas y proponé eventos para que una organización los valide."
        };
    }

    if (experienceType === EXPERIENCE_TYPES.PROFESSIONAL) {
        return {
            tag: "Modo profesional",
            title: "Encontrá oportunidades náuticas y mantené activo tu perfil profesional.",
            description: "Postulate a búsquedas de clubes y organizaciones, actualizá tu experiencia y seguí el calendario de eventos."
        };
    }

    if (experienceType === EXPERIENCE_TYPES.USER) {
        return {
            tag: "Tu espacio náutico",
            title: "Explorá oportunidades, eventos y clasificados de la comunidad.",
            description: "Podés activar tu perfil profesional cuando quieras y empezar a postularte a oportunidades."
        };
    }

    return {
        tag: "Comunidad náutica latinoamericana",
        title: "Oportunidades, convocatorias y profesionales náuticos en un solo lugar.",
        description: "SailJobs LATAM conecta clubes, organizaciones, profesionales, voluntarios y eventos de la comunidad náutica regional."
    };
}

export function getHomeActionsForUser(user) {
    const experienceType = getExperienceType(user);

    if (experienceType === EXPERIENCE_TYPES.SUPERADMIN) {
        return [
            { to: "/superadmin", label: "Ir al panel admin" },
            { to: "/admin/events", label: "Moderar eventos" },
            { to: "/admin/jobs", label: "Moderar oportunidades" }
        ];
    }

    if (experienceType === EXPERIENCE_TYPES.ORGANIZATION) {
        return [
            { to: "/organization-admin", label: "Panel de organización" },
            { to: "/organization-admin/new-event", label: "Publicar evento" },
            { to: "/calendar", label: "Ver calendario" }
        ];
    }

    if (experienceType === EXPERIENCE_TYPES.CLUB) {
        const clubPath = user?.clubId
            ? `/club-dashboard/${user.clubId}`
            : "/clubs";

        return [
            { to: clubPath, label: "Panel del club" },
            {
                to: user?.clubId
                    ? `/club-dashboard/${user.clubId}/new-job`
                    : clubPath,
                label: "Publicar oportunidad"
            },
            {
                to: user?.clubId
                    ? `/club-dashboard/${user.clubId}/new-event`
                    : clubPath,
                label: "Proponer evento"
            }
        ];
    }

    if (experienceType === EXPERIENCE_TYPES.PROFESSIONAL) {
        return [
            { to: "/jobs", label: "Ver oportunidades" },
            { to: "/profile", label: "Mi perfil profesional" },
            { to: "/classifieds", label: "Ver clasificados" }
        ];
    }

    if (experienceType === EXPERIENCE_TYPES.USER) {
        return [
            { to: "/jobs", label: "Ver oportunidades" },
            { to: "/profile", label: "Activar perfil profesional" },
            { to: "/classifieds", label: "Ver clasificados" }
        ];
    }

    return [
        { to: "/jobs", label: "Ver oportunidades" },
        { to: "/signup", label: "Crear cuenta" },
        { to: "/calendar", label: "Ver calendario" }
    ];
}
