"use client";

import { useEffect, useRef } from "react";

// Six boxes backed by one real input, so typing, paste, backspace and the
// phone's numeric keypad / SMS autofill all behave like a normal text field.
export default function PinInput({
  value,
  onChange,
  disabled,
  autoFocus,
  invalid,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus();
  }, [autoFocus, disabled]);

  return (
    <div className="relative" onClick={() => ref.current?.focus()}>
      <div className="flex justify-center gap-2 sm:gap-2.5">
        {Array.from({ length: 6 }, (_, i) => {
          const active = !disabled && i === Math.min(value.length, 5);
          return (
            <div
              key={i}
              className={`w-10 h-14 sm:w-12 sm:h-16 rounded-2xl border-2 bg-white/80 flex items-center justify-center text-2xl text-[#3a332c] transition-colors ${
                invalid ? "border-red-300" : active ? "border-[#e8829e]" : "border-[#f1e7da]"
              } ${disabled ? "opacity-50" : ""}`}
            >
              {value[i] ? "●" : ""}
            </div>
          );
        })}
      </div>
      <input
        ref={ref}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
}
