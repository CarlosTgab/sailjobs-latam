import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
    syncSupabaseSession,
    logoutWithSupabase
} from "../utils/supabaseAuth";

function AuthSync() {
    useEffect(() => {
        syncSupabaseSession()
            .catch(() => {
                // Evitamos romper la app si todavía no hay sesión.
            });

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session?.user) {
                    syncSupabaseSession()
                        .catch(() => {});
                } else {
                    logoutWithSupabase()
                        .catch(() => {});
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return null;
}

export default AuthSync;