import { Bookmark, X, Heart } from "lucide-react";
import type { GitHubRepo } from "@/types/github";
import { RepoCard } from "@/components/RepoCard";

export function FavoritesPanel({
  favorites,
  isFav,
  onToggleFav,
  onSelect,
  selectedId,
  onClose,
  hydrated,
}: {
  favorites: GitHubRepo[];
  isFav: (id: number) => boolean;
  onToggleFav: (repo: GitHubRepo) => void;
  onSelect: (repo: GitHubRepo) => void;
  selectedId: number | null;
  onClose: () => void;
  hydrated: boolean;
}) {
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Favorites
          </span>
          {hydrated && favorites.length > 0 && (
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {favorites.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close favorites"
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Heart className="w-10 h-10 text-muted-foreground mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">
              No favorites yet. Click the heart on any repo to save it.
            </p>
          </div>
        ) : (
          favorites.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              selected={selectedId === repo.id}
              isFav={isFav(repo.id)}
              onSelect={() => onSelect(repo)}
              onFav={(e) => {
                e.stopPropagation();
                onToggleFav(repo);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}