'use client';

import { Business } from '@/types/business';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Target,
  Eye,
  Heart,
  Clock,
  Award,
  UserCheck,
  BookOpen,
  Building2,
  ShieldCheck,
  Star,
  Users,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AccueilProps {
  business: Business;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, rootMargin: '-50px' },
  transition: { duration: 0.5 },
};

function StatCard({
  icon,
  value,
  label,
  color = 'brand',
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand border-brand-100 dark:border-brand-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800',
    purple:
      'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-100 dark:border-purple-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-800',
    emerald:
      'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 duration-200',
        colorMap[color]
      )}
    >
      <div className="p-2 rounded-lg bg-white/50 dark:bg-white/10 shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-xs opacity-80">{label}</p>
      </div>
    </div>
  );
}

export function Accueil({ business }: AccueilProps) {
  // Skills depuis le business OU le owner (fallback)
  const businessSkills = (business as any).skills || business.owner?.skills || [];
  const businessCerts = (business as any).certifications || business.owner?.certifications || [];
  const experienceYears = (business as any).experience || business.owner?.yearsOfExperience || null;
  const hasContent =
    business.description ||
    business.shortDescription ||
    business.mission ||
    business.vision ||
    business.values ||
    business.foundedYear ||
    businessSkills.length > 0 ||
    businessCerts.length > 0;

  if (!hasContent)
    return (
      <section id="section-accueil" className="scroll-mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-10 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/30 dark:to-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Ce business prépare sa vitrine. Revenez bientôt !
            </p>
          </div>
        </div>
      </section>
    );

  const stats = [
    experienceYears && {
      icon: <Clock className="w-5 h-5" />,
      value: `${experienceYears}+`,
      label: "Années d'expérience",
      color: 'brand' as const,
    },
    business.employeeCount && {
      icon: <Users className="w-5 h-5" />,
      value: business.employeeCount,
      label: 'Employés',
      color: 'blue' as const,
    },
    businessSkills.length > 0 && {
      icon: <Award className="w-5 h-5" />,
      value: businessSkills.length,
      label: 'Compétences',
      color: 'purple' as const,
    },
    businessCerts.length > 0 && {
      icon: <BookOpen className="w-5 h-5" />,
      value: businessCerts.length,
      label: 'Certificats',
      color: 'amber' as const,
    },
    business.reviewCount && {
      icon: <ShieldCheck className="w-5 h-5" />,
      value: business.reviewCount,
      label: 'Avis clients',
      color: 'emerald' as const,
    },
  ].filter(Boolean);

  return (
    <section id="section-accueil" className="scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* En-tête */}
        <motion.div {...fadeUp}>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            À propos de <span className="text-brand">{business.name}</span>
          </h2>
          {business.shortDescription && (
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">
              {business.shortDescription}
            </p>
          )}
        </motion.div>

        {/* Stats clés */}
        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          >
            {stats.map((stat: any, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </motion.div>
        )}

        {/* Description */}
        {(business.description || business.shortDescription) && (
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.15 }} className="mb-10">
            <div className="prose prose-gray dark:prose-invert max-w-4xl">
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                {business.description || business.shortDescription}
              </p>
            </div>
          </motion.div>
        )}

        {/* Mission / Vision / Valeurs */}
        {(business.mission || business.vision || business.values) && (
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid sm:grid-cols-3 gap-5 mb-10"
          >
            {business.mission && (
              <div className="group p-6 rounded-xl bg-gradient-to-br from-brand-50 to-brand-50/50 dark:from-brand-900/20 dark:to-brand-900/10 border border-brand-100 dark:border-brand-800/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notre Mission</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {business.mission}
                </p>
              </div>
            )}
            {business.vision && (
              <div className="group p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-100 dark:border-blue-800/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notre Vision</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {business.vision}
                </p>
              </div>
            )}
            {business.values && (
              <div className="group p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-100 dark:border-purple-800/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Nos Valeurs</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {business.values}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Responsable / Propriétaire */}
        {business.owner && (
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700 p-6 sm:p-8"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 p-[3px] shadow-lg shadow-brand-500/20">
                  <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-2xl sm:text-3xl font-bold text-brand overflow-hidden">
                    {business.owner.avatar ? (
                      <Image
                        src={business.owner.avatar}
                        alt={`${business.owner.firstName} ${business.owner.lastName}`}
                        fill
                        className="object-cover rounded-2xl"
                      />
                    ) : (
                      <span>
                        {business.owner.firstName?.charAt(0)}
                        {business.owner.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
                {experienceYears && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-400 border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-sm">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-5 h-5 text-brand" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {business.owner.firstName} {business.owner.lastName}
                  </h3>
                </div>
                {experienceYears && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {experienceYears} ans
                    </span>{' '}
                    d&apos;expérience
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {businessSkills.slice(0, 6).map((skill: string) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-full border border-brand-100 dark:border-brand-800"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                      {skill}
                    </span>
                  ))}
                  {businessSkills.length > 6 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400">
                      +{businessSkills.length - 6} <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
                {businessCerts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {businessCerts.map((cert: string) => (
                      <span
                        key={cert}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full border border-amber-100 dark:border-amber-800"
                      >
                        <BookOpen className="w-3 h-3" />
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Séparateur décoratif */}
        <div className="mt-10 flex items-center gap-4 text-gray-300 dark:text-gray-600">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
          <div className="w-2 h-2 rounded-full bg-brand rotate-45" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
        </div>
      </div>
    </section>
  );
}
