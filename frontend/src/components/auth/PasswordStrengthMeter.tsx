'use client';

import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

const computeScore = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;
  return score;
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const score = computeScore(password);
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-700'];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Password strength</span>
        <span className="font-semibold text-gray-700">{password ? labels[score - 1] : 'Enter a password'}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full ${colors[Math.max(0, score - 1)]} transition-all duration-300`} style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <div className="grid grid-cols-5 gap-1 text-[9px] text-gray-400 uppercase tracking-[0.25em]">
        <span className={score >= 1 ? 'text-gray-700' : ''}>8+</span>
        <span className={score >= 2 ? 'text-gray-700' : ''}>Upper</span>
        <span className={score >= 3 ? 'text-gray-700' : ''}>Lower</span>
        <span className={score >= 4 ? 'text-gray-700' : ''}>Number</span>
        <span className={score >= 5 ? 'text-gray-700' : ''}>Special</span>
      </div>
    </div>
  );
};
