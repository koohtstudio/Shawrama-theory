"use client";
import { Switch as RSwitch } from "radix-ui";

export function Switch({ checked, onCheckedChange, label, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <RSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      disabled={disabled}
      className="relative h-7 w-12 flex-none cursor-pointer rounded-full bg-[#d7c5ae] transition-colors data-[state=checked]:bg-go disabled:opacity-50"
    >
      <RSwitch.Thumb className="block size-[22px] translate-x-[3px] rounded-full bg-white transition-transform duration-300 data-[state=checked]:translate-x-[23px]" />
    </RSwitch.Root>
  );
}
