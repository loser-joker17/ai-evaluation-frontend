import { createBrowserRouter, Navigate } from "react-router";

import { GuestRoute, ProtectedRoute } from "@/auth/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

function Placeholder({ title }: { title: string }) {
  return <div className="text-xl font-semibold">{title}</div>;
}

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/new", element: <Placeholder title="New answer" /> },
          { path: "/s/:id", element: <Placeholder title="Submission" /> },
          { path: "/progress", element: <Placeholder title="Progress" /> },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/new" replace /> },
  { path: "*", element: <Placeholder title="Page not found" /> },
]);