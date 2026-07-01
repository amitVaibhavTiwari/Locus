"use client";
import React from "react";
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
import { Save, Sun, Moon, Pipette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceStore, ThemeColor } from "@/stores/workspaceStore";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const themeColors: { value: ThemeColor; label: string; hsl: string }[] = [
  { value: "orange", label: "Orange", hsl: "25 95% 53%" },
  { value: "blue", label: "Blue", hsl: "221 83% 53%" },
  { value: "green", label: "Green", hsl: "142 76% 36%" },
  { value: "purple", label: "Purple", hsl: "262 83% 58%" },
  { value: "red", label: "Red", hsl: "0 84% 60%" },
];

// Helper to convert hex to HSL
function hexToHsl(hex: string): string {
  hex = hex.replace(/^#/, "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
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

// Helper to convert HSL to hex
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

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const Settings = () => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const {
    workspaceName,
    themeColor,
    customAccentColor,
    setWorkspaceName,
    setThemeColor,
    setCustomAccentColor,
  } = useWorkspaceStore();

  const [localWorkspaceName, setLocalWorkspaceName] =
    React.useState(workspaceName);
  const [allowAdminInvite, setAllowAdminInvite] = React.useState(false);
  const [customColorHex, setCustomColorHex] = React.useState(() =>
    hslToHex(customAccentColor),
  );

  const applyThemeColor = React.useCallback((hsl: string) => {
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--ring", hsl);
    document.documentElement.style.setProperty("--sidebar-ring", hsl);
  }, []);

  const handleSave = () => {
    setWorkspaceName(localWorkspaceName);
    toast({
      title: "Settings saved",
      description: "Your workspace settings have been updated successfully.",
    });
  };

  const handleThemeChange = (color: ThemeColor) => {
    setThemeColor(color);
    if (color === "custom") {
      applyThemeColor(customAccentColor);
    } else {
      const selectedTheme = themeColors.find((t) => t.value === color);
      if (selectedTheme) {
        applyThemeColor(selectedTheme.hsl);
      }
    }
    toast({
      title: "Theme updated",
      description: `Theme color changed to ${color}.`,
    });
  };

  const handleCustomColorChange = (hexColor: string) => {
    setCustomColorHex(hexColor);
    const hslColor = hexToHsl(hexColor);
    setCustomAccentColor(hslColor);
    if (themeColor === "custom") {
      applyThemeColor(hslColor);
    }
  };

  // Apply theme on mount
  React.useEffect(() => {
    if (themeColor === "custom") {
      applyThemeColor(customAccentColor);
    } else {
      const selectedTheme = themeColors.find((t) => t.value === themeColor);
      if (selectedTheme) {
        applyThemeColor(selectedTheme.hsl);
      }
    }
  }, [themeColor, customAccentColor, applyThemeColor]);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace settings and preferences
        </p>
      </div>

      <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of your workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="space-y-3 pt-4 border-t">
            <Label>Accent Color</Label>
            <div className="flex flex-wrap gap-2">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleThemeChange(color.value)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    themeColor === color.value
                      ? "border-foreground scale-110 shadow-md"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: `hsl(${color.hsl})` }}
                  title={color.label}
                />
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      if (themeColor !== "custom") {
                        handleThemeChange("custom");
                      }
                    }}
                    className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                      themeColor === "custom"
                        ? "border-foreground scale-110 shadow-md"
                        : "border-border hover:scale-105 hover:border-muted-foreground"
                    }`}
                    style={{
                      backgroundColor:
                        themeColor === "custom"
                          ? `hsl(${customAccentColor})`
                          : "transparent",
                    }}
                    title="Custom color"
                  >
                    {themeColor !== "custom" && (
                      <Pipette className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Custom Accent Color
                    </Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColorHex}
                        onChange={(e) =>
                          handleCustomColorChange(e.target.value)
                        }
                        className="w-12 h-12 rounded-md cursor-pointer border-0 p-0"
                      />
                      <div className="flex flex-col gap-1">
                        <Input
                          value={customColorHex}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                              setCustomColorHex(val);
                              if (val.length === 7) {
                                handleCustomColorChange(val);
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
                    <Button
                      size="sm"
                      onClick={() => handleThemeChange("custom")}
                      className="w-full"
                    >
                      Apply Color
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {themeColor === "custom" && (
              <p className="text-xs text-muted-foreground">
                Using custom color: {customColorHex}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>Configure your workspace details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              value={localWorkspaceName}
              onChange={(e) => setLocalWorkspaceName(e.target.value)}
              placeholder="Enter workspace name"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="admin-invite" className="text-sm font-medium">
                Allow admins to invite members to workspace
              </Label>
              <p className="text-xs text-muted-foreground">
                When disabled, only super admins can invite new members
              </p>
            </div>
            <Switch
              id="admin-invite"
              checked={allowAdminInvite}
              onCheckedChange={setAllowAdminInvite}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Settings;
