import { Navigate, Outlet, useLocation } from "react-router";

import { useAuthStore } from "@/auth/authStore";
import { FullScreenSpinner } from "@/components/FullScreenSpinner";

/** Pages for logged-in users. Others go to /login, and come back here afterwards. */
export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === "loading") {
    return <FullScreenSpinner />;
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Login/register: a logged-in user is sent straight into the app. */
export function GuestRoute() {
  const status = useAuthStore((state) => state.status);

  if (status === "loading") {
    return <FullScreenSpinner />;
  }
  if (status === "authenticated") {
    return <Navigate to="/new" replace />;
  }
  return <Outlet />;
}