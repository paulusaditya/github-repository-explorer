import { clsx } from "clsx";
import {
  Star,
  GitFork,
  Eye,
  X,
  ExternalLink,
  Heart,
  GitBranch,
  Scale,
  HardDrive,
  Tag,
  Globe,
  Clock,
  CircleDot,
} from "lucide-react";
import type { GitHubRepo } from "@/types/github";
import { formatNumber, formatBytes, formatFullDate } from "@/lib/github";
import { useLanguages } from "@/hooks/useLanguages";
import { LanguageBar } from "@/components/LanguageBar";

export function DetailPanel({
  repo,
  isFav,
  onFav,
  onClose,
}: {
  repo: GitHubRepo;
  isFav: boolean;
  onFav: () => void;
  onClose: () => void;
}) {
  const { langs, loading: langLoading } = useLanguages(repo);

  const stats = [
    { icon: Star, label: "Stars", value: formatNumber(repo.stargazers_count) },
    { icon: GitFork, label: "Forks", value: formatNumber(repo.forks_count) },
    { icon: Eye, label: "Watchers", value: formatNumber(repo.watchers_count) },
    {
      icon: CircleDot,
      label: "Issues",
      value: formatNumber(repo.open_issues_count),
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={repo.owner.avatar_url}
            alt={repo.owner.login}
            className="w-10 h-10 rounded-full bg-muted shrink-0"
          />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate leading-5">
              {repo.name}
            </h2>
            <a
              href={repo.owner.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {repo.owner.login}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onFav}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            className={clsx(
              "p-2 rounded hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isFav ? "text-red-500" : "text-muted-foreground"
            )}
          >
            <Heart className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
          </button>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open on GitHub"
            className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            aria-label="Close detail"
            className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Description */}
        {repo.description && (
          <p className="text-sm text-foreground leading-relaxed">
            {repo.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {repo.archived && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">
              Archived
            </span>
          )}
          {repo.fork && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              Fork
            </span>
          )}
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border capitalize">
            {repo.visibility}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-sm font-semibold font-mono text-foreground">
                  {value}
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Language breakdown */}
        {!langLoading && langs && Object.keys(langs).length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Languages
            </h3>
            <LanguageBar langs={langs} />
          </section>
        )}

        {/* Topics */}
        {repo.topics && repo.topics.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Topics
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {repo.topics.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 text-xs font-mono bg-primary/10 text-primary rounded border border-primary/20"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Meta */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Details
          </h3>
          <div className="space-y-2.5 text-sm">
            {repo.homepage && (
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <a
                  href={repo.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate text-xs font-mono"
                >
                  {repo.homepage}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <GitBranch className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-foreground">
                {repo.default_branch}
              </span>
              <span className="text-xs text-muted-foreground">
                default branch
              </span>
            </div>
            {repo.license && (
              <div className="flex items-center gap-2.5">
                <Scale className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-foreground">
                  {repo.license.spdx_id || repo.license.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-foreground">
                {formatBytes(repo.size)}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Created</span>
              <span className="text-xs font-mono text-foreground">
                {formatFullDate(repo.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Updated</span>
              <span className="text-xs font-mono text-foreground">
                {formatFullDate(repo.updated_at)}
              </span>
            </div>
          </div>
        </section>

        {/* Action */}
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          View on GitHub
        </a>
      </div>
    </div>
  );
}