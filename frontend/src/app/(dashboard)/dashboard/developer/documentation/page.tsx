'use client';

import { BookOpen, FileCode, Waypoints, ExternalLink, BookMarked, Video, HelpCircle, Code } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const DOC_SECTIONS = [
  {
    title: 'API Référence',
    description: 'Documentation complète de l\'API REST AfriBiz pour développeurs.',
    icon: Code,
    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
    links: ['Authentification', 'Endpoints modules', 'Webhooks', 'Rate limiting'],
  },
  {
    title: 'SDK & Bibliothèques',
    description: 'Kit de développement logiciel pour accélérer vos intégrations.',
    icon: FileCode,
    color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
    links: ['SDK JavaScript', 'SDK Python', 'SDK PHP', 'CLI Tool'],
  },
  {
    title: 'Guides d\'intégration',
    description: 'Tutoriels pas à pas pour connecter vos modules à AfriBiz.',
    icon: Waypoints,
    color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600',
    links: ['Premier module', 'Paiement Mobile Money', 'Installation automatique', 'Migration version'],
  },
  {
    title: 'Tutoriels vidéo',
    description: 'Formations vidéo pour maîtriser la plateforme de développement.',
    icon: Video,
    color: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600',
    links: ['Introduction', 'Créer un module', 'Publier sur la marketplace', 'Monétisation'],
  },
  {
    title: 'Bonnes pratiques',
    description: 'Recommandations et standards pour un développement de qualité.',
    icon: BookMarked,
    color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600',
    links: ['Sécurité', 'Performance', 'UX/UI', 'Tests'],
  },
  {
    title: 'FAQ',
    description: 'Réponses aux questions fréquentes des développeurs AfriBiz.',
    icon: HelpCircle,
    color: 'bg-sky-50 dark:bg-sky-900/30 text-sky-600',
    links: ['Compte développeur', 'Validation', 'Paiements', 'Support'],
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
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', section.color)}>
              <section.icon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">{section.description}</p>
            <ul className="space-y-1.5">
              {section.links.map((link) => (
                <li key={link}>
                  <a href="#" className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-700 transition-colors">
                    <ExternalLink className="h-3 w-3" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card padding="lg" className="text-center">
        <BookOpen className="h-10 w-10 text-brand mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vous ne trouvez pas ce que vous cherchez ?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Consultez notre centre d&apos;aide ou contactez notre équipe support.</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary">Centre d&apos;aide</Button>
          <Button variant="primary">Contacter le support</Button>
        </div>
      </Card>
    </div>
  );
}
