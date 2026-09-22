"use client";

import { Button } from "@/components/ui/Button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="no-print">
      <Printer className="h-4 w-4" />
      Print / Save as PDF
    </Button>
  );
}
