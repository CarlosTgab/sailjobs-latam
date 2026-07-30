import { sameId } from "./idUtils";

function normalizeName(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

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

export function getUserOrganizationName(user) {
    return (
        user?.organizationName ||
        user?.entityName ||
        user?.name ||
        ""
    );
}

export function canReviewEvent(user, event) {
    if (!user || !event) {
        return false;
    }

    if (isSuperadmin(user)) {
        return true;
    }

    if (!isOrganizationAdmin(user)) {
        return false;
    }

    const organizationId =
        user.organizationId ||
        user.entityId ||
        null;

    const organizationName =
        normalizeName(getUserOrganizationName(user));

    if (
        organizationId &&
        (
            sameId(event.reviewingOrganizationId, organizationId) ||
            sameId(event.organizationId, organizationId) ||
            sameId(event.ownerId, organizationId)
        )
    ) {
        return true;
    }

    if (
        organizationName &&
        (
            normalizeName(event.reviewingOrganizationName) === organizationName ||
            normalizeName(event.organizationName) === organizationName ||
            normalizeName(event.ownerName) === organizationName ||
            normalizeName(event.source) === organizationName
        )
    ) {
        return true;
    }

    return false;
}

export function canManageEvent(user, event) {
    if (!user || !event) {
        return false;
    }

    if (isSuperadmin(user)) {
        return true;
    }

    if (canReviewEvent(user, event)) {
        return true;
    }

    const isProposalStillEditable =
        !event.status ||
        [
            "draft",
            "pending",
            "pending_review",
            "changes_requested",
            "rejected"
        ].includes(event.status);

    if (
        isClubAdmin(user) &&
        isProposalStillEditable &&
        (
            sameId(event.proposedById, user.clubId) ||
            sameId(event.clubId, user.clubId)
        )
    ) {
        return true;
    }

    return false;
}
