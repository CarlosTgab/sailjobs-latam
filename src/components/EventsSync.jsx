import { useEffect } from "react";

import staticEvents from "../data/events";
import { syncEventsFromSupabase } from "../utils/eventsStorage";

function EventsSync() {
    useEffect(() => {
        let isMounted = true;

        async function syncEvents() {
            try {
                if (isMounted) {
                    await syncEventsFromSupabase(staticEvents);
                }
            } catch {
                // La app puede seguir funcionando con datos estáticos/locales.
            }
        }

        syncEvents();

        return () => {
            isMounted = false;
        };
    }, []);

    return null;
}

export default EventsSync;
