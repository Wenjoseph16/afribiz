'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Check } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-emerald-700 to-emerald-900 p-8 sm:p-12 text-center text-white"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium mb-6 border border-white/10">
              <Zap className="h-3.5 w-3.5" />
              Prêt à commencer ?
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Prêt à transformer votre business ?
            </h2>
            <p className="text-emerald-100/80 max-w-lg mx-auto mb-8 text-base sm:text-lg leading-relaxed">
              Rejoignez la communauté AfriBiz. C&apos;est gratuit pour commencer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-brand px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-emerald-50 hover:shadow-xl transition-all duration-200 group"
              >
                Commencer gratuitement
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all duration-200"
              >
                Nous contacter
              </Link>
            </div>
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 text-xs text-emerald-200/70">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Sans carte bancaire
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Gratuit à vie
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Annulation à tout moment
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
