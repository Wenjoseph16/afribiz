'use client';

import { Business } from '@/types/business';
import { Target, Eye, Heart, Clock, Award, UserCheck, BookOpen } from 'lucide-react';

interface AccueilProps {
  business: Business;
}

export function Accueil({ business }: AccueilProps) {
  const hasContent = business.description || business.shortDescription || business.mission || business.vision || business.values || business.foundedYear;

  if (!hasContent) return null;

  return (
    <section id="section-accueil" className="scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">À propos</h2>

        {business.shortDescription && (
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">
            {business.shortDescription}
          </p>
        )}

        {business.description && (
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8 max-w-3xl">
            {business.description}
          </p>
        )}

        {business.foundedYear && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Clock className="w-4 h-4" />
            <span>Depuis {business.foundedYear}</span>
            {business.employeeCount && <span> &middot; {business.employeeCount} employés</span>}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-6">
          {business.mission && (
            <div className="p-6 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800">
              <Target className="w-8 h-8 text-brand mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mission</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{business.mission}</p>
            </div>
          )}
          {business.vision && (
            <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <Eye className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Vision</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{business.vision}</p>
            </div>
          )}
          {business.values && (
            <div className="p-6 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
              <Heart className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Valeurs</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{business.values}</p>
            </div>
          )}
        </div>

        {business.owner && (
          <div className="mt-8 p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand" /> Responsable
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand font-bold text-lg">
                {business.owner.firstName?.charAt(0)}{business.owner.lastName?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {business.owner.firstName} {business.owner.lastName}
                </p>
                {business.owner.yearsOfExperience && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <Award className="w-3.5 h-3.5" /> {business.owner.yearsOfExperience} ans d&apos;expérience
                  </p>
                )}
                {(business.owner.skills?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(business.owner.skills ?? []).map((skill) => (
                      <span key={skill} className="px-2 py-0.5 text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                {(business.owner.certifications?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(business.owner.certifications ?? []).map((cert) => (
                      <span key={cert} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full">
                        <BookOpen className="w-3 h-3" /> {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
