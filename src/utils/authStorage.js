import { createStoredClub } from "./clubsStorage";
import { sameId } from "./idUtils";

const DEFAULT_PROFESSIONAL_PROFILE = {
    active: false,
    title: "",
    summary: "",
    specialties: [],
    certifications: [],
    experience: [],
    languages: [],
    availability: "",
    phone: "",
    city: "",
    country: "",
    cvFileName: "",
    cvUrl: ""
};

function notifyAuthChange() {
    window.dispatchEvent(new Event("authChanged"));
}

function readLocalStorage(key, fallbackValue) {
    try {
        const data = localStorage.getItem(key);

        return data
            ? JSON.parse(data)
            : fallbackValue;
    } catch (error) {
        console.error(
            `No se pudo leer ${key} desde localStorage.`,
            error
        );

        return fallbackValue;
    }
}

function getProfilesFromLegacyRole(role) {
    if (role === "coach") {
        return [
            "user",
            "professional"
        ];
    }

    if (role === "user") {
        return ["user"];
    }

    return [];
}

function getPermissionsFromLegacyRole(role) {
    if (
        role === "superadmin" ||
        role === "admin"
    ) {
        return ["superadmin"];
    }

    if (role === "organization_admin") {
        return ["organization_admin"];
    }

    return [];
}

export function normalizeUserAccount(user) {
    if (!user) {
        return null;
    }

    const existingProfiles = Array.isArray(user.profiles)
        ? user.profiles
        : [];

    const legacyProfiles = getProfilesFromLegacyRole(
        user.role
    );

    const profiles = [
        ...new Set([
            ...existingProfiles,
            ...legacyProfiles
        ])
    ];

    const existingPermissions = Array.isArray(user.permissions)
        ? user.permissions
        : [];

    const legacyPermissions = getPermissionsFromLegacyRole(
        user.role
    );

    const permissions = [
        ...new Set([
            ...existingPermissions,
            ...legacyPermissions
        ])
    ];

    const professionalIsActive =
        user.role === "coach" ||
        profiles.includes("professional") ||
        user.professionalProfile?.active === true;

    const organizationMemberships =
        Array.isArray(user.organizationMemberships)
            ? [...user.organizationMemberships]
            : [];

    if (user.clubId) {
        const alreadyHasClub = organizationMemberships.some(
            membership =>
                sameId(membership.clubId, user.clubId) ||
                sameId(membership.organizationId, user.clubId)
        );

        if (!alreadyHasClub) {
            organizationMemberships.push({
                clubId: user.clubId,
                organizationId: user.clubId,
                role: "owner",
                entityType: "club"
            });
        }
    }

    if (user.organizationId) {
        const alreadyHasOrganization = organizationMemberships.some(
            membership =>
                sameId(membership.organizationId, user.organizationId) ||
                sameId(membership.clubId, user.organizationId)
        );

        if (!alreadyHasOrganization) {
            organizationMemberships.push({
                clubId: user.organizationId,
                organizationId: user.organizationId,
                role: "owner",
                entityType: "organization"
            });
        }
    }

    return {
        ...user,

        profiles,

        permissions,

        organizationMemberships,

        professionalProfile: {
            ...DEFAULT_PROFESSIONAL_PROFILE,
            ...(user.professionalProfile || {}),
            active: professionalIsActive
        }
    };
}

export function getUsers() {
    const rawUsers = readLocalStorage(
        "users",
        []
    );

    const normalizedUsers = rawUsers.map(
        normalizeUserAccount
    );

    if (
        JSON.stringify(rawUsers) !==
        JSON.stringify(normalizedUsers)
    ) {
        localStorage.setItem(
            "users",
            JSON.stringify(normalizedUsers)
        );
    }

    return normalizedUsers;
}

export function saveUsers(users) {
    const normalizedUsers = users.map(
        normalizeUserAccount
    );

    localStorage.setItem(
        "users",
        JSON.stringify(normalizedUsers)
    );
}

export function getCurrentUser() {
    const rawUser = readLocalStorage(
        "currentUser",
        null
    );

    if (!rawUser) {
        return null;
    }

    const normalizedUser =
        normalizeUserAccount(rawUser);

    if (
        JSON.stringify(rawUser) !==
        JSON.stringify(normalizedUser)
    ) {
        localStorage.setItem(
            "currentUser",
            JSON.stringify(normalizedUser)
        );
    }

    return normalizedUser;
}

export function setCurrentUser(user) {
    const normalizedUser =
        normalizeUserAccount(user);

    localStorage.setItem(
        "currentUser",
        JSON.stringify(normalizedUser)
    );

    notifyAuthChange();
}

export function logout() {
    localStorage.removeItem("currentUser");

    notifyAuthChange();
}

export function hasProfile(
    user,
    profileName
) {
    const normalizedUser =
        normalizeUserAccount(user);

    if (!normalizedUser) {
        return false;
    }

    return normalizedUser.profiles.includes(
        profileName
    );
}

export function hasProfessionalProfile(user) {
    const normalizedUser =
        normalizeUserAccount(user);

    if (!normalizedUser) {
        return false;
    }

    return (
        normalizedUser.profiles.includes(
            "professional"
        ) &&
        normalizedUser.professionalProfile.active === true
    );
}

export function getUserById(userId) {
    return (
        getUsers().find(user =>
            sameId(user.id, userId)
        ) || null
    );
}

export function signup(userData) {
    const users = getUsers();

    const normalizedEmail =
        userData.email
            .trim()
            .toLowerCase();

    const emailAlreadyExists = users.some(
        user =>
            user.email
                .trim()
                .toLowerCase() === normalizedEmail
    );

    if (emailAlreadyExists) {
        return {
            success: false,
            message:
                "Ya existe un usuario con ese email."
        };
    }

    if (userData.password.length < 8) {
        return {
            success: false,
            message:
                "La contraseña debe tener al menos 8 caracteres."
        };
    }

    const hasLetter =
        /[a-zA-Z]/.test(userData.password);

    const hasNumber =
        /[0-9]/.test(userData.password);

    if (!hasLetter || !hasNumber) {
        return {
            success: false,
            message:
                "La contraseña debe tener al menos una letra y un número."
        };
    }

    const selectedAccountType =
        userData.accountType ||
        userData.role ||
        "user";

    let createdClub = null;

    const createsManagedEntity =
        selectedAccountType === "club" ||
        selectedAccountType === "organization";

    if (createsManagedEntity) {
        if (
            !userData.clubName ||
            !userData.clubCountry ||
            !userData.clubCity
        ) {
            return {
                success: false,
                message:
                    selectedAccountType === "club"
                        ? "Completá los datos del club."
                        : "Completá los datos de la organización."
            };
        }

        createdClub = createStoredClub({
            name: userData.clubName,
            entityType: selectedAccountType,
            organizationType:
                selectedAccountType === "club"
                    ? "club"
                    : userData.organizationType || "other",
            country: userData.clubCountry,
            city: userData.clubCity,
            website: userData.clubWebsite,
            description:
                userData.clubDescription,
            logo: userData.clubLogo
        });
    }

    const createsProfessionalProfile =
        selectedAccountType === "coach" ||
        selectedAccountType === "professional";

    let legacyRole = "user";

    if (selectedAccountType === "club") {
        legacyRole = "club";
    }

    if (selectedAccountType === "organization") {
        legacyRole = "organization_admin";
    }

    if (selectedAccountType === "coach") {
        /*
         * Conservamos temporalmente el rol viejo
         * para no romper páginas que todavía no
         * fueron migradas.
         */
        legacyRole = "coach";
    }

    const profiles =
        createsManagedEntity
            ? ["user"]
            : createsProfessionalProfile
                ? [
                    "user",
                    "professional"
                ]
                : ["user"];

    const permissions =
        selectedAccountType === "organization"
            ? ["organization_admin"]
            : [];

    const newUser = normalizeUserAccount({
        id: Date.now() + 1,

        name: userData.name.trim(),

        email: normalizedEmail,

        password: userData.password,

        role: legacyRole,

        clubId:
            selectedAccountType === "club" && createdClub
                ? createdClub.id
                : null,

        clubName:
            selectedAccountType === "club" && createdClub
                ? createdClub.name
                : "",

        organizationId:
            selectedAccountType === "organization" && createdClub
                ? createdClub.id
                : null,

        organizationName:
            selectedAccountType === "organization" && createdClub
                ? createdClub.name
                : "",

        entityId: createdClub
            ? createdClub.id
            : null,

        entityName: createdClub
            ? createdClub.name
            : "",

        entityType:
            createsManagedEntity
                ? selectedAccountType
                : null,

        organizationType:
            selectedAccountType === "club"
                ? "club"
                : userData.organizationType || "",

        profiles,

        permissions,

        organizationMemberships:
            createdClub
                ? [
                    {
                        clubId: createdClub.id,
                        organizationId: createdClub.id,
                        role: "owner",
                        entityType: selectedAccountType
                    }
                ]
                : [],

        professionalProfile: {
            ...DEFAULT_PROFESSIONAL_PROFILE,
            active:
                createsProfessionalProfile
        },

        createdAt:
            new Date().toISOString()
    });

    const updatedUsers = [
        ...users,
        newUser
    ];

    saveUsers(updatedUsers);
    setCurrentUser(newUser);

    return {
        success: true,
        user: newUser
    };
}

export function login(email, password) {
    const users = getUsers();

    const normalizedEmail =
        email.trim().toLowerCase();

    const userFound = users.find(
        user =>
            user.email
                .trim()
                .toLowerCase() ===
            normalizedEmail &&
            user.password === password
    );

    if (!userFound) {
        return {
            success: false,
            message:
                "Email o contraseña incorrectos."
        };
    }

    setCurrentUser(userFound);

    return {
        success: true,
        user: userFound
    };
}

function updateCurrentUserAccount(updatedData) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return null;
    }

    const users = getUsers();

    const updatedUser = normalizeUserAccount({
        ...currentUser,
        ...updatedData,
        updatedAt:
            new Date().toISOString()
    });

    const updatedUsers = users.map(user => {
        if (sameId(user.id, currentUser.id)) {
            return updatedUser;
        }

        return user;
    });

    saveUsers(updatedUsers);
    setCurrentUser(updatedUser);

    return updatedUser;
}

export function updateCurrentUserProfile(
    updatedData
) {
    const restrictedFields = new Set([
        "id",
        "email",
        "password",
        "role",
        "permissions",
        "organizationMemberships",
        "organizationId",
        "organizationName",
        "organizationType",
        "entityId",
        "entityName",
        "entityType",
        "managedClasses",
        "clubId",
        "clubName",
        "profiles",
        "professionalProfile"
    ]);

    const safeUpdatedData =
        Object.fromEntries(
            Object.entries(updatedData).filter(
                ([key]) =>
                    !restrictedFields.has(key)
            )
        );

    return updateCurrentUserAccount(
        safeUpdatedData
    );
}

export function activateProfessionalProfile(
    initialData = {}
) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return null;
    }

    const normalizedUser =
        normalizeUserAccount(currentUser);

    const updatedProfiles = [
        ...new Set([
            ...normalizedUser.profiles,
            "user",
            "professional"
        ])
    ];

    return updateCurrentUserAccount({
        profiles: updatedProfiles,

        professionalProfile: {
            ...normalizedUser.professionalProfile,
            ...initialData,
            active: true
        }
    });
}

export function updateProfessionalProfile(
    updatedData
) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return null;
    }

    const normalizedUser =
        normalizeUserAccount(currentUser);

    const updatedProfiles = [
        ...new Set([
            ...normalizedUser.profiles,
            "user",
            "professional"
        ])
    ];

    return updateCurrentUserAccount({
        profiles: updatedProfiles,

        professionalProfile: {
            ...normalizedUser.professionalProfile,
            ...updatedData,
            active: true
        }
    });
}