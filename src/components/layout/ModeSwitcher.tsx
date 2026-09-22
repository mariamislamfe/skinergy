"use client";

import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { User, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";

export function ModeSwitcher({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useAppStore();
  const router = useRouter();

  function switchTo(next: "PERSONAL" | "HEALTHCARE") {
    if (next === mode) return;
    setMode(next);
    router.push(next === "PERSONAL" ? "/home" : "/dashboard");
  }

  return (
    <div
      className={cn(
        "flex items-center rounded-xl bg-[var(--surface-2)] p-1",
        compact ? "text-xs" : "text-sm"
      )}
    >
      <button
        onClick={() => switchTo("PERSONAL")}
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-all",
          mode === "PERSONAL"
            ? "bg-[var(--surface)] text-brand-600 shadow-sm"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        )}
      >
        <User className="h-3.5 w-3.5" />
        {!compact && "Personal"}
      </button>
      <button
        onClick={() => switchTo("HEALTHCARE")}
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-all",
          mode === "HEALTHCARE"
            ? "bg-[var(--surface)] text-brand-600 shadow-sm"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        )}
      >
        <Stethoscope className="h-3.5 w-3.5" />
        {!compact && "Healthcare"}
      </button>
    </div>
  );
}
