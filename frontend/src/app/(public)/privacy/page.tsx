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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      <section className="relative pt-36 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeInUp} className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Politique de confidentialité</h1>
            <p className="text-gray-500 dark:text-gray-400">Dernière mise à jour : 1er janvier 2024</p>
          </motion.div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">1. Collecte des informations</h2>
              <p>Nous collectons les informations que vous nous fournissez directement lors de la création de votre compte : nom, prénom, adresse email, numéro de téléphone et informations de paiement. Nous collectons également des données d&apos;utilisation pour améliorer nos services.</p>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">2. Utilisation des informations</h2>
              <p>Les informations collectées sont utilisées pour :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Fournir et maintenir nos services</li>
                <li>Vous notifier des changements importants</li>
                <li>Vous permettre de participer aux fonctionnalités interactives</li>
                <li>Fournir un support client</li>
                <li>Analyser l&apos;utilisation pour améliorer nos services</li>
              </ul>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">3. Protection des données</h2>
              <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.</p>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">4. Partage des données</h2>
              <p>Nous ne partageons pas vos données personnelles avec des tiers sauf dans les cas suivants :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Avec votre consentement explicite</li>
                <li>Pour traiter les paiements via nos partenaires</li>
                <li>Si requis par la loi</li>
              </ul>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">5. Vos droits</h2>
              <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Droit d&apos;accès à vos données</li>
                <li>Droit de rectification</li>
                <li>Droit à l&apos;effacement</li>
                <li>Droit à la limitation du traitement</li>
                <li>Droit à la portabilité des données</li>
              </ul>
            </motion.div>

            <motion.div {...fadeInUp}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">6. Contact</h2>
              <p>Pour toute question concernant cette politique de confidentialité, contactez-nous à : contact@afribiz.com</p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
