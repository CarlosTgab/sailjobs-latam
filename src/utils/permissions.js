export function normalizeUserRole(userOrRole) {
    const role =
        typeof userOrRole === "string"
            ? userOrRole
            : userOrRole?.role;

    // Compatibilidad temporal con el rol anterior.
    if (role === "admin") {
        return "superadmin";
    }

    return role;
}

export function isSuperadmin(user) {
    return normalizeUserRole(user) === "superadmin";
}

export function isOrganizationAdmin(user) {
    return normalizeUserRole(user) === "organization_admin";
}

export function canManageClub(user, clubId) {
    if (!user) {
        return false;
    }

    if (isSuperadmin(user)) {
        return true;
    }

    return (
        normalizeUserRole(user) === "club" &&
        Number(user.clubId) === Number(clubId)
    );
}

export function canManageOrganization(user, organizationId) {
    if (!user) {
        return false;
    }

    if (isSuperadmin(user)) {
        return true;
    }

    return (
        isOrganizationAdmin(user) &&
        Number(user.organizationId) === Number(organizationId)
    );
}

export function canManageSailingClass(user, className) {
    if (!user || !className) {
        return false;
    }

    if (isSuperadmin(user)) {
        return true;
    }

    return (
        isOrganizationAdmin(user) &&
        Array.isArray(user.managedClasses) &&
        user.managedClasses.includes(className)
    );
}

export function canReviewEvent(user, event) {
    if (!user || !event) {
        return false;
    }

    if (isSuperadmin(user)) {
        return true;
    }

    return canManageSailingClass(user, event.className);
}