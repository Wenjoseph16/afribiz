'use client';

import { motion } from 'framer-motion';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OnboardingStepDef {
  id: number;
  label: string;
  caption?: string;
  icon?: LucideIcon;
}

interface Props {
  steps: OnboardingStepDef[];
  current: number;
  onStepClick?: (step: number) => void;
}

export function OnboardingStepper({ steps, current, onStepClick }: Props) {
  return (
    <ol className="flex items-center gap-1">
      {steps.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <li key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              disabled={!onStepClick}
              onClick={() => onStepClick?.(step.id)}
              className="flex items-center gap-2 group"
            >
              <motion.span
                animate={active ? { scale: [1, 1.06, 1] } : {}}
                transition={{ repeat: active ? Infinity : 0, duration: 2.4, ease: 'easeInOut' }}
                className={cn(
                  'relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors shrink-0',
                  done && 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30',
                  active &&
                    'bg-emerald-600 text-white ring-4 ring-emerald-600/15 shadow-lg shadow-emerald-600/25',
                  !done &&
                    !active &&
                    'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : step.icon ? (
                  <step.icon className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </motion.span>
              <span className="text-left hidden sm:block">
                <span
                  className={cn(
                    'block text-sm font-medium leading-tight transition-colors',
                    active
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : done
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {step.label}
                </span>
                {step.caption && (
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500">
                    {step.caption}
                  </span>
                )}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px mx-3 transition-colors',
                  done ? 'bg-emerald-500/50' : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
