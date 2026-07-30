import { useEffect } from "react";

import staticJobs from "../data/jobs";
import { syncJobsFromSupabase } from "../utils/jobsStorage";

function JobsSync() {
    useEffect(() => {
        let isMounted = true;

        async function syncJobs() {
            try {
                if (isMounted) {
                    await syncJobsFromSupabase(staticJobs);
                }
            } catch {
                // La app puede seguir funcionando con datos estáticos/locales.
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
