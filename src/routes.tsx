import { createBrowserRouter, Navigate } from "react-router";

function Placeholder({ title }: { title: string }) {
  return <div className="p-8 text-xl font-semibold">{title}</div>;
}

export const router = createBrowserRouter([
  { path: "/login", element: <Placeholder title="Login" /> },
  { path: "/register", element: <Placeholder title="Register" /> },
  { path: "/new", element: <Placeholder title="New answer" /> },
  { path: "/s/:id", element: <Placeholder title="Submission" /> },
  { path: "/progress", element: <Placeholder title="Progress" /> },
  { path: "/", element: <Navigate to="/new" replace /> },
  { path: "*", element: <Placeholder title="Page not found" /> },
]);