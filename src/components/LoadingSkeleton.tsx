const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="glass-card p-6 space-y-5 animate-pulse">
      <div className="h-6 bg-secondary/50 rounded w-1/3" />
      <div className="space-y-3">
        <div className="h-4 bg-secondary/50 rounded w-1/4" />
        <div className="h-8 bg-secondary/50 rounded w-full" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-secondary/50 rounded w-1/4" />
        <div className="h-20 bg-secondary/50 rounded w-full" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 bg-secondary/50 rounded-md w-20" />
        ))}
      </div>
    </div>
    <div className="glass-card p-6 space-y-5 animate-pulse">
      <div className="h-6 bg-secondary/50 rounded w-1/3" />
      <div className="aspect-square bg-secondary/50 rounded-lg" />
    </div>
  </div>
);

export default LoadingSkeleton;
