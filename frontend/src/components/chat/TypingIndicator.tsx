'use client';

import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  name?: string;
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start"
    >
      <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 rounded-bl-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {name && <span className="text-xs text-gray-400 font-medium">{name}</span>}
          <div className="flex items-center gap-1">
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 block"
            />
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }}
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 block"
            />
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 block"
            />
          </div>
          {!name && <span className="text-xs text-gray-400">En train d&apos;écrire...</span>}
        </div>
      </div>
    </motion.div>
  );
}
