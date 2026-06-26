"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import "./globals.css";
import { clsx } from "clsx";
import {
  Search,
  Star,
  GitFork,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  ExternalLink,
  AlertCircle,
  Clock,
  Heart,
  GitBranch,
  Scale,
  HardDrive,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Tag,
  Globe,
  CircleDot,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Owner {
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  topics: string[];
  owner: Owner;
  license: { name: string; spdx_id: string } | null;
  size: number;
  default_branch: string;
  visibility: string;
  archived: boolean;
  fork: boolean;
  homepage: string | null;
}

type SortOption = "best-match" | "stars" | "forks" | "updated";

interface SearchParams {
  query: string;
  sort: SortOption;
  language: string;
  page: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PER_PAGE = 10;

const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Shell: "#89e051",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Elixir: "#6e4a7e",
  Scala: "#c22d40",
  "C#": "#178600",
  Haskell: "#5e5086",
  Lua: "#000080",
  R: "#276dc3",
  Clojure: "#db5855",
  Zig: "#ec915c",
  Nim: "#ffc200",
  Crystal: "#000100",
};

const POPULAR_LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C++",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "C#",
  "Shell",
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "best-match", label: "Best Match" },
  { value: "stars", label: "Most Stars" },
  { value: "forks", label: "Most Forks" },
  { value: "updated", label: "Recently Updated" },
];

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBytes(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function getURLParams(): SearchParams {
  if (typeof window === "undefined") {
    return {
      query: "",
      sort: "best-match",
      language: "",
      page: 1,
    };
  }

  const p = new URLSearchParams(window.location.search);
  return {
    query: p.get("q") || "",
    sort: (p.get("sort") as SortOption) || "best-match",
    language: p.get("lang") || "",
    page: parseInt(p.get("page") || "1", 10),
  };
}

function pushURLParams(params: SearchParams, selectedRepo?: string | null) {
  if (typeof window === "undefined") return;

  const p = new URLSearchParams();
  if (params.query) p.set("q", params.query);
  if (params.sort !== "best-match") p.set("sort", params.sort);
  if (params.language) p.set("lang", params.language);
  if (params.page > 1) p.set("page", params.page.toString());
  if (selectedRepo) p.set("repo", selectedRepo);
  const qs = p.toString();
  window.history.pushState({}, "", qs ? `?${qs}` : window.location.pathname);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("gh-dark");
    const initialDark =
      stored !== null
        ? stored === "true"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;

    setDark(initialDark);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.classList.toggle("dark", dark);
    if (typeof window !== "undefined") {
      localStorage.setItem("gh-dark", String(dark));
    }
  }, [dark]);

  return [dark, setDark] as const;
}

function useFavorites() {
  const [favorites, setFavorites] = useState<GitHubRepo[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const s = localStorage.getItem("gh-favorites");
      setFavorites(s ? JSON.parse(s) : []);
    } catch {
      setFavorites([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  const toggle = useCallback((repo: GitHubRepo) => {
    setFavorites((prev) => {
      const exists = prev.some((r) => r.id === repo.id);
      const next = exists
        ? prev.filter((r) => r.id !== repo.id)
        : [repo, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem("gh-favorites", JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const isFav = useCallback(
    (id: number) => favorites.some((r) => r.id === id),
    [favorites]
  );

  return { favorites, toggle, isFav, hydrated };
}

interface SearchResult {
  items: GitHubRepo[];
  total: number;
  loading: boolean;
  error: string | null;
}

function useGitHubSearch(params: SearchParams): SearchResult {
  const [state, setState] = useState<SearchResult>({
    items: [],
    total: 0,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!params.query.trim()) {
      setState({ items: [], total: 0, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    const q = params.language
      ? `${params.query} language:${params.language}`
      : params.query;
    const sortParam =
      params.sort !== "best-match" ? `&sort=${params.sort}&order=desc` : "";
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}${sortParam}&per_page=${PER_PAGE}&page=${params.page}`;

    fetch(url, { headers: { Accept: "application/vnd.github.v3+json" } })
      .then(async (res) => {
        if (res.status === 403) {
          throw new Error(
            "Rate limit exceeded. Please wait a minute and try again."
          );
        }
        if (res.status === 422) {
          throw new Error("Invalid search query. Please refine your search.");
        }
        if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setState({
            items: data.items || [],
            total: Math.min(data.total_count || 0, 1000),
            loading: false,
            error: null,
          });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setState({ items: [], total: 0, loading: false, error: err.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.query, params.sort, params.language, params.page]);

  return state;
}

function useLanguages(repo: GitHubRepo | null) {
  const [langs, setLangs] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!repo) {
      setLangs(null);
      return;
    }
    setLoading(true);
    fetch(`https://api.github.com/repos/${repo.full_name}/languages`)
      .then((r) => r.json())
      .then((d) => {
        setLangs(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [repo?.full_name]);
  return { langs, loading };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LangDot({ lang }: { lang: string }) {
  const color = LANG_COLORS[lang] || "#8b949e";
  return (
    <span
      className="inline-block w-3 h-3 rounded-full shrink-0"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function SkeletonCard() {
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

function EmptyState({
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
        No results for <span className="font-mono font-medium">"{query}"</span>.
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

function ErrorState({
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

function LandingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="w-9 h-9 text-primary"
          fill="currentColor"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Explore GitHub Repositories
      </h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        Search millions of open-source repositories. Filter by language, sort by
        stars, and save your favorites.
      </p>
      <div className="mt-8 grid grid-cols-3 gap-6 text-center">
        {[
          { icon: Search, label: "Smart search" },
          { icon: Star, label: "Save favorites" },
          { icon: GitFork, label: "Explore forks" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / PER_PAGE);
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 py-4 border-t border-border"
    >
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            aria-current={p === page ? "page" : undefined}
            className={clsx(
              "min-w-[32px] h-8 px-2 rounded text-sm font-mono transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              p === page
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

function RepoCard({
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

function LanguageBar({ langs }: { langs: Record<string, number> }) {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden gap-px mb-2">
        {sorted.map(([lang, bytes]) => (
          <div
            key={lang}
            style={{
              width: `${(bytes / total) * 100}%`,
              backgroundColor: LANG_COLORS[lang] || "#8b949e",
            }}
            title={`${lang}: ${((bytes / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {sorted.map(([lang, bytes]) => (
          <span key={lang} className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <LangDot lang={lang} />
            {lang}
            <span className="text-muted-foreground/70">
              {((bytes / total) * 100).toFixed(1)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailPanel({
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

function FavoritesPanel({
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

// ─── Main App ─────────────────────────────────────────────────────────────────

export function AppShell() {
  const [dark, setDark] = useDarkMode();
  const { favorites, toggle: toggleFav, isFav, hydrated } = useFavorites();

  const initialParams = getURLParams();
  const [inputValue, setInputValue] = useState(initialParams.query);
  const [sort, setSort] = useState<SortOption>(initialParams.sort);
  const [language, setLanguage] = useState(initialParams.language);
  const [page, setPage] = useState(initialParams.page);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "favorites">("search");
  const [showFilters, setShowFilters] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);

  const debouncedQuery = useDebounce(inputValue, 500);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchParams: SearchParams = {
    query: debouncedQuery,
    sort,
    language,
    page,
  };

  const { items, total, loading, error } = useGitHubSearch(searchParams);

  // Sync URL when search params change
  useEffect(() => {
    if (debouncedQuery) {
      pushURLParams(
        { query: debouncedQuery, sort, language, page },
        selectedRepo?.full_name
      );
    }
  }, [debouncedQuery, sort, language, page, selectedRepo?.full_name]);

  // Reset page when query/filters change
  useEffect(() => {
    setPage(1);
    setSelectedRepo(null);
    setMobileDetail(false);
  }, [debouncedQuery, sort, language]);

  const handleSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setMobileDetail(true);
  };

  const handleClose = () => {
    setSelectedRepo(null);
    setMobileDetail(false);
  };

  const handleClearSearch = () => {
    setInputValue("");
    setSelectedRepo(null);
    window.history.pushState({}, "", window.location.pathname);
    inputRef.current?.focus();
  };

  const handleRetry = () => {
    setPage((p) => p); // trigger re-fetch by no-op state change trick
    setSort((s) => s);
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-foreground"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="text-sm font-semibold hidden sm:block">
              RepoExplorer
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search repositories…"
              aria-label="Search repositories"
              className="w-full pl-9 pr-8 py-1.5 text-sm bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow placeholder:text-muted-foreground"
              style={{ fontFamily: "var(--font-sans)" }}
            />
            {inputValue && (
              <button
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveTab("search")}
              aria-pressed={activeTab === "search"}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === "search"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Search</span>
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              aria-pressed={activeTab === "favorites"}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === "favorites"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Favorites</span>
              {hydrated && favorites.length > 0 && (
                <span className="text-[10px] font-mono bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {favorites.length > 9 ? "9+" : favorites.length}
                </span>
              )}
            </button>
          </nav>

          {/* Dark mode */}
          <button
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="shrink-0 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto flex flex-col">
        {activeTab === "favorites" ? (
          /* Favorites view */
          <div className="flex flex-col lg:flex-row flex-1 min-h-0">
            <div
              className={clsx(
                "lg:w-[420px] xl:w-[480px] shrink-0 border-r border-border flex flex-col",
                mobileDetail && selectedRepo ? "hidden lg:flex" : "flex"
              )}
            >
              <FavoritesPanel
                favorites={favorites}
                isFav={isFav}
                onToggleFav={toggleFav}
                onSelect={handleSelect}
                selectedId={selectedRepo?.id ?? null}
                onClose={() => setActiveTab("search")}
                hydrated={hydrated}
              />
            </div>
            {/* Detail pane */}
            <div
              className={clsx(
                "flex-1 min-w-0",
                mobileDetail && selectedRepo ? "flex flex-col" : "hidden lg:flex lg:flex-col"
              )}
            >
              {selectedRepo ? (
                <DetailPanel
                  repo={selectedRepo}
                  isFav={isFav(selectedRepo.id)}
                  onFav={() => toggleFav(selectedRepo)}
                  onClose={handleClose}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Select a repository to view details
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Search view */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Filter bar */}
            {debouncedQuery && (
              <div className="border-b border-border bg-card px-4 py-2 flex flex-wrap items-center gap-3">
                {/* Result count */}
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {loading
                    ? "Searching…"
                    : total > 0
                    ? `${formatNumber(total)} results`
                    : ""}
                </span>

                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  {/* Sort */}
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="sort-select"
                      className="text-xs text-muted-foreground whitespace-nowrap"
                    >
                      Sort
                    </label>
                    <select
                      id="sort-select"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                      className="text-xs bg-input-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Language filter */}
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="lang-select"
                      className="text-xs text-muted-foreground whitespace-nowrap"
                    >
                      Language
                    </label>
                    <select
                      id="lang-select"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="text-xs bg-input-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      <option value="">All</option>
                      {POPULAR_LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear filters */}
                  {(sort !== "best-match" || language) && (
                    <button
                      onClick={() => {
                        setSort("best-match");
                        setLanguage("");
                      }}
                      className="text-xs text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Two-column layout */}
            <div className="flex flex-1 min-h-0">
              {/* List column */}
              <div
                className={clsx(
                  "flex flex-col border-r border-border lg:w-[420px] xl:w-[480px] shrink-0",
                  mobileDetail && selectedRepo ? "hidden lg:flex" : "flex w-full"
                )}
              >
                <div className="flex-1 overflow-y-auto">
                  {loading && !items.length ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))
                  ) : error ? (
                    <ErrorState message={error} onRetry={handleRetry} />
                  ) : !debouncedQuery ? (
                    <LandingState />
                  ) : items.length === 0 ? (
                    <EmptyState
                      query={debouncedQuery}
                      onClear={handleClearSearch}
                    />
                  ) : (
                    <>
                      {items.map((repo) => (
                        <RepoCard
                          key={repo.id}
                          repo={repo}
                          selected={selectedRepo?.id === repo.id}
                          isFav={isFav(repo.id)}
                          onSelect={() => handleSelect(repo)}
                          onFav={(e) => {
                            e.stopPropagation();
                            toggleFav(repo);
                          }}
                        />
                      ))}
                      {loading && (
                        <div className="flex justify-center py-4">
                          <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                        </div>
                      )}
                    </>
                  )}
                </div>
                {/* Pagination */}
                {!loading && !error && items.length > 0 && (
                  <Pagination
                    page={page}
                    total={total}
                    onChange={(p) => {
                      setPage(p);
                      setSelectedRepo(null);
                      setMobileDetail(false);
                    }}
                  />
                )}
              </div>

              {/* Detail column */}
              <div
                className={clsx(
                  "flex-1 min-w-0 overflow-hidden",
                  mobileDetail && selectedRepo
                    ? "flex flex-col"
                    : "hidden lg:flex lg:flex-col"
                )}
              >
                {selectedRepo ? (
                  <DetailPanel
                    repo={selectedRepo}
                    isFav={isFav(selectedRepo.id)}
                    onFav={() => toggleFav(selectedRepo)}
                    onClose={handleClose}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <BookmarkCheck
                      className="w-12 h-12 text-muted-foreground mb-3"
                      strokeWidth={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      Select a repository from the list to view its details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
