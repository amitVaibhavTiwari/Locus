"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const fadeTimer = setTimeout(() => setFading(true), 3000);
    const goneTimer = setTimeout(() => setGone(true), 3500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (gone) return null;

  const isDark = mounted && theme === "dark";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500",
        fading ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
      style={{ backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      {mounted && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={
            isDark ? "/locus_full_dark_logo.png" : "/locus_full_light_logo.png"
          }
          alt="Locus"
          width={520}
          height={420}
        />
      )}
    </div>
  );
}
