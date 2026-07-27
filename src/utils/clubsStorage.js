import { sameId } from "./idUtils";
import {
    ENTITY_TYPE_LABELS,
    ORGANIZATION_TYPE_LABELS
} from "../config/appConfig";

const CLUBS_STORAGE_KEY = "sailjobs_custom_clubs";

function readStorageArray(key) {
    try {
        const value = JSON.parse(
            localStorage.getItem(key)
        );

        return Array.isArray(value)
            ? value
            : [];
    } catch {
        return [];
    }
}

export function normalizeEntityType(entityType) {
    if (entityType === "organization") {
        return "organization";
    }

    return "club";
}

export function getEntityType(entity) {
    return normalizeEntityType(
        entity?.entityType ||
        entity?.entity_type ||
        entity?.type
    );
}

export function isClubEntity(entity) {
    return getEntityType(entity) === "club";
}

export function isOrganizationEntity(entity) {
    return getEntityType(entity) === "organization";
}

export function getEntityTypeLabel(entity) {
    return ENTITY_TYPE_LABELS[getEntityType(entity)] || "Organización náutica";
}

export function getOrganizationTypeLabel(entity) {
    const organizationType =
        entity?.organizationType ||
        entity?.organization_type ||
        "";

    return ORGANIZATION_TYPE_LABELS[organizationType] || "Organización náutica";
}

function normalizeClub(club) {
    if (!club) {
        return null;
    }

    const id =
        club.id ||
        club.clubId ||
        club.organizationId;

    if (!id) {
        return null;
    }

    const entityType = normalizeEntityType(
        club.entityType ||
        club.entity_type ||
        club.type ||
        (
            club.role === "organization_admin"
                ? "organization"
                : "club"
        )
    );

    const organizationType =
        club.organizationType ||
        club.organization_type ||
        (
            entityType === "club"
                ? "club"
                : "other"
        );

    return {
        id,

        ownerId:
            club.ownerId ||
            club.owner_id ||
            null,

        name:
            club.name ||
            club.clubName ||
            club.organizationName ||
            (
                entityType === "club"
                    ? "Club sin nombre"
                    : "Organización sin nombre"
            ),

        entityType,
        organizationType,

        country:
            club.country ||
            "",

        countryCode:
            club.countryCode ||
            club.country_code ||
            "",

        state:
            club.state ||
            club.province ||
            club.region ||
            "",

        stateCode:
            club.stateCode ||
            club.state_code ||
            "",

        city:
            club.city ||
            "",

        cityName:
            club.cityName ||
            club.city_name ||
            (
                club.city && String(club.city).includes(",")
                    ? String(club.city).split(",")[0].trim()
                    : club.city || ""
            ),

        description:
            club.description ||
            "",

        website:
            club.website ||
            "",

        logo:
            club.logo ||
            club.logoUrl ||
            club.logo_url ||
            "/logos/default-club.svg",

        logoUrl:
            club.logoUrl ||
            club.logo_url ||
            club.logo ||
            "/logos/default-club.svg",

        status:
            club.status ||
            "active",

        createdAt:
            club.createdAt ||
            club.created_at ||
            new Date().toISOString(),

        updatedAt:
            club.updatedAt ||
            club.updated_at ||
            new Date().toISOString()
    };
}

function getClubLikeArraysFromStorage() {
    const clubs = [];

    Object.keys(localStorage).forEach(key => {
        const lowerKey =
            key.toLowerCase();

        if (
            !lowerKey.includes("club") &&
            !lowerKey.includes("organization")
        ) {
            return;
        }

        const value =
            readStorageArray(key);

        value.forEach(item => {
            const normalized =
                normalizeClub(item);

            if (normalized) {
                clubs.push(normalized);
            }
        });
    });

    return clubs;
}

function uniqueClubs(clubs) {
    const result = [];

    clubs.forEach(club => {
        const normalized =
            normalizeClub(club);

        if (!normalized) {
            return;
        }

        const alreadyExists =
            result.some(existingClub =>
                sameId(
                    existingClub.id,
                    normalized.id
                )
            );

        if (!alreadyExists) {
            result.push(normalized);
        }
    });

    return result;
}

export function getStoredClubs() {
    const primaryClubs =
        readStorageArray(CLUBS_STORAGE_KEY);

    const discoveredClubs =
        getClubLikeArraysFromStorage();

    return uniqueClubs([
        ...primaryClubs,
        ...discoveredClubs
    ]);
}

export function saveStoredClubs(clubs) {
    const normalizedClubs =
        uniqueClubs(clubs);

    localStorage.setItem(
        CLUBS_STORAGE_KEY,
        JSON.stringify(normalizedClubs)
    );

    window.dispatchEvent(
        new Event("clubsChanged")
    );

    return normalizedClubs;
}

export function getAllClubs(staticClubs = []) {
    return uniqueClubs([
        ...staticClubs,
        ...getStoredClubs()
    ]);
}

export function getStoredClubById(clubId) {
    return getStoredClubs().find(club =>
        sameId(club.id, clubId)
    ) || null;
}

export function createStoredClub(clubData) {
    const clubs =
        getStoredClubs();

    const newClub =
        normalizeClub({
            ...clubData,
            id:
                clubData.id ||
                crypto.randomUUID?.() ||
                Date.now(),
            createdAt:
                clubData.createdAt ||
                new Date().toISOString(),
            updatedAt:
                new Date().toISOString()
        });

    const updatedClubs =
        uniqueClubs([
            ...clubs,
            newClub
        ]);

    saveStoredClubs(updatedClubs);

    return newClub;
}

export function upsertStoredClub(clubData) {
    const normalizedClub =
        normalizeClub({
            ...clubData,
            updatedAt:
                new Date().toISOString()
        });

    if (!normalizedClub) {
        return null;
    }

    const clubs =
        getStoredClubs();

    const exists =
        clubs.some(club =>
            sameId(
                club.id,
                normalizedClub.id
            )
        );

    const updatedClubs =
        exists
            ? clubs.map(club =>
                sameId(
                    club.id,
                    normalizedClub.id
                )
                    ? {
                        ...club,
                        ...normalizedClub
                    }
                    : club
            )
            : [
                ...clubs,
                normalizedClub
            ];

    saveStoredClubs(updatedClubs);

    return normalizedClub;
}

export function updateStoredClub(clubId, updatedData) {
    const clubs =
        getStoredClubs();

    const updatedClubs =
        clubs.map(club =>
            sameId(club.id, clubId)
                ? normalizeClub({
                    ...club,
                    ...updatedData,
                    id: club.id,
                    updatedAt:
                        new Date().toISOString()
                })
                : club
        );

    saveStoredClubs(updatedClubs);

    return updatedClubs.find(club =>
        sameId(club.id, clubId)
    ) || null;
}
