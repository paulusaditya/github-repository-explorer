import { clsx } from "clsx";
import { Star, GitFork, Clock, Heart } from "lucide-react";
import type { GitHubRepo } from "@/types/github";
import { formatNumber, formatDate } from "@/lib/github";
import { LangDot } from "@/components/LangDot";

export function RepoCard({
  repo,
  selected,
  isFav,
  onSelect,
  onFav,
}: {
  repo: GitHubRepo;
  selected: boolean;
  isFav: boolean;
  onSelect: () => void;
  onFav: (e: React.MouseEvent) => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={clsx(
        "group relative border-b border-border p-4 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        selected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-start gap-3">
        <img
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
          className="w-8 h-8 rounded-full shrink-0 bg-muted"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-primary truncate leading-5">
              {repo.full_name}
            </h3>
            <button
              onClick={onFav}
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              className={clsx(
                "shrink-0 p-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isFav
                  ? "text-red-500 hover:text-red-600"
                  : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500"
              )}
            >
              <Heart className="w-3.5 h-3.5" fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>
          {repo.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
              {repo.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-mono">
            {repo.language && (
              <span className="flex items-center gap-1">
                <LangDot lang={repo.language} />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {formatNumber(repo.stargazers_count)}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              {formatNumber(repo.forks_count)}
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {formatDate(repo.updated_at)}
            </span>
          </div>
          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {repo.topics.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 text-[10px] font-mono bg-primary/10 text-primary rounded"
                >
                  {t}
                </span>
              ))}
              {repo.topics.length > 4 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  +{repo.topics.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {repo.archived && (
        <span className="absolute top-3 right-10 text-[10px] font-mono bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded">
          archived
        </span>
      )}
    </article>
  );
}