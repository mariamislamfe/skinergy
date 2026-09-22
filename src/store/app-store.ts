"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppMode = "PERSONAL" | "HEALTHCARE";

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  chatDrawerOpen: boolean;
  setChatDrawerOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: "PERSONAL",
      setMode: (mode) => set({ mode }),
      mobileNavOpen: false,
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      chatDrawerOpen: false,
      setChatDrawerOpen: (open) => set({ chatDrawerOpen: open }),
    }),
    {
      name: "skinergy-app-store",
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
