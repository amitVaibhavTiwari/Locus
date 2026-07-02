"use client";
import { useEffect, useState } from "react";
import { KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 400);
    const goneTimer = setTimeout(() => setGone(true), 900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-5 transition-opacity duration-500",
        fading ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      <div className="flex items-center gap-3">
        <KanbanSquare className="w-10 h-10 text-primary" />
        <span className="text-2xl font-bold tracking-tight">Locus</span>
      </div>
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
