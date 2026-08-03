import { useEffect } from "react";

import { syncJobsFromSupabase } from "../utils/jobsStorage";

function JobsSync() {
    useEffect(() => {
        let isMounted = true;

        async function syncJobs() {
            try {
                if (isMounted) {
                    await syncJobsFromSupabase();
                }
            } catch (error) {
                console.error(
                    "No se pudieron sincronizar las oportunidades desde Supabase.",
                    error
                );
            }
        }

        syncJobs();

        return () => {
            isMounted = false;
        };
    }, []);

    return null;
}

export default JobsSync;
