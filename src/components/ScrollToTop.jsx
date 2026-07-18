import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
    const { pathname, search } = useLocation();

    useEffect(() => {
        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }
    }, []);

    useEffect(() => {
        function goToTop() {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "auto"
            });
        }

        goToTop();

        const frame = requestAnimationFrame(goToTop);
        const timeout = setTimeout(goToTop, 50);

        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timeout);
        };
    }, [pathname, search]);

    return null;
}

export default ScrollToTop;