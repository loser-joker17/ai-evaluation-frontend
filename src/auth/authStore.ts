import { create } from "zustand";

import type { AuthResponse, User } from "@/api/types";

// "loading": we don't know yet (app just opened, session restore running).
export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;   // memory only: never written to localStorage
  user: User | null;
  setSession: (response: AuthResponse) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: "loading",
  accessToken: null,
  user: null,
  setSession: (response) =>
    set({ status: "authenticated", accessToken: response.accessToken, user: response.user }),
  clear: () => set({ status: "anonymous", accessToken: null, user: null }),
}));