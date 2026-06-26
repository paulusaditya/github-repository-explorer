import { Search } from "lucide-react";

export function EmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <Search className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={1} />
      <p className="text-foreground font-medium mb-1">No repositories found</p>
      <p className="text-muted-foreground text-sm mb-4">
        No results for <span className="font-mono font-medium">&quot;{query}&quot;</span>.
        Try different keywords or filters.
      </p>
      <button
        onClick={onClear}
        className="text-sm text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        Clear search
      </button>
    </div>
  );
}