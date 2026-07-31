import {
    useCallback,
    useEffect,
    useState
} from "react";

import { supabase } from "../lib/supabaseClient";

import {
    getApplications,
    syncApplicationsFromSupabase
} from "../utils/applicationsStorage";

function useApplications() {
    const [applications, setApplications] =
        useState(() => getApplications());

    const [isLoadingApplications, setIsLoadingApplications] =
        useState(true);

    const [applicationsError, setApplicationsError] =
        useState("");

    const refreshApplications = useCallback(() => {
        setApplications(
            getApplications()
        );
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadApplications() {
            try {
                const { data } =
                    await supabase.auth.getSession();

                if (!data.session) {
                    if (isMounted) {
                        setApplications(
                            getApplications()
                        );
                        setApplicationsError("");
                    }

                    return;
                }

                const syncedApplications =
                    await syncApplicationsFromSupabase();

                if (isMounted) {
                    setApplications(
                        syncedApplications
                    );
                    setApplicationsError("");
                }
            } catch (error) {
                if (isMounted) {
                    setApplications(
                        getApplications()
                    );
                    setApplicationsError(
                        error?.message ||
                        "No se pudieron sincronizar las postulaciones."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoadingApplications(false);
                }
            }
        }

        function handleApplicationsChanged() {
            if (isMounted) {
                refreshApplications();
            }
        }

        loadApplications();

        window.addEventListener(
            "applicationsChanged",
            handleApplicationsChanged
        );

        return () => {
            isMounted = false;

            window.removeEventListener(
                "applicationsChanged",
                handleApplicationsChanged
            );
        };
    }, [refreshApplications]);

    return {
        applications,
        isLoadingApplications,
        applicationsError,
        refreshApplications
    };
}

export default useApplications;
