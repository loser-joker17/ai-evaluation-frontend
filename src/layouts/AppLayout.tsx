import { Outlet, useNavigate } from "react-router";

import { useAuthStore } from "@/auth/authStore";
import { logout } from "@/auth/session";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold">UPSC Answer Evaluator</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>Log out</Button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}