import { createBrowserRouter, Navigate } from "react-router";

import { GuestRoute, ProtectedRoute } from "@/auth/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ComposePage from "@/features/compose/ComposePage";
import SubmissionRoute from "@/features/submission/SubmissionPage";
import ProgressPage from "@/features/progress/ProgressPage";

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
          { path: "/new", element: <ComposePage /> },
          { path: "/s/:id", element: <SubmissionRoute /> },
          { path: "/progress", element: <ProgressPage /> },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/new" replace /> },
  { path: "*", element: <Placeholder title="Page not found" /> },
]);