import { sameId } from "./idUtils";

export function normalizeUserRole(userOrRole) {
    const role =
        typeof userOrRole === "string"
            ? userOrRole
            : userOrRole?.role;

    if (role === "admin") {
        return "superadmin";
    }

    return role || "user";
}

export function isSuperadmin(user) {
    if (!user) {
        return false;
    }

    const normalizedRole =
        normalizeUserRole(user);

    return (
        normalizedRole === "superadmin" ||
        user.permissions?.includes("superadmin")
    );
}

export function isOrganizationAdmin(user) {
    if (!user) {
        return false;
    }

    const normalizedRole =
        normalizeUserRole(user);

    return (
        normalizedRole === "organization_admin" ||
        user.permissions?.includes("organization_admin")
    );
}

export function canManageClub(user, clubId) {
    if (!user || !clubId) {
        return false;
    }

    if (isSuperadmin(user)) {
        return true;
    }

    if (
        user.role === "club" &&
        sameId(user.clubId, clubId)
    ) {
        return true;
    }

    if (
        Array.isArray(user.organizationMemberships) &&
        user.organizationMemberships.some(membership =>
            sameId(membership.clubId, clubId) ||
            sameId(membership.organizationId, clubId)
        )
    ) {
        return true;
    }

    return false;
}

export function canManageOrganization(user, organizationId) {
    if (!user || !organizationId) {
        return false;
    }

    if (isSuperadmin(user)) {
        return true;
    }

    if (
        isOrganizationAdmin(user) &&
        sameId(user.organizationId, organizationId)
    ) {
        return true;
    }

    if (
        Array.isArray(user.organizationMemberships) &&
        user.organizationMemberships.some(membership =>
            sameId(membership.organizationId, organizationId)
        )
    ) {
        return true;
    }

    return false;
}