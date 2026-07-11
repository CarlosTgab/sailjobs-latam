export function getStoredClassifieds() {
    const data = localStorage.getItem("storedClassifieds");

    return data ? JSON.parse(data) : [];
}

export function saveStoredClassifieds(classifieds) {
    localStorage.setItem(
        "storedClassifieds",
        JSON.stringify(classifieds)
    );
}

export function createStoredClassified(classifiedData) {
    const classifieds = getStoredClassifieds();

    const newClassified = {
        id: Date.now(),
        title: classifiedData.title,
        category: classifiedData.category,
        price: classifiedData.price,
        country: classifiedData.country,
        city: classifiedData.city,
        description: classifiedData.description,
        images: classifiedData.images || [],
        sellerName: classifiedData.sellerName,
        sellerEmail: classifiedData.sellerEmail,
        sellerPhone: classifiedData.sellerPhone || "",
        userId: classifiedData.userId,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        status: "active"
    };

    const updatedClassifieds = [
        ...classifieds,
        newClassified
    ];

    saveStoredClassifieds(updatedClassifieds);

    return newClassified;
}

export function updateStoredClassified(classifiedId, updatedData) {
    const classifieds = getStoredClassifieds();

    const updatedClassifieds = classifieds.map((classified) => {
        if (Number(classified.id) === Number(classifiedId)) {
            return {
                ...classified,
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
        }

        return classified;
    });

    saveStoredClassifieds(updatedClassifieds);
}

export function deleteStoredClassified(classifiedId) {
    const classifieds = getStoredClassifieds();

    const updatedClassifieds = classifieds.filter(
        classified => Number(classified.id) !== Number(classifiedId)
    );

    saveStoredClassifieds(updatedClassifieds);
}

export function getAllClassifieds(staticClassifieds = []) {
    const storedClassifieds = getStoredClassifieds();

    return [
        ...staticClassifieds,
        ...storedClassifieds
    ];
}