import { useState } from "react";
import { Outlet } from "react-router";

import { Sidebar } from "@/features/history/Sidebar";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-svh">
      {/* Desktop: fixed sidebar. Mobile: slides in over the page. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r bg-background transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <button aria-label="Open menu" className="text-xl" onClick={() => setMobileOpen(true)}>☰</button>
          <span className="font-semibold">UPSC Answer Evaluator</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}