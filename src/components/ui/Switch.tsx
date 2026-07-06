"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";

export default function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="w-10 h-6 rounded-full relative outline-none transition-colors data-[state=checked]:bg-[var(--brand)] bg-[color-mix(in_srgb,var(--muted)_30%,transparent)]"
      >
        <SwitchPrimitive.Thumb className="block w-4.5 h-4.5 rounded-full bg-white shadow transition-transform translate-x-1 data-[state=checked]:translate-x-[18px]" style={{ width: 18, height: 18 }} />
      </SwitchPrimitive.Root>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}
