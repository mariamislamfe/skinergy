"use client";

import { create } from "zustand";

interface AppState {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  chatDrawerOpen: boolean;
  setChatDrawerOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  chatDrawerOpen: false,
  setChatDrawerOpen: (open) => set({ chatDrawerOpen: open }),
}));
