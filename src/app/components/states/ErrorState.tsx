import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <AlertCircle
        className="w-12 h-12 text-destructive mb-4"
        strokeWidth={1}
      />
      <p className="text-foreground font-medium mb-1">Something went wrong</p>
      <p className="text-muted-foreground text-sm mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Try again
      </button>
    </div>
  );
}