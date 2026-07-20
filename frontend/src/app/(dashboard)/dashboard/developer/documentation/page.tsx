'use client';

import {
  BookOpen,
  FileCode,
  Waypoints,
  ExternalLink,
  BookMarked,
  Video,
  HelpCircle,
  Code,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const DOC_SECTIONS = [
  {
    title: 'API Référence',
    description: "Documentation complète de l'API REST AfriBiz pour développeurs.",
    icon: Code,
    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
    links: [
      { label: 'Authentification', href: `${API_BASE_URL}/api/docs` },
      { label: 'Swagger UI', href: `${API_BASE_URL}/api/docs` },
      { label: 'Endpoints modules', href: `${API_BASE_URL}/api/docs` },
      { label: 'Spécification JSON', href: `${API_BASE_URL}/api/docs.json` },
    ],
  },
  {
    title: 'SDK & Bibliothèques',
    description: 'Kit de développement logiciel pour accélérer vos intégrations.',
    icon: FileCode,
    color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
    links: [
      { label: 'SDK JavaScript', href: `${API_BASE_URL}/api/docs` },
      { label: 'SDK Python', href: `${API_BASE_URL}/api/docs` },
      { label: 'SDK PHP', href: `${API_BASE_URL}/api/docs` },
      { label: 'CLI Tool', href: `${API_BASE_URL}/api/docs` },
    ],
  },
  {
    title: "Guides d'intégration",
    description: 'Tutoriels pas à pas pour connecter vos modules à AfriBiz.',
    icon: Waypoints,
    color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600',
    links: [
      { label: 'Premier module', href: `${API_BASE_URL}/api/docs` },
      { label: 'Paiement Mobile Money', href: `${API_BASE_URL}/api/docs` },
      { label: 'Installation automatique', href: `${API_BASE_URL}/api/docs` },
      { label: 'Migration version', href: `${API_BASE_URL}/api/docs` },
    ],
  },
  {
    title: 'Tutoriels vidéo',
    description: 'Formations vidéo pour maîtriser la plateforme de développement.',
    icon: Video,
    color: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600',
    links: [
      { label: 'Introduction', href: '#introduction' },
      { label: 'Créer un module', href: '#creer-module' },
      { label: 'Publier sur la marketplace', href: '#marketplace' },
      { label: 'Monétisation', href: '#monetisation' },
    ],
  },
  {
    title: 'Bonnes pratiques',
    description: 'Recommandations et standards pour un développement de qualité.',
    icon: BookMarked,
    color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600',
    links: [
      { label: 'Sécurité', href: '#securite' },
      { label: 'Performance', href: '#performance' },
      { label: 'UX/UI', href: '#ux-ui' },
      { label: 'Tests', href: '#tests' },
    ],
  },
  {
    title: 'FAQ',
    description: 'Réponses aux questions fréquentes des développeurs AfriBiz.',
    icon: HelpCircle,
    color: 'bg-sky-50 dark:bg-sky-900/30 text-sky-600',
    links: [
      { label: 'Compte développeur', href: `#developpeur` },
      { label: 'Validation', href: `#validation` },
      { label: 'Paiements', href: `${API_BASE_URL}/api/docs` },
      { label: 'Support', href: '#support' },
    ],
  },
];

export default function DocumentationPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Documentation"
        description="Ressources et guides pour développeurs AfriBiz"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Documentation' },
        ]}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOC_SECTIONS.map((section) => (
          <Card key={section.title} padding="md" hoverable>
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                section.color
              )}
            >
              <section.icon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {section.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
              {section.description}
            </p>
            <ul className="space-y-1.5">
              {section.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : '_self'}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : ''}
                    className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-700 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card padding="lg" className="text-center">
        <BookOpen className="h-10 w-10 text-brand mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Vous ne trouvez pas ce que vous cherchez ?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
          Consultez notre centre d&apos;aide ou contactez notre équipe support.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary">Centre d&apos;aide</Button>
          <Button variant="primary">Contacter le support</Button>
        </div>
      </Card>
    </div>
  );
}
