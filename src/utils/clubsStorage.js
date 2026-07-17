import { sameId } from "./idUtils";

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

function normalizeClub(club) {
    if (!club) {
        return null;
    }

    const id =
        club.id ||
        club.clubId;

    if (!id) {
        return null;
    }

    return {
        id,
        ownerId:
            club.ownerId ||
            club.owner_id ||
            null,
        name:
            club.name ||
            club.clubName ||
            "Club sin nombre",
        country:
            club.country ||
            "",
        city:
            club.city ||
            "",
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

        if (!lowerKey.includes("club")) {
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

    return getStoredClubById(clubId);
}

export function deleteStoredClub(clubId) {
    const updatedClubs =
        getStoredClubs().filter(club =>
            !sameId(club.id, clubId)
        );

    saveStoredClubs(updatedClubs);
}