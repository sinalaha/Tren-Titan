"use client";

import dynamic from "next/dynamic";

const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools), {
        ssr: false
      })
    : function NullDevtools() {
        return null;
      };

export function ReactQueryDevtoolsPanel() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  return <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />;
}
