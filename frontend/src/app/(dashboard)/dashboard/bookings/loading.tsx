export default function BookingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div><div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" /><div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg mt-2" /></div>
        <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="flex-1 space-y-2"><div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" /><div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
