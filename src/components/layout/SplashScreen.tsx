"use client";
import { useEffect, useState } from "react";
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
        "fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500",
        fading ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/locus_logo.png" alt="Locus" width={80} height={80} />
    </div>
  );
}
