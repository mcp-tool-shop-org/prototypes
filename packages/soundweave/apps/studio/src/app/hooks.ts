"use client";

import { useMemo } from "react";
import { useStudioStore } from "./store";
import { reviewPack } from "@soundweave/review";
import type { PackSummary, PackAudit } from "@soundweave/review";

export function useReview(): { summary: PackSummary; audit: PackAudit } {
  const pack = useStudioStore((s) => s.pack);
  return useMemo(() => reviewPack(pack), [pack]);
}
