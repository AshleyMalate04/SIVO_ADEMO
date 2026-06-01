import { Navigate, Outlet } from "react-router-dom";
import { getAuthUser } from "../lib/storage";
import { roleMatches } from "../constants/roles";

export default function RoleRoute({ allowedRoles = [], children }) {
  const user = getAuthUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !roleMatches(user.role, allowedRoles)) {
    return <Navigate to="/nao-autorizado" replace />;
  }

  return children ?? <Outlet />;
}
