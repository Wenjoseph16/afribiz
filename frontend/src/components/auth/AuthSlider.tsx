'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Briefcase,
  Users,
  TrendingUp,
  Shield,
  Globe,
} from 'lucide-react';

const slides = [
  {
    id: 1,
    title: '10,000+ business customers in Africa',
    description: 'Trusted by entrepreneurs across retail, hospitality, logistics and more.',
    icon: TrendingUp,
    accent: 'bg-emerald-300/20',
  },
  {
    id: 2,
    title: 'Mobile Money, Escrow & local payment rails',
    description: 'Secure payments built for African markets and cash-first customers.',
    icon: Zap,
    accent: 'bg-teal-300/20',
  },
  {
    id: 3,
    title: 'Marketplace, inventory & order automation',
    description: 'One dashboard to manage products, bookings and customer experience.',
    icon: Briefcase,
    accent: 'bg-slate-300/15',
  },
  {
    id: 4,
    title: 'Developer modules & partner storefronts',
    description: 'Sell integrations, grow your developer profile and earn recurring revenue.',
    icon: Globe,
    accent: 'bg-cyan-300/20',
  },
  {
    id: 5,
    title: 'Plans designed for African SMEs',
    description: 'Premium plans with support, security and integrated growth.',
    icon: Shield,
    accent: 'bg-violet-300/20',
  },
];

export const AuthSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-advance slides
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(timer);
  }, [autoPlay]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 3000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 3000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 3000);
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="w-full h-full flex flex-col justify-between relative overflow-hidden">
      {/* Background accent */}
      <div className={`absolute inset-0 ${slide.accent}`} />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-emerald-900/70 to-slate-950/95" />

      {/* Content */}

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-white text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex justify-center"
            >
              <Icon className="w-16 h-16 text-white" />
            </motion.div>

            <h2 className="text-4xl font-bold leading-tight">{slide.title}</h2>

            <p className="text-lg text-white/90 max-w-md">{slide.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="relative z-10 px-8 pb-8">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevSlide}
            className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <span className="text-white/80 text-sm">
            {currentSlide + 1} / {slides.length}
          </span>

          <button
            onClick={nextSlide}
            className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 bg-black/30 backdrop-blur-sm px-8 py-6 text-white/80 text-sm border-t border-white/10">
        <div className="flex justify-between items-center">
          <div>© 2026 AfriBiz. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-white transition">
              Privacy
            </a>
            <a href="#terms" className="hover:text-white transition">
              Terms
            </a>
            <a href="#contact" className="hover:text-white transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
