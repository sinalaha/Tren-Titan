"use client";

import { type HTMLMotionProps, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  glow?: "blue" | "purple" | "crimson" | "cyan" | "none";
  hover?: boolean;
}

export function GlassCard({
  className,
  glow = "none",
  hover = true,
  children,
  ...props
}: GlassCardProps) {
  const glowMap = {
    blue: "hover:shadow-[0_0_30px_rgba(0,212,255,0.2)] hover:border-[rgba(0,212,255,0.3)]",
    purple: "hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:border-[rgba(168,85,247,0.3)]",
    crimson: "hover:shadow-[0_0_30px_rgba(255,45,85,0.2)] hover:border-[rgba(255,45,85,0.3)]",
    cyan: "hover:shadow-[0_0_30px_rgba(0,255,231,0.2)] hover:border-[rgba(0,255,231,0.3)]",
    none: ""
  };

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl",
        "transition-all duration-300",
        hover && glowMap[glow],
        className
      )}
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
