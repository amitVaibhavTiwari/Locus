"use client";
import React from "react";

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 flex items-center px-6 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
            L
          </div>
          <span className="font-semibold text-sm tracking-tight">Locus</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
