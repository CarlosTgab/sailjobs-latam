import {
    Navigate,
    useParams
} from "react-router-dom";

import {
    getCurrentUser,
    hasProfile,
    hasProfessionalProfile
} from "../utils/authStorage";

import {
    canManageClub,
    normalizeUserRole
} from "../utils/permissions";

export function RequireAuth({ children }) {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
}

export function RequireRole({
    children,
    roles
}) {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    const allowedRoles =
        Array.isArray(roles)
            ? roles
            : [roles];

    const normalizedAllowedRoles =
        allowedRoles.map(
            role =>
                normalizeUserRole(role)
        );

    const currentRole =
        normalizeUserRole(
            currentUser
        );

    if (
        !normalizedAllowedRoles.includes(
            currentRole
        )
    ) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return children;
}

export function RequireProfile({
    children,
    profile
}) {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    const profileIsActive =
        profile === "professional"
            ? hasProfessionalProfile(
                currentUser
            )
            : hasProfile(
                currentUser,
                profile
            );

    if (!profileIsActive) {
        return (
            <Navigate
                to="/user-dashboard"
                replace
            />
        );
    }

    return children;
}

export function RequireClubAccess({
    children
}) {

    const { clubId } =
        useParams();

    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (
        !canManageClub(
            currentUser,
            clubId
        )
    ) {
        return (
            <Navigate
                to="/clubs"
                replace
            />
        );
    }

    return children;
}