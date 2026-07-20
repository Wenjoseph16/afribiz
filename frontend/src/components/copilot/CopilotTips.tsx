'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, ChevronRight, X, Bot, Sparkles } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface Tip {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
  moduleKey?: string;
}

export function CopilotTips({ moduleKey }: { moduleKey: string }) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiClient
      .getModuleTips(moduleKey)
      .then((res: any) => {
        if (mounted) setTips(res?.data?.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [moduleKey]);

  if (dismissed || loading || tips.length === 0) return null;

  const priorityColors = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  };

  return (
    <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4" aria-live="polite">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-emerald-600" />
          <span className="font-medium text-emerald-800">Conseils Copilot</span>
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-full p-1 text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 rounded-md border p-2.5 ${priorityColors[tip.priority]}`}
          >
            <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="flex-1 text-sm">{tip.message}</div>
            {tip.action && (
              <button className="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900">
                {tip.action}
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
