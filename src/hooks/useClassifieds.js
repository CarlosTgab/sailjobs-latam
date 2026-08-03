import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    getAllClassifieds,
    getAllClassifiedsForAdmin,
    syncClassifiedsFromSupabase
} from "../utils/classifiedsStorage";

function useClassifieds({ includeHidden = false } = {}) {
    const getCachedClassifieds = useCallback(
        () => includeHidden
            ? getAllClassifiedsForAdmin()
            : getAllClassifieds(),
        [includeHidden]
    );

    const [classifieds, setClassifieds] = useState(getCachedClassifieds);
    const [isLoadingClassifieds, setIsLoadingClassifieds] = useState(true);
    const [classifiedsError, setClassifiedsError] = useState("");

    const refreshClassifieds = useCallback(() => {
        setClassifieds(getCachedClassifieds());
    }, [getCachedClassifieds]);

    useEffect(() => {
        let isMounted = true;

        async function loadClassifieds() {
            try {
                await syncClassifiedsFromSupabase();

                if (isMounted) {
                    setClassifieds(getCachedClassifieds());
                    setClassifiedsError("");
                }
            } catch (error) {
                if (isMounted) {
                    setClassifieds(getCachedClassifieds());
                    setClassifiedsError(
                        error?.message || "No se pudieron cargar los clasificados."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoadingClassifieds(false);
                }
            }
        }

        function handleClassifiedsChanged() {
            if (isMounted) refreshClassifieds();
        }

        loadClassifieds();
        window.addEventListener("classifiedsChanged", handleClassifiedsChanged);

        return () => {
            isMounted = false;
            window.removeEventListener("classifiedsChanged", handleClassifiedsChanged);
        };
    }, [getCachedClassifieds, refreshClassifieds]);

    return {
        classifieds,
        isLoadingClassifieds,
        classifiedsError,
        refreshClassifieds
    };
}

export default useClassifieds;
