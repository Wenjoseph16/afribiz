'use client';

import { BUSINESS_TYPE_LABELS, BUSINESS_MODULES } from '@/constants/business';
import { Card } from '@/components/ui/Card';
import { Pencil, MapPin, Globe, User, ShoppingBag, Smartphone } from 'lucide-react';
import type { OnboardingData } from '@/types/business';

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

function Section({ title, icon: Icon, children, onEdit }: { title: string; icon: any; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-brand dark:hover:text-brand-400 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

export function StepSummary({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vérifiez vos informations</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Prenez un moment pour vérifier les informations avant de créer votre business.
        </p>
      </div>

      {/* Identity */}
      <Section title="Identité" icon={User}>
        <Field label="Nom" value={data.name} />
        <Field label="Catégorie" value={BUSINESS_TYPE_LABELS[data.type]} />
        <Field label="Description" value={data.shortDescription} />
      </Section>

      {/* Contact & Location */}
      <Section title="Contact & Localisation" icon={MapPin}>
        <Field label="Téléphone" value={data.phone} />
        <Field label="WhatsApp" value={data.whatsapp} />
        <Field label="Pays" value={data.country} />
        <Field label="Ville" value={data.city} />
        <Field label="Adresse" value={data.address} />
        <Field label="GPS" value={data.latitude && data.longitude ? `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}` : undefined} />
      </Section>

      {/* Professional Info */}
      {(data.managerName || data.experience) && (
        <Section title="Gérant" icon={User}>
          <Field label="Nom" value={data.managerName} />
          <Field label="Expérience" value={data.experience ? `${data.experience} ans` : undefined} />
          <Field label="Bio" value={data.managerBio} />
          {data.skills && data.skills.length > 0 && (
            <Field label="Compétences" value={data.skills.join(', ')} />
          )}
          {data.certifications && data.certifications.length > 0 && (
            <Field label="Certifications" value={data.certifications.join(', ')} />
          )}
        </Section>
      )}

      {/* Online Presence */}
      {(data.website || data.facebook || data.instagram) && (
        <Section title="Présence en ligne" icon={Globe}>
          <Field label="Site web" value={data.website} />
          <Field label="Facebook" value={data.facebook} />
          <Field label="Instagram" value={data.instagram} />
          <Field label="TikTok" value={data.tiktok} />
          <Field label="LinkedIn" value={data.linkedin} />
        </Section>
      )}

      {/* Modules */}
      <Section title="Modules sélectionnés" icon={ShoppingBag}>
        {data.modules.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Aucun module sélectionné</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-1">
            {data.modules.map(key => {
              const mod = BUSINESS_MODULES.find(m => m.key === key);
              return mod ? (
                <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-brand/5 text-brand text-xs font-medium rounded-full border border-brand/10">
                  {mod.label}
                </span>
              ) : null;
            })}
          </div>
        )}
      </Section>

      {/* Payment Methods */}
      {data.paymentMethods && data.paymentMethods.length > 0 && (
        <Section title="Moyens de paiement" icon={Smartphone}>
          <div className="flex flex-wrap gap-2 mt-1">
            {data.paymentMethods.map(pm => {
              const isConfigured = pm.name && pm.number;
              return (
                <span
                  key={pm.method}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border ${
                    isConfigured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30'
                      : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                  }`}
                >
                  <Smartphone className="h-3 w-3" />
                  {pm.name || pm.method}
                  {isConfigured && ` (${pm.number})`}
                  {!pm.isActive && ' — Inactif'}
                </span>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
