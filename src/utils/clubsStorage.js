export function getStoredClubs() {
    const data = localStorage.getItem("storedClubs");

    return data ? JSON.parse(data) : [];
}

export function saveStoredClubs(clubs) {
    localStorage.setItem(
        "storedClubs",
        JSON.stringify(clubs)
    );
}

export function createStoredClub(clubData) {
    const clubs = getStoredClubs();

    const newClub = {
        id: Date.now(),
        name: clubData.name,
        country: clubData.country,
        city: clubData.city,
        website: clubData.website || "#",
        logo: clubData.logo || "/logos/default-club.svg", description: clubData.description || "Club registrado en SailJobs LATAM.",
        createdAt: new Date().toISOString(),
        isVerified: false
    };

    const updatedClubs = [
        ...clubs,
        newClub
    ];

    saveStoredClubs(updatedClubs);

    return newClub;
}

export function getAllClubs(staticClubs) {
    const storedClubs = getStoredClubs();

    return [
        ...staticClubs,
        ...storedClubs
    ];
}

export function updateStoredClub(clubId, updatedData) {
    const clubs = getStoredClubs();

    const updatedClubs = clubs.map((club) => {
        if (Number(club.id) === Number(clubId)) {
            return {
                ...club,
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
        }

        return club;
    });

    saveStoredClubs(updatedClubs);
}