"use client";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { useWorkspaceStore, ThemeColor } from "@/stores/workspaceStore";
import { useTheme } from "@/contexts/ThemeContext";
import { Check, Monitor, Moon, Sun, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createWorkspace } from "@/actions/organizations";

const THEME_COLORS: { value: ThemeColor; label: string; hsl: string }[] = [
  { value: "orange", label: "Orange", hsl: "25 95% 53%" },
  { value: "blue", label: "Blue", hsl: "221 83% 53%" },
  { value: "green", label: "Green", hsl: "142 76% 36%" },
  { value: "purple", label: "Purple", hsl: "262 83% 58%" },
  { value: "red", label: "Red", hsl: "0 84% 60%" },
];

type AppearanceMode = "light" | "dark" | "system";

const appHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      .host;
  } catch {
    return "localhost:3000";
  }
})();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function CreateWorkspace() {
  const setThemeColor = useWorkspaceStore((s) => s.setThemeColor);
  const storeTheme = useWorkspaceStore((s) => s.themeColor);
  const { setTheme: setAppTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState<ThemeColor>(
    storeTheme === "custom" ? "green" : storeTheme,
  );
  const [appearance, setAppearance] = useState<AppearanceMode>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as AppearanceMode) || "system";
  });
  const [slugTouched, setSlugTouched] = useState(false);

  const autoSlug = useMemo(() => slugify(name) || "your-workspace", [name]);
  const effectiveSlug = slugTouched ? slug : autoSlug;

  useEffect(() => {
    const c = THEME_COLORS.find((t) => t.value === theme);
    if (c) {
      document.documentElement.style.setProperty("--primary", c.hsl);
      document.documentElement.style.setProperty("--ring", c.hsl);
    }
  }, [theme]);

  useEffect(() => {
    if (appearance === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setAppTheme(isDark ? "dark" : "light");
    } else {
      setAppTheme(appearance);
    }
  }, [appearance, setAppTheme]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter a workspace name");

    setThemeColor(theme);
    localStorage.setItem("theme", appearance);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("slug", effectiveSlug);
    const brandColorHsl =
      THEME_COLORS.find((t) => t.value === theme)?.hsl ?? "25 95% 53%";
    formData.set("brand_color", `hsl(${brandColorHsl})`);

    startTransition(async () => {
      const result = await createWorkspace(undefined, formData);
      if (result?.errors?.slug?.[0]) toast.error(result.errors.slug[0]);
      else if (result?.errors?.name?.[0]) toast.error(result.errors.name[0]);
      else if (result?.error) toast.error(result.error);
    });
  };

  const appearanceOptions: {
    value: AppearanceMode;
    label: string;
    icon: React.ElementType;
  }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <AuthShell>
      <form onSubmit={submit} className="space-y-7">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Step 1 of 2
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up your workspace and pick a look that fits your team.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            Workspace name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Inc."
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Workspace URL</Label>
          <div className="flex items-stretch rounded-sm border border-input bg-background overflow-hidden focus-within:border-primary">
            <span className="px-3 text-sm text-muted-foreground bg-muted/40 border-r border-input flex items-center">
              {appHost}/
            </span>
            <input
              id="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="flex-1 h-10 px-3 bg-transparent text-sm outline-none"
              placeholder="acme"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Theme color</Label>
          <div className="flex items-center gap-3">
            {THEME_COLORS.map((c) => {
              const active = theme === c.value;
              return (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setTheme(c.value)}
                  aria-label={c.label}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    active
                      ? "ring-2 ring-offset-2 ring-offset-background ring-foreground/40"
                      : "hover:scale-110",
                  )}
                  style={{ backgroundColor: `hsl(${c.hsl})` }}
                >
                  {active && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Used across buttons, links, and highlights.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Appearance</Label>
          <div className="grid grid-cols-3 gap-2">
            {appearanceOptions.map((opt) => {
              const Icon = opt.icon;
              const active = appearance === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setAppearance(opt.value)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 rounded-sm border text-sm transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
