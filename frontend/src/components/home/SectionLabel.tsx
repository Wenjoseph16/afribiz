'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function SectionLabel({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-50 dark:bg-brand-950/40 text-brand dark:text-brand-400 rounded-full text-xs sm:text-sm font-medium border border-brand/10 dark:border-brand/20 shadow-sm mb-5"
    >
      <Sparkles className="h-3.5 w-3.5" />
      {text}
    </motion.div>
  );
}
