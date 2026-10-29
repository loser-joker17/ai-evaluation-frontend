import { authApi } from "@/api/auth";
import { refreshSession } from "@/api/client";
import type { AuthResponse } from "@/api/types";
import { useAuthStore } from "@/auth/authStore";
import { queryClient } from "@/lib/queryClient";
import { clearAllDrafts } from "@/features/compose/draft";

// Keeps tabs in sync: logging in or out in one tab does the same in the others.
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("auth") : null;

channel?.addEventListener("message", (event: MessageEvent<string>) => {
  if (event.data === "logout") {
    endSessionLocally();
  } else if (event.data === "login") {
    // The other tab has a new refresh cookie; get our own access token from it.
    void refreshSession().catch(() => undefined);
  }
});

/** Call after a successful login or register. */
export function startSession(response: AuthResponse) {
  useAuthStore.getState().setSession(response);
  channel?.postMessage("login");
}

export async function logout() {
  try {
    await authApi.logout();
  } catch {
    // Even if the server can't be reached, log out on this device.
  }
  endSessionLocally();
  channel?.postMessage("logout");
}

/** Runs once when the app opens: restores the session from the refresh cookie, if any. */
export async function restoreSession() {
  try {
    await refreshSession();   // sets "authenticated", or clears to "anonymous"
  } catch {
    useAuthStore.getState().clear();   // server unreachable: show the login page
  }
}

function endSessionLocally() {
  useAuthStore.getState().clear();
  queryClient.clear();
  clearAllDrafts();
}
