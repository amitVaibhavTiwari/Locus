"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface StoryPointPickerProps {
  value: number | null;
  onChange: (v: number | null) => void;
}

export function StoryPointPicker({ value, onChange }: StoryPointPickerProps) {
  const [raw, setRaw] = useState(() => (value !== null ? String(value) : ""));

  const handleChange = (s: string) => {
    if (s !== "" && !/^\d*\.?\d*$/.test(s)) return;
    setRaw(s);
    if (!s) {
      onChange(null);
      return;
    }
    const n = parseFloat(s);
    if (!isNaN(n)) onChange(n);
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder="e.g. 3 or 1.5 (leave empty to skip)"
      value={raw}
      onChange={(e) => handleChange(e.target.value)}
      className="max-w-64"
    />
  );
}
