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

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      <section className="relative pt-36 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeInUp} className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Conditions d&apos;utilisation</h1>
            <p className="text-gray-500 dark:text-gray-400">Dernière mise à jour : 1er janvier 2024</p>
          </motion.div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">1. Acceptation des conditions</h2>
              <p>En accédant et en utilisant la plateforme AfriBiz, vous acceptez d&apos;être lié par les présentes conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser nos services.</p>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">2. Description des services</h2>
              <p>AfriBiz fournit une plateforme SaaS permettant aux entrepreneurs de créer et gérer leur activité en ligne : boutique e-commerce, réservations, facturation, marketing et autres modules de gestion.</p>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">3. Compte utilisateur</h2>
              <p>Vous êtes responsable du maintien de la confidentialité de votre compte et de votre mot de passe. Vous êtes également responsable de toutes les activités qui se produisent sous votre compte.</p>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">4. Abonnements et paiements</h2>
              <p>Les abonnements sont facturés mensuellement. Vous pouvez annuler à tout moment. Les remboursements sont effectués conformément à notre politique de remboursement.</p>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">5. Propriété intellectuelle</h2>
              <p>Tout le contenu présent sur AfriBiz, y compris les textes, graphiques, logos, et logiciels, est la propriété d&apos;AfriBiz ou de ses fournisseurs de contenu.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
