"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatRelativeDay } from "@/lib/utils";

interface Point {
  capturedAt: Date;
  rednessIdx: number | null;
  temperatureC: number | null;
  areaCm2: number | null;
}

export function ProgressChart({ scans }: { scans: Point[] }) {
  if (scans.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-[var(--muted)]">
        At least two scans are needed to chart a trend.
      </p>
    );
  }

  const data = scans.map((s) => ({
    date: formatRelativeDay(s.capturedAt),
    Redness: s.rednessIdx,
    "Area (cm²)": s.areaCm2,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="Redness" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Area (cm²)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
