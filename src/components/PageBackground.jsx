import { useEffect } from "react";

function PageBackground() {

    useEffect(() => {

        function handlePointerMove(event) {
            const x =
                (event.clientX / window.innerWidth - 0.5) * 28;

            const y =
                (event.clientY / window.innerHeight - 0.5) * 28;

            document.documentElement.style.setProperty(
                "--page-bg-x",
                `${x}px`
            );

            document.documentElement.style.setProperty(
                "--page-bg-y",
                `${y}px`
            );

            document.documentElement.style.setProperty(
                "--page-glow-x",
                `${event.clientX}px`
            );

            document.documentElement.style.setProperty(
                "--page-glow-y",
                `${event.clientY}px`
            );
        }

        window.addEventListener(
            "pointermove",
            handlePointerMove
        );

        return () => {
            window.removeEventListener(
                "pointermove",
                handlePointerMove
            );
        };

    }, []);

    return (
        <div
            className="page-background"
            aria-hidden="true"
        >
            <div className="page-background-image" />
            <div className="page-background-glow" />
            <div className="page-background-soft-overlay" />
        </div>
    );
}

export default PageBackground;