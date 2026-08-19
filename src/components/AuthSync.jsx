import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

import {
    syncSupabaseSession
} from "../utils/supabaseAuth";

import {
    logout as clearLocalSession
} from "../utils/authStorage";

function AuthSync() {
    useEffect(() => {
        let isMounted = true;

        async function loadInitialSession() {
            try {
                const {
                    data
                } = await supabase.auth.getSession();

                if (!isMounted) {
                    return;
                }

                if (data.session?.user) {
                    await syncSupabaseSession();
                } else {
                    clearLocalSession();
                }
            } catch {
                clearLocalSession();
            }
        }

        loadInitialSession();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                window.setTimeout(async () => {
                    try {
                        if (session?.user) {
                            await syncSupabaseSession();
                        } else {
                            clearLocalSession();
                        }
                    } catch {
                        clearLocalSession();
                    }
                }, 0);
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return null;
}

export default AuthSync;
