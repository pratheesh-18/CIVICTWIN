"use client";

import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, disabled }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("");

  useEffect(() => {
    // Focus the first empty input or the first input on initial render
    const firstEmptyIndex = digits.findIndex((d) => !d);
    const indexToFocus = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    if (inputsRef.current[indexToFocus] && !disabled) {
      inputsRef.current[indexToFocus]?.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const char = e.target.value.replace(/\D/g, "");
    if (!char) {
      // Cleared
      const newDigits = [...digits];
      newDigits[idx] = "";
      onChange(newDigits.join(""));
      return;
    }

    const lastChar = char.slice(-1);
    const newDigits = [...digits];
    while (newDigits.length < 6) newDigits.push("");
    newDigits[idx] = lastChar;
    const finalVal = newDigits.slice(0, 6).join("");
    onChange(finalVal);

    // Auto-advance
    if (idx < 5 && lastChar) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, 5);
      inputsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((idx) => {
        const val = digits[idx] || "";
        return (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="one-time-code"
            disabled={disabled}
            value={val}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            aria-label={`Digit ${idx + 1} of 6`}
            className="w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold font-mono text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
          />
        );
      })}
    </div>
  );
};
