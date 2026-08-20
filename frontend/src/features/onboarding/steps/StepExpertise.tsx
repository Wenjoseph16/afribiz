'use client';

import { useState, useRef } from 'react';
import { X, Upload, Plus, Award } from 'lucide-react';
import type { OnboardingData, OnboardingCertificate } from '@/types/business';
import { apiClient } from '@/services/apiClient';

const SKILLS_BY_TYPE: Record<string, string[]> = {
  RESTAURANT: ['Cuisine africaine', 'Poulet braisé', 'Traiteur', 'Végétarien', 'Pâtisserie', 'Boissons locales'],
  FAST_FOOD: ['Burger', 'Pizza', 'Brochettes', 'Frites', 'Snack rapide'],
  HOTEL: ['Hébergement', 'Conférence', 'Spa', 'Restaurant', 'Événementiel'],
  BOUTIQUE_VETEMENTS: ['Mode femme', 'Mode homme', 'Mode enfant', 'Accessoires', 'Artisanat'],
  BOUTIQUE_COSMETIQUES: ['Cosmétiques naturels', 'Soins peau', 'Maquillage', 'Parfums'],
  BOUTIQUE_ELECTRONIQUE: ['Téléphones', 'Ordinateurs', 'Accessoires', 'Réparation'],
  PHOTOGRAPHE: ['Mariage', 'Portrait', 'Événementiel', 'Commercial', 'Produit'],
  FREELANCE: ['Développement web', 'Design graphique', 'Rédaction', 'Traduction', 'Marketing digital'],
  DEVELOPPEUR: ['Frontend', 'Backend', 'Mobile', 'DevOps', 'UI/UX'],
  SALON_COIFFURE: ['Coiffure femme', 'Coiffure homme', 'Tresses', 'Locks', 'Coloration'],
  CABINET_MEDICAL: ['Consultation', 'Laboratoire', 'Pharmacie', 'Imagerie'],
  TRANSPORT: ['VTC', 'Livraison', 'Fret', 'Bus', 'Moto-taxi'],
  ARTISAN: ['Bois', 'Cuir', 'Textile', 'Bijoux', 'Céramique'],
  AGENCE_DIGITALE: ['Web', 'Mobile', 'SEO', 'Réseaux sociaux', 'Branding'],
  default: ['Service', 'Conseil', 'Formation', 'Expertise', 'Création'],
};

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

export default function StepExpertise({ data, onChange }: Props) {
  const [tagInput, setTagInput] = useState('');
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const certFileRef = useRef<HTMLInputElement>(null);

  const availableTags = SKILLS_BY_TYPE[data.typeId] || SKILLS_BY_TYPE.default;

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || data.competencies.includes(trimmed) || data.competencies.length >= 10) return;
    onChange({ competencies: [...data.competencies, trimmed] });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    onChange({ competencies: data.competencies.filter((t) => t !== tag) });
  };

  const addCertificate = async () => {
    const file = certFileRef.current?.files?.[0];
    if (!certName.trim()) return;

    let fileUrl = '';
    if (file) {
      try {
        const res = await apiClient.uploadMedia(file);
        if (res.data?.success) fileUrl = res.data.data.url || res.data.data.path;
      } catch { /* skip */ }
    }

    const cert: OnboardingCertificate = { name: certName.trim(), issuer: certIssuer.trim(), fileUrl };
    onChange({ certificates: [...data.certificates, cert] });
    setCertName('');
    setCertIssuer('');
    if (certFileRef.current) certFileRef.current.value = '';
  };

  const removeCertificate = (index: number) => {
    onChange({ certificates: data.certificates.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Compétences multi-tags */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          Compétences * <span className="font-normal text-gray-400">(3 min, 10 max)</span>
        </label>

        {/* Tags sélectionnés */}
        {data.competencies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.competencies.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-800/40"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {availableTags
            .filter((t) => !data.competencies.includes(t))
            .slice(0, 8)
            .map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-medium hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/30 transition-all"
              >
                <Plus className="h-3 w-3" />
                {tag}
              </button>
            ))}
        </div>

        {/* Input custom */}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); }
            }}
            placeholder="Ajouter une compétence personnalisée…"
            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            disabled={data.competencies.length >= 10}
          />
          <button
            onClick={() => addTag(tagInput)}
            disabled={!tagInput.trim() || data.competencies.length >= 10}
            className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-40 transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">{data.competencies.length}/10 compétences</p>
      </div>

      {/* Description expérience */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          Description de votre expérience
        </label>
        <textarea
          value={data.experienceDescription}
          onChange={(e) => onChange({ experienceDescription: e.target.value })}
          placeholder="Parlez de votre parcours, vos spécialités, ce qui vous rend unique…"
          maxLength={500}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{data.experienceDescription.length}/500</p>
      </div>

      {/* Années d'expérience */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          Années d&apos;expérience *
        </label>
        <select
          value={data.experienceYears}
          onChange={(e) => onChange({ experienceYears: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none"
        >
          <option value="">Sélectionnez…</option>
          <option value="<1">Moins d&apos;1 an</option>
          <option value="1-3">1 à 3 ans</option>
          <option value="3-5">3 à 5 ans</option>
          <option value="5-10">5 à 10 ans</option>
          <option value="10+">Plus de 10 ans</option>
        </select>
      </div>

      {/* Certificats / Diplômes */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          Certificats / Diplômes <span className="font-normal text-gray-400">(optionnel)</span>
        </label>

        {/* Liste existante */}
        {data.certificates.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.certificates.map((cert, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{cert.name}</p>
                  {cert.issuer && <p className="text-xs text-gray-500">{cert.issuer}</p>}
                </div>
                <button onClick={() => removeCertificate(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire ajout */}
        <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-white/10 space-y-2">
          <input
            type="text"
            value={certName}
            onChange={(e) => setCertName(e.target.value)}
            placeholder="Nom du certificat / diplôme"
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <input
            type="text"
            value={certIssuer}
            onChange={(e) => setCertIssuer(e.target.value)}
            placeholder="Organisme émetteur (optionnel)"
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <div className="flex gap-2">
            <input ref={certFileRef} type="file" accept="image/*,.pdf" className="hidden" />
            <button
              onClick={() => certFileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              <Upload className="h-3 w-3" />
              Joindre un fichier
            </button>
            <button
              onClick={addCertificate}
              disabled={!certName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-all"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
