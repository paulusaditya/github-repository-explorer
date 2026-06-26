export function SkeletonCard() {
  return (
    <div className="border-b border-border p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-muted rounded w-48 mb-2" />
          <div className="h-3 bg-muted rounded w-full mb-1" />
          <div className="h-3 bg-muted rounded w-3/4 mb-3" />
          <div className="flex gap-4">
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}