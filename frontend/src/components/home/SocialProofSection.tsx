export function SocialProofSection() {
  const logos = [
    { name: 'Kente Création', initials: 'KC', color: 'from-pink-500 to-rose-400' },
    { name: 'Awa Consulting', initials: 'AC', color: 'from-blue-500 to-indigo-400' },
    { name: 'Saveur du Togo', initials: 'ST', color: 'from-amber-500 to-orange-400' },
    { name: 'DesignLab Africa', initials: 'DA', color: 'from-purple-500 to-violet-400' },
    { name: 'TechLomé', initials: 'TL', color: 'from-cyan-500 to-teal-400' },
  ];

  return (
    <section className="py-10 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider font-medium">
          Déjà +10 000 entrepreneurs, artisans et freelances nous font confiance en Afrique
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {logos.map((logo) => (
            <div key={logo.name} className="flex items-center gap-2.5 group">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${logo.color} flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-110 transition-transform`}
              >
                {logo.initials}
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
