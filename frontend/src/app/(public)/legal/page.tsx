'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: 'easeOut' },
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      <section className="relative pt-36 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeInUp} className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Mentions légales</h1>
            <p className="text-gray-500 dark:text-gray-400">Dernière mise à jour : 1er janvier 2024</p>
          </motion.div>

          <div className="space-y-6 text-gray-600 dark:text-gray-400">
            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Éditeur de la plateforme</h2>
              <p><strong>AfriBiz</strong><br />
              Société de droit togolais<br />
              Lomé, Togo<br />
              Email : contact@afribiz.com<br />
              Téléphone : +228 90 00 00 00</p>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Directeur de la publication</h2>
              <p>Koffi Amégnon, Fondateur</p>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hébergement</h2>
              <p>La plateforme est hébergée chez des prestataires de confiance avec des serveurs sécurisés garantissant une disponibilité optimale.</p>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Propriété intellectuelle</h2>
              <p>L&apos;ensemble des éléments composant la plateforme AfriBiz (textes, graphismes, logiciels, base de données) est protégé par les lois en vigueur sur la propriété intellectuelle.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
