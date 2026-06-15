'use client';

import React, { useEffect, useRef, useState } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onComplete, error, disabled }) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (values.every((value) => value !== '')) {
      onComplete(values.join(''));
    }
  }, [values, onComplete]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const nextValues = [...values];
    nextValues[index] = value.slice(-1);
    setValues(nextValues);
    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      const nextValues = [...values];
      nextValues[index - 1] = '';
      setValues(nextValues);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-3">
        {values.map((value, idx) => (
          <input
            key={idx}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value}
            disabled={disabled}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            onChange={(event) => handleChange(idx, event.target.value)}
            onKeyDown={(event) => handleKeyDown(idx, event)}
            className="h-14 w-full rounded-2xl border border-gray-200 bg-white text-center text-xl font-semibold text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none"
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
