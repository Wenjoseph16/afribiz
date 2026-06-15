'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';
import {
  Star, MapPin, Globe, Code2, GitBranch, Briefcase, Code, Shield, ExternalLink,
  Download, Eye, Mail, Phone, Award, Quote, ChevronRight, Package, Sparkles
} from 'lucide-react';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface DeveloperPublic {
  _id: string;
  developerName?: string;
  companyName?: string;
  companyLogo?: string;
  photo?: string;
  isVerified: boolean;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  rating: number;
  country?: string;
  city?: string;
  description?: string;
  presentation?: string;
  yearsOfExperience?: number;
  specialties: string[];
  technologies: string[];
  website?: string;
  github?: string;
  gitlab?: string;
  portfolio?: string;
  linkedin?: string;
  modulesPublished: number;
  totalSales: number;
  installations: number;
  reviewsCount: number;
  modules: ModuleItem[];
  reviews: ReviewItem[];
}

interface ModuleItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  image?: string;
}

interface ReviewItem {
  _id: string;
  rating: number;
  title: string;
  comment: string;
  userName: string;
  createdAt: string;
}

const tierColors: Record<string, string> = {
  BRONZE: 'bg-amber-700 text-amber-100 border-amber-600',
  SILVER: 'bg-slate-400 text-slate-100 border-slate-300',
  GOLD: 'bg-yellow-500 text-yellow-950 border-yellow-400',
  PLATINUM: 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-white/30',
};

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'
          )}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-5">
      <Icon className="w-5 h-5 text-brand" />
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function getInitials(name?: string) {
  if (!name) return 'D';
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export default function DeveloperProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const { data, isLoading, isError } = useQuery<DeveloperPublic>({
    queryKey: ['developer-public', id],
    queryFn: async () => {
      const res = await axios.get(`${API}/developer/public/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size="xl" label="Chargement du profil..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profil introuvable</h1>
          <p className="text-gray-500">Ce développeur n&apos;existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
            <div className="relative shrink-0">
              {data.photo ? (
                <Image
                  src={data.photo ?? ''}
                  alt={data.developerName || 'Développeur'}
                  width={144}
                  height={144}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover ring-4 ring-white/30 shadow-xl"
                  unoptimized
                />
              ) : (
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white/20 backdrop-blur-sm ring-4 ring-white/30 shadow-xl flex items-center justify-center">
                  <span className="text-5xl sm:text-6xl font-bold text-white/80">
                    {getInitials(data.developerName)}
                  </span>
                </div>
              )}
              {data.companyLogo && (
                <Image
                  src={data.companyLogo ?? ''}
                  alt={data.companyName || 'Logo'}
                  width={48}
                  height={48}
                  className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl border-2 border-white bg-white object-contain p-1 shadow-md"
                  unoptimized
                />
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  {data.developerName || 'Développeur'}
                </h1>
                {data.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/30 backdrop-blur-sm border border-emerald-300/40 text-xs font-semibold text-white">
                    <Shield className="w-3.5 h-3.5" />
                    Vérifié
                  </span>
                )}
                <span className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider',
                  tierColors[data.tier] || tierColors.BRONZE
                )}>
                  <Award className="w-3.5 h-3.5" />
                  {data.tier}
                </span>
              </div>

              {data.companyName && (
                <p className="text-lg text-emerald-100/90 font-medium mb-3">{data.companyName}</p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={data.rating} size="md" />
                  <span className="text-sm font-semibold text-white">{data.rating.toFixed(1)}</span>
                </div>
                {(data.country || data.city) && (
                  <div className="flex items-center gap-1.5 text-emerald-100/80">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      {[data.city, data.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          <StatCard label="Modules publiés" value={data.modulesPublished ?? 0} icon={Package} />
          <StatCard label="Ventes totales" value={data.totalSales ?? 0} icon={Briefcase} />
          <StatCard label="Installations" value={data.installations ?? 0} icon={Download} />
          <StatCard label="Avis" value={data.reviewsCount ?? 0} icon={Star} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {(data.description || data.presentation || data.yearsOfExperience) && (
          <section className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">À propos</h2>
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8 space-y-4">
              {data.description && (
                <p className="text-gray-700 leading-relaxed">{data.description}</p>
              )}
              {data.presentation && (
                <p className="text-gray-600 leading-relaxed">{data.presentation}</p>
              )}
              {data.yearsOfExperience && (
                <div className="flex items-center gap-2 text-sm font-medium text-brand">
                  <Sparkles className="w-4 h-4" />
                  <span>{data.yearsOfExperience} ans d&apos;expérience</span>
                </div>
              )}
            </div>
          </section>
        )}

        {(data.specialties?.length > 0 || data.technologies?.length > 0) && (
          <section className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Compétences</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {data.specialties?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="w-5 h-5 text-brand" />
                    <h3 className="font-semibold text-gray-900">Spécialités</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.specialties.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm font-medium border border-brand-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.technologies?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-brand" />
                    <h3 className="font-semibold text-gray-900">Technologies</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.technologies.map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium border border-gray-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {(data.website || data.github || data.gitlab || data.portfolio || data.linkedin) && (
          <section className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Liens</h2>
            <div className="flex flex-wrap gap-3">
              {data.website && (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white rounded-xl shadow-card border border-gray-100 hover:shadow-card-hover hover:border-brand-200 transition-all text-gray-700 hover:text-brand text-sm font-medium"
                >
                  <Globe className="w-4 h-4" />
                  Site web
                  <ExternalLink className="w-3.5 h-3.5 ml-1 text-gray-400" />
                </a>
              )}
              {data.github && (
                <a
                  href={data.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white rounded-xl shadow-card border border-gray-100 hover:shadow-card-hover hover:border-gray-300 transition-all text-gray-700 hover:text-gray-900 text-sm font-medium"
                >
                  <Code2 className="w-4 h-4" />
                  GitHub
                  <ExternalLink className="w-3.5 h-3.5 ml-1 text-gray-400" />
                </a>
              )}
              {data.gitlab && (
                <a
                  href={data.gitlab}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white rounded-xl shadow-card border border-gray-100 hover:shadow-card-hover hover:border-orange-200 transition-all text-gray-700 hover:text-orange-600 text-sm font-medium"
                >
                  <GitBranch className="w-4 h-4" />
                  GitLab
                  <ExternalLink className="w-3.5 h-3.5 ml-1 text-gray-400" />
                </a>
              )}
              {data.portfolio && (
                <a
                  href={data.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white rounded-xl shadow-card border border-gray-100 hover:shadow-card-hover hover:border-purple-200 transition-all text-gray-700 hover:text-purple-600 text-sm font-medium"
                >
                  <Briefcase className="w-4 h-4" />
                  Portfolio
                  <ExternalLink className="w-3.5 h-3.5 ml-1 text-gray-400" />
                </a>
              )}
              {data.linkedin && (
                <a
                  href={data.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white rounded-xl shadow-card border border-gray-100 hover:shadow-card-hover hover:border-blue-200 transition-all text-gray-700 hover:text-blue-600 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  LinkedIn
                  <ExternalLink className="w-3.5 h-3.5 ml-1 text-gray-400" />
                </a>
              )}
            </div>
          </section>
        )}

        {data.modules?.length > 0 && (
          <section className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Modules publiés</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.modules.map((mod) => (
                <div
                  key={mod._id}
                  className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 hover:shadow-card-hover transition-all group"
                >
                  {mod.image && (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4">
                      <Image
                        src={mod.image ?? ''}
                        alt={mod.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                      {mod.name}
                    </h3>
                    {mod.category && (
                      <span className="shrink-0 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                        {mod.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{mod.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={mod.rating} />
                      <span className="text-xs text-gray-500">{mod.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-lg font-bold text-brand">
                      {mod.price > 0 ? `${mod.price.toLocaleString()} FCFA` : 'Gratuit'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.reviews?.length > 0 && (
          <section className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Avis récents</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {data.reviews.slice(0, 6).map((rev) => (
                <div
                  key={rev._id}
                  className="bg-white rounded-2xl shadow-card border border-gray-100 p-6"
                >
                  <div className="flex items-center gap-1 mb-3">
                    <StarRating rating={rev.rating} />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{rev.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{rev.comment}&rdquo;</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">
                      {getInitials(rev.userName)}
                    </div>
                    <span className="font-medium text-gray-700">{rev.userName}</span>
                    <span className="text-gray-300">•</span>
                    <span>{new Date(rev.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="animate-fade-in-up pb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Contacter le développeur</h2>
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8 max-w-2xl">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                <input
                  type="text"
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
                  placeholder="votre@email.com"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sujet</label>
              <input
                type="text"
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
                placeholder="Sujet du message"
              />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
              <textarea
                rows={4}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed resize-none"
                placeholder="Votre message..."
              />
            </div>
            <button
              disabled
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-200 text-gray-500 text-sm font-semibold cursor-not-allowed w-full sm:w-auto justify-center"
            >
              <Mail className="w-4 h-4" />
              Bientôt disponible
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
