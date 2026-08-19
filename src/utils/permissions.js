import { sameId } from "./idUtils";

export function normalizeUserRole(userOrRole) {
    const role =
        typeof userOrRole === "string"
            ? userOrRole
            : userOrRole?.role;

    if (role === "admin") {
        return "superadmin";
    }

    if (role === "superadmin") {
        return "superadmin";
    }

    if (role === "organization_admin") {
        return "organization_admin";
    }

    if (role === "club") {
        return "club";
    }

    if (typeof userOrRole !== "string" && userOrRole) {
        if (
            userOrRole.entityType === "organization" ||
            (
                userOrRole.organizationId &&
                !userOrRole.clubId
            ) ||
            userOrRole.permissions?.includes("organization_admin")
        ) {
            return "organization_admin";
        }

        if (
            userOrRole.entityType === "club" ||
            userOrRole.clubId
        ) {
            return "club";
        }
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

export function isClubAdmin(user) {
    if (!user) {
        return false;
    }

    return normalizeUserRole(user) === "club";
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
        isOrganizationAdmin(user) &&
        sameId(user.organizationId, clubId)
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

export function canReviewEvent(user, event) {
    return Boolean(user && event && isSuperadmin(user));
}

export function canManageEvent(user, event) {
    return Boolean(user && event && isSuperadmin(user));
}
