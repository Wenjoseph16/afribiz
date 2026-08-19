'use client';

import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/onboarding/TagInput';
import type { OnboardingData } from '@/types/business';

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

const SKILL_SUGGESTIONS = [
  'Gestion',
  'Service client',
  'Marketing',
  'Vente',
  'Management',
  'Relationnel',
  'Qualité',
  'Digital',
];

const CERT_SUGGESTIONS = [
  'Licence',
  'Master',
  'HACCP',
  'ISO 9001',
  'Agrément municipal',
  'Certificat sanitaire',
];

export function StepExpertise({ data, onChange }: Props) {
  return (
    <div className="space-y-7">
      {/* Slogan + description */}
      <div className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Slogan / Tagline
            </label>
            <span className="text-[11px] text-gray-400">
              {200 - (data.tagline?.length || 0)} restants
            </span>
          </div>
          <input
            value={data.tagline || ''}
            onChange={(e) => onChange({ tagline: e.target.value })}
            maxLength={200}
            placeholder="Ex : Le goût de chez nous, livré à votre porte"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description courte
            </label>
            <span className="text-[11px] text-gray-400">
              {200 - (data.shortDescription?.length || 0)} restants
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={200}
            value={data.shortDescription || ''}
            onChange={(e) => onChange({ shortDescription: e.target.value })}
            placeholder="Présentez votre activité en une ou deux phrases. C'est la première chose que voient vos clients."
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Gérant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nom du gérant / responsable"
          placeholder="Ex : Awa Koffi"
          value={data.managerName || ''}
          onChange={(e) => onChange({ managerName: e.target.value || undefined })}
        />
        <Input
          label="Années d'expérience"
          type="number"
          min={0}
          max={100}
          placeholder="5"
          value={data.experience?.toString() || ''}
          onChange={(e) =>
            onChange({ experience: e.target.value ? parseInt(e.target.value) : undefined })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bio du gérant
        </label>
        <textarea
          rows={2}
          maxLength={500}
          value={data.managerBio || ''}
          onChange={(e) => onChange({ managerBio: e.target.value || undefined })}
          placeholder="Parlez-nous du parcours de la personne qui dirige l'activité..."
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Compétences & certifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Compétences
          </label>
          <TagInput
            value={data.skills || []}
            onChange={(skills) => onChange({ skills })}
            placeholder="Entrez et appuyez sur Entrée"
            suggestions={SKILL_SUGGESTIONS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Certifications
          </label>
          <TagInput
            value={data.certifications || []}
            onChange={(certifications) => onChange({ certifications })}
            placeholder="Diplômes, agréments, licences..."
            suggestions={CERT_SUGGESTIONS}
          />
        </div>
      </div>
    </div>
  );
}