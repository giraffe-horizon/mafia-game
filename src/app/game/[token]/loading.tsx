export default function Loading() {
  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <div className="text-4xl absolute inset-0 flex items-center justify-center">🎭</div>
        </div>

        {/* Loading text */}
        <h2 className="text-xl font-bold text-white mb-2">Ładowanie gry...</h2>
        <p className="text-slate-400">Łączenie z serwerem i pobieranie danych gry</p>

        {/* Loading skeleton */}
        <div className="mt-8 space-y-4 max-w-md">
          <div className="bg-slate-800 h-4 rounded animate-pulse"></div>
          <div className="bg-slate-800 h-4 rounded animate-pulse w-3/4"></div>
          <div className="bg-slate-800 h-4 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    </div>
  );
}
