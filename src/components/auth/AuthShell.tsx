"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <div className="absolute top-5 left-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            isDark ? "/locus_full_dark_logo.png" : "/locus_full_light_logo.png"
          }
          alt="Locus"
          style={{ height: "60px", width: "auto", display: "block" }}
        />
      </div>
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
