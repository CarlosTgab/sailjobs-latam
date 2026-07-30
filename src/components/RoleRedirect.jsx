import { Navigate } from "react-router-dom";

import { getCurrentUser } from "../utils/authStorage";
import { getPrimaryDashboardPath } from "../config/roleExperience";

function RoleRedirect() {
    const currentUser = getCurrentUser();

    return (
        <Navigate
            to={getPrimaryDashboardPath(currentUser)}
            replace
        />
    );
}

export default RoleRedirect;
