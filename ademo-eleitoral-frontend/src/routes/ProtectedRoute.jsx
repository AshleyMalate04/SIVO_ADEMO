import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../lib/storage";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
