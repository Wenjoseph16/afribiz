export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-950 z-50">
      <div className="relative flex flex-col items-center gap-6">
        {/* AfriBiz logo text in green */}
        <div className="relative overflow-hidden">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-brand select-none">
            AfriBiz
          </h1>

          {/* Single shimmer light sweeping left to right over the text */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/40 shimmer-sweep" />
        </div>

        {/* Subtle loading dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-brand/40 dark:bg-brand/60 animate-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-sweep {
          animation: shimmerSweep 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
