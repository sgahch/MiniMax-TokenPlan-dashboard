export function SkeletonCard() {
  return (
    <div className="glass-card rounded-3xl p-5 overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 skeleton" />
          <div className="h-3 w-20 skeleton" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl p-4 space-y-3">
          <div className="h-3 w-20 skeleton" />
          <div className="h-2.5 w-full skeleton" />
          <div className="flex justify-between">
            <div className="h-3 w-16 skeleton" />
            <div className="h-3 w-16 skeleton" />
          </div>
        </div>
        <div className="rounded-2xl p-4 space-y-3">
          <div className="h-3 w-20 skeleton" />
          <div className="h-2.5 w-full skeleton" />
          <div className="flex justify-between">
            <div className="h-3 w-16 skeleton" />
            <div className="h-3 w-16 skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-4 space-y-3">
          <div className="h-3 w-16 skeleton" />
          <div className="h-8 w-12 skeleton" />
          <div className="h-2 w-full skeleton" />
        </div>
      ))}
    </div>
  );
}
