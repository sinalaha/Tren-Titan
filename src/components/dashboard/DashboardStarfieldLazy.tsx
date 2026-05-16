"use client";

import nextDynamic from "next/dynamic";

export const DashboardStarfieldLazy = nextDynamic(
  () => import("@/components/three/StarField").then((m) => m.StarField),
  { ssr: false, loading: () => null }
);
