'use client';

import { useState } from 'react';
import {
  Code,
  Megaphone,
  GitPullRequest,
  Bug,
  Sparkles,
  ArrowUpRight,
  Clock,
  BookOpen,
  MessageCircle,
  ThumbsUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const updates = [
  {
    type: 'release',
    icon: Sparkles,
    title: 'Nouveau module : CRM Avancé',
    desc: 'Gérez vos clients avec un pipeline complet, des segments dynamiques et des notes.',
    date: 'Il y a 2 jours',
    tag: 'Nouveauté',
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    type: 'improvement',
    icon: GitPullRequest,
    title: 'Amélioration des performances API',
    desc: "Les temps de réponse de l'API ont été réduits de 40% grâce à l'optimisation des requêtes.",
    date: 'Il y a 5 jours',
    tag: 'Amélioration',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  },
  {
    type: 'fix',
    icon: Bug,
    title: 'Correctif : Paiements Mobile Money',
    desc: "Résolution d'un problème de confirmation sur les transactions Wave et TMoney.",
    date: 'Il y a 1 semaine',
    tag: 'Correctif',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  },
  {
    type: 'announcement',
    icon: Megaphone,
    title: 'Maintenance planifiée',
    desc: 'Le service sera brièvement indisponible le 15/07 de 2h à 4h pour une mise à jour majeure.',
    date: 'Il y a 2 semaines',
    tag: 'Annonce',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  },
  {
    type: 'release',
    icon: Sparkles,
    title: 'API Publique v2 disponible',
    desc: 'Nouveaux endpoints pour la gestion des stocks, commandes et livraisons.',
    date: 'Il y a 3 semaines',
    tag: 'API',
    color: 'text-brand bg-brand/5',
  },
  {
    type: 'improvement',
    icon: BookOpen,
    title: 'Nouvelle documentation développeur',
    desc: "Guides mis à jour avec des exemples concrets pour l'intégration de l'API.",
    date: 'Il y a 1 mois',
    tag: 'Documentation',
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
  },
];

const quickLinks = [
  { icon: BookOpen, label: 'Documentation API', href: '/api/docs' },
  { icon: Code, label: 'Console développeur', href: '/dashboard/developer' },
  { icon: MessageCircle, label: 'Forum technique', href: '/dashboard/community' },
];

export default function DeveloperUpdatesPage() {
  const [filter, setFilter] = useState('all');

  const filteredUpdates = filter === 'all' ? updates : updates.filter((u) => u.type === filter);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Code className="h-6 w-6 text-brand" />
          Mises à jour développeur
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Restez informé des dernières nouveautés et améliorations
        </p>
      </motion.div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-brand/20 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center">
                <Icon className="h-5 w-5 text-brand" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {link.label}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-brand transition-colors" />
            </Link>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tout' },
          { key: 'release', label: 'Nouveautés' },
          { key: 'improvement', label: 'Améliorations' },
          { key: 'fix', label: 'Correctifs' },
          { key: 'announcement', label: 'Annonces' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filter === tab.key
                ? 'bg-brand text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Updates list */}
      <div className="space-y-3">
        {filteredUpdates.map((update, index) => {
          const Icon = update.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-card-hover transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${update.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {update.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${update.color}`}
                    >
                      {update.tag}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{update.desc}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {update.date}
                    </span>
                    <button className="text-xs text-brand hover:text-brand-600 font-medium flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      Utile
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
