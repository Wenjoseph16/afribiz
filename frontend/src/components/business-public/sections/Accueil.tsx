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
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, rootMargin: '-80px' },
  transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
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
  const colorMap: Record<string, { outer: string; inner: string; text: string }> = {
    brand: {
      outer: 'ring-emerald-500/10',
      inner: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    blue: {
      outer: 'ring-blue-500/10',
      inner: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      outer: 'ring-purple-500/10',
      inner: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
    },
    amber: {
      outer: 'ring-amber-500/10',
      inner: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
    },
    emerald: {
      outer: 'ring-emerald-500/10',
      inner: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
  };
  const c = colorMap[color] || colorMap.brand;

  return (
    <motion.div variants={fadeUp} className="group">
      <div className={cn('p-1.5 rounded-2xl ring-1', c.outer)}>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-500">
          <div
            className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', c.inner)}
          >
            <span className={c.text}>{icon}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Accueil({ business }: AccueilProps) {
  const businessSkills = (business as any).skills || business.owner?.skills || [];
  const businessCerts = (business as any).certifications || business.owner?.certifications || [];
  const experienceYears = (business as any).experience || business.owner?.yearsOfExperience || null;
  const managerBio = (business as any).managerBio || null;
  const managerName = (business as any).managerName || null;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/30 dark:to-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <Building2 className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Eyebrow + Header */}
        <motion.div {...fadeUp}>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 mb-4">
            À propos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
            <span className="text-emerald-600 dark:text-emerald-400">{business.name}</span>
          </h2>
          {business.shortDescription && (
            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed max-w-2xl">
              {business.shortDescription}
            </p>
          )}
        </motion.div>

        {/* Stats — Double Bezel Grid */}
        {stats.length > 0 && (
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-10"
          >
            {stats.map((stat: any, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </motion.div>
        )}

        {/* Description */}
        {(business.description || business.shortDescription) && (
          <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.15 }} className="mt-12">
            <div className="max-w-3xl">
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {business.description || business.shortDescription}
              </p>
            </div>
          </motion.div>
        )}

        {/* Mission / Vision / Valeurs */}
        {(business.mission || business.vision || business.values) && (
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid sm:grid-cols-3 gap-4 mt-12"
          >
            {business.mission && (
              <div className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-900/20 dark:to-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-emerald-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notre Mission</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {business.mission}
                </p>
              </div>
            )}
            {business.vision && (
              <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-100 dark:border-blue-800/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notre Vision</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {business.vision}
                </p>
              </div>
            )}
            {business.values && (
              <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-100 dark:border-purple-800/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
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

        {/* Manager Card — Double Bezel */}
        {(business.owner || managerBio) && (
          <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.3 }} className="mt-12">
            <div className="p-1.5 rounded-2xl ring-1 ring-gray-200 dark:ring-white/10">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/80 dark:to-gray-900/80 p-6 sm:p-8">
                {/* Decorative accent */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Avatar — Double Bezel */}
                  <div className="relative shrink-0">
                    <div className="p-1 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-2xl sm:text-3xl font-bold text-emerald-600 overflow-hidden">
                        {business.owner?.avatar ? (
                          <Image
                            src={business.owner.avatar}
                            alt={`${business.owner.firstName} ${business.owner.lastName}`}
                            fill
                            sizes="96px"
                            className="object-cover rounded-xl"
                          />
                        ) : managerName ? (
                          <span>
                            {managerName
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')}
                          </span>
                        ) : business.owner ? (
                          <span>
                            {business.owner.firstName?.[0]}
                            {business.owner.lastName?.[0]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {experienceYears && (
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-400 border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-lg">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {managerName ||
                          (business.owner
                            ? `${business.owner.firstName} ${business.owner.lastName}`
                            : '')}
                      </h3>
                    </div>
                    {experienceYears && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-3">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {experienceYears} ans
                        </span>{' '}
                        d&apos;expérience
                      </p>
                    )}
                    {managerBio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 max-w-xl">
                        {managerBio}
                      </p>
                    )}
                    {/* Skills */}
                    {businessSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {businessSkills.slice(0, 6).map((skill: string) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-100 dark:border-emerald-800/40"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {skill}
                          </span>
                        ))}
                        {businessSkills.length > 6 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400">
                            +{businessSkills.length - 6}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Certifications */}
                    {businessCerts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {businessCerts.map((cert: string) => (
                          <span
                            key={cert}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full border border-amber-100 dark:border-amber-800/40"
                          >
                            <BookOpen className="w-3 h-3" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Decorative separator */}
        <div className="mt-16 flex items-center gap-4 text-gray-300 dark:text-gray-600">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 rotate-45" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
        </div>
      </div>
    </section>
  );
}
