'use client';

import { useMemo, useRef, useState } from 'react';
import { Layers, Search, Plus, X, Globe, Code2, ExternalLink, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { DevOnboardingData, CoreStackItem } from '@/types/developer';
import {
  TECH_CATALOG,
  TECH_CATEGORIES,
  DOMAIN_CATALOG,
  MASTERY_LEVELS,
} from '@/constants/developer';
import type { MasteryLevel } from '@/constants/developer';

interface Props {
  data: DevOnboardingData;
  update: (partial: Partial<DevOnboardingData>) => void;
  disabled: boolean;
}

function normalizeTech(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export default function StepExpertise({ data, update, disabled }: Props) {
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');
  const stackRef = useRef<HTMLDivElement>(null);

  const { expertise } = data;
  const stackNames = useMemo(
    () => new Set(expertise.coreStack.map((t) => t.name.toLowerCase())),
    [expertise.coreStack]
  );

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const pool = q ? TECH_CATALOG.filter((t) => t.name.toLowerCase().includes(q)) : TECH_CATALOG;
    return pool.filter((t) => !stackNames.has(t.name.toLowerCase()));
  }, [search, stackNames]);

  const addTech = (name: string) => {
    if (stackNames.has(name.toLowerCase()) || expertise.coreStack.length >= 5) return;
    update({
      expertise: {
        ...expertise,
        coreStack: [...expertise.coreStack, { name: normalizeTech(name), level: 'CONFIRME' }],
      },
    });
    setSearch('');
    setCustomInput('');
  };

  const removeTech = (name: string) =>
    update({
      expertise: {
        ...expertise,
        coreStack: expertise.coreStack.filter((t) => t.name !== name),
      },
    });

  const patchTech = (name: string, patch: Partial<CoreStackItem>) =>
    update({
      expertise: {
        ...expertise,
        coreStack: expertise.coreStack.map((t) => (t.name === name ? { ...t, ...patch } : t)),
      },
    });

  const toggleDomain = (d: string) => {
    const has = expertise.domains.includes(d);
    if (!has && expertise.domains.length >= 8) return;
    update({
      expertise: {
        ...expertise,
        domains: has ? expertise.domains.filter((x) => x !== d) : [...expertise.domains, d],
      },
    });
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30">
          <Layers className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Matrice d&apos;expertise
          </h3>
          <p className="text-xs text-gray-500">
            Votre stack principale et vos domaines de spécialisation (+30% de confiance)
          </p>
        </div>
      </div>

      {/* ===== Stack principale ===== */}
      <div ref={stackRef}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Stack principale{' '}
            <span className="text-xs text-gray-400 font-normal">
              (3 à 5 technologies maîtresses)
            </span>
          </label>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              expertise.coreStack.length >= 3
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            )}
          >
            {expertise.coreStack.length}/5
          </span>
        </div>

        {/* Items ajoutés */}
        {expertise.coreStack.length > 0 && (
          <div className="space-y-2 mb-3">
            {expertise.coreStack.map((t) => (
              <div
                key={t.name}
                className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-[120px]">
                  <Code2 className="h-4 w-4 text-brand" />
                  {t.name}
                </span>
                <select
                  value={t.level}
                  disabled={disabled}
                  onChange={(e) => patchTech(t.name, { level: e.target.value as MasteryLevel })}
                  className="text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:border-brand focus:outline-none"
                >
                  {MASTERY_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    disabled={disabled}
                    value={t.years ?? ''}
                    onChange={(e) =>
                      patchTech(t.name, {
                        years: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="—"
                    className="w-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-center text-gray-700 dark:text-gray-300 focus:border-brand focus:outline-none"
                  />
                  ans
                </div>
                <button
                  type="button"
                  onClick={() => removeTech(t.name)}
                  className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recherche catalogue */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (results.length > 0) addTech(results[0].name);
                else if (customInput.trim()) addTech(customInput);
              }
            }}
            placeholder="Rechercher une technologie (React, Node.js, Flutter…)"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:outline-none transition-all"
          />
        </div>

        {/* Résultats groupés — catalogue complet visible, filtré par la recherche */}
        {results.length > 0 && (
          <div className="mt-2 p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-h-64 overflow-y-auto">
            {TECH_CATEGORIES.filter((c) => results.some((r) => r.category === c)).map((cat) => (
              <div key={cat} className="mb-1 last:mb-0">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold px-2 pt-1.5 pb-0.5">
                  {cat}
                </p>
                <div className="flex flex-wrap gap-1.5 px-1.5 pb-1">
                  {results
                    .filter((r) => r.category === cat)
                    .map((r) => (
                      <button
                        key={r.name}
                        type="button"
                        onClick={() => addTech(r.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-brand hover:text-white transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        {r.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {results.length === 0 && search.trim() && (
          <p className="mt-2 text-xs text-gray-400 px-1">
            Aucune techno trouvée pour « {search} » — ajoutez-la ci-dessous.
          </p>
        )}

        {/* Saisie libre normalisée */}
        <div className="flex gap-2 mt-2">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (customInput.trim()) addTech(customInput);
              }
            }}
            placeholder="Techno absente du catalogue ? Ajoutez-la"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:outline-none"
          />
          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled={disabled || !customInput.trim() || expertise.coreStack.length >= 5}
            onClick={() => customInput.trim() && addTech(customInput)}
          >
            Ajouter
          </Button>
        </div>
      </div>

      {/* ===== Domaines ===== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Domaines de spécialisation{' '}
          <span className="text-xs text-gray-400 font-normal">(max 8)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DOMAIN_CATALOG.map((d) => {
            const active = expertise.domains.includes(d);
            return (
              <button
                key={d}
                type="button"
                disabled={disabled}
                onClick={() => toggleDomain(d)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  active
                    ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand/50 hover:text-brand'
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Expérience ===== */}
      <div className="max-w-[220px]">
        <Input
          label="Années d'expérience total"
          value={data.yearsOfExperience ?? ''}
          onChange={(e) =>
            update({ yearsOfExperience: e.target.value === '' ? null : Number(e.target.value) })
          }
          icon={<Briefcase className="h-4 w-4" />}
          type="number"
          min={0}
          max={60}
          placeholder="5"
        />
      </div>

      {/* ===== Liens professionnels ===== */}
      <div>
        <div className="flex items-center gap-2 pb-2">
          <ExternalLink className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Liens professionnels
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            value={data.github}
            onChange={(e) => update({ github: e.target.value })}
            placeholder="GitHub (URL)"
            icon={<Code2 className="h-4 w-4" />}
          />
          <Input
            value={data.gitlab}
            onChange={(e) => update({ gitlab: e.target.value })}
            placeholder="GitLab (URL)"
            icon={<Code2 className="h-4 w-4" />}
          />
          <Input
            value={data.linkedin}
            onChange={(e) => update({ linkedin: e.target.value })}
            placeholder="LinkedIn (URL)"
            icon={<ExternalLink className="h-4 w-4" />}
          />
          <Input
            value={data.website}
            onChange={(e) => update({ website: e.target.value })}
            placeholder="Site web"
            icon={<Globe className="h-4 w-4" />}
          />
        </div>
        <div className="mt-4">
          <Input
            value={data.portfolioUrl}
            onChange={(e) => update({ portfolioUrl: e.target.value })}
            placeholder="Portfolio technique (URL)"
            icon={<Briefcase className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}
