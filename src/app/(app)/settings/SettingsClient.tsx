"use client";
import { useActionState, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Sun, Moon, Pipette, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateWorkspaceSettings } from "@/actions/organizations";
import { cn } from "@/lib/utils";

const THEME_COLORS: { value: string; label: string; hsl: string }[] = [
  { value: "orange", label: "Orange", hsl: "25 95% 53%" },
  { value: "blue", label: "Blue", hsl: "221 83% 53%" },
  { value: "green", label: "Green", hsl: "142 76% 36%" },
  { value: "purple", label: "Purple", hsl: "262 83% 58%" },
  { value: "red", label: "Red", hsl: "0 84% 60%" },
];

function hslFromBrandColor(raw: string | null): string {
  if (!raw) return "25 95% 53%";
  return raw
    .replace(/^hsl\(/, "")
    .replace(/\)$/, "")
    .trim();
}

function hexToHsl(hex: string): string {
  hex = hex.replace(/^#/, "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hsl: string): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return "#f97316";
  const h = parseInt(parts[1]) / 360;
  const s = parseInt(parts[2]) / 100;
  const l = parseInt(parts[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface SettingsClientProps {
  initialWorkspaceName: string;
  initialBrandColor: string | null;
  initialAllowAdminInvite: boolean;
}

export function SettingsClient({
  initialWorkspaceName,
  initialBrandColor,
  initialAllowAdminInvite,
}: SettingsClientProps) {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const currentHsl = hslFromBrandColor(initialBrandColor);
  const matchingPreset = THEME_COLORS.find((c) => c.hsl === currentHsl);

  const [selectedPreset, setSelectedPreset] = useState<string>(
    matchingPreset?.value ?? "custom",
  );
  const [activeHsl, setActiveHsl] = useState(currentHsl);
  const [brandColorValue, setBrandColorValue] = useState(`hsl(${currentHsl})`);
  const [customHex, setCustomHex] = useState(() => hslToHex(currentHsl));
  const [allowAdminInvite, setAllowAdminInvite] = useState(
    initialAllowAdminInvite,
  );

  const applyColor = useCallback((hsl: string) => {
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--ring", hsl);
    document.documentElement.style.setProperty("--sidebar-ring", hsl);
    setBrandColorValue(`hsl(${hsl})`);
  }, []);

  const selectPreset = (preset: { value: string; hsl: string }) => {
    setSelectedPreset(preset.value);
    setActiveHsl(preset.hsl);
    applyColor(preset.hsl);
  };

  const selectCustom = (hsl: string) => {
    setSelectedPreset("custom");
    setActiveHsl(hsl);
    applyColor(hsl);
  };

  const [saveState, saveAction, isSaving] = useActionState(
    async (prev: { error?: string } | undefined, formData: FormData) => {
      const result = await updateWorkspaceSettings(prev, formData);
      if (!result?.error) {
        toast({
          title: "Settings saved",
          description: "Workspace settings updated.",
        });
      }
      return result;
    },
    undefined,
  );

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace settings and preferences
        </p>
      </div>

      {/* Appearance — client only, no DB */}
      <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">
                Toggle between light and dark theme
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <form action={saveAction}>
        <input
          type="hidden"
          name="brand_color"
          value={brandColorValue}
          readOnly
        />
        <input
          type="hidden"
          name="allow_admin_invite"
          value={allowAdminInvite ? "1" : "0"}
          readOnly
        />

        <div className="space-y-6">
          <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>
                Configure your workspace details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Workspace name */}
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  name="name"
                  defaultValue={initialWorkspaceName}
                  placeholder="Enter workspace name"
                />
                {saveState?.error && (
                  <p className="text-xs text-destructive">{saveState.error}</p>
                )}
              </div>

              {/* Theme color */}
              <div className="space-y-3 pt-4 border-t">
                <Label>Theme Color</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => selectPreset(color)}
                      title={color.label}
                      className={cn(
                        "w-9 h-9 rounded-full border-2 transition-all",
                        selectedPreset === color.value
                          ? "border-foreground scale-110 shadow-md"
                          : "border-transparent hover:scale-105",
                      )}
                      style={{ backgroundColor: `hsl(${color.hsl})` }}
                    />
                  ))}

                  {/* Custom color picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedPreset !== "custom")
                            selectCustom(activeHsl);
                        }}
                        title="Custom color"
                        className={cn(
                          "w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center",
                          selectedPreset === "custom"
                            ? "border-foreground scale-110 shadow-md"
                            : "border-border hover:scale-105 hover:border-muted-foreground",
                        )}
                        style={{
                          backgroundColor:
                            selectedPreset === "custom"
                              ? `hsl(${activeHsl})`
                              : "transparent",
                        }}
                      >
                        {selectedPreset !== "custom" && (
                          <Pipette className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="start">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Custom Color
                        </Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={customHex}
                            onChange={(e) => {
                              const hex = e.target.value;
                              setCustomHex(hex);
                              const hsl = hexToHsl(hex);
                              selectCustom(hsl);
                            }}
                            className="w-12 h-12 rounded-md cursor-pointer border-0 p-0"
                          />
                          <div className="flex flex-col gap-1">
                            <Input
                              value={customHex}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                  setCustomHex(val);
                                  if (val.length === 7) {
                                    const hsl = hexToHsl(val);
                                    selectCustom(hsl);
                                  }
                                }
                              }}
                              className="w-28 h-8 text-sm font-mono"
                              placeholder="#f97316"
                            />
                            <span className="text-xs text-muted-foreground">
                              Hex color code
                            </span>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Allow admin invite */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Admins can invite members
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, admins can send invitations. Only owners can
                    remove members.
                  </p>
                </div>
                <Switch
                  checked={allowAdminInvite}
                  onCheckedChange={(checked) => setAllowAdminInvite(checked)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
