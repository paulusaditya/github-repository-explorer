"use client";

import { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import { Search, Moon, Sun, Heart, BookmarkCheck } from "lucide-react";

import type { GitHubRepo, SearchParams, SortOption } from "@/types/github";
import { PER_PAGE, POPULAR_LANGUAGES, SORT_OPTIONS } from "@/lib/constants";
import { formatNumber, getURLParams, pushURLParams } from "@/lib/github";

import { useDebounce } from "@/hooks/useDebounce";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useFavorites } from "@/hooks/useFavorites";
import { useGitHubSearch } from "@/hooks/useGitHubSearch";

import { RepoCard } from "@/components/RepoCard";
import { DetailPanel } from "@/components/DetailPanel";
import { FavoritesPanel } from "@/components/FavoritesPanel";
import { Pagination } from "@/components/Pagination";
import { SkeletonCard } from "@/components/states/SkeletonCard";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LandingState } from "@/components/states/LandingState";

export function AppShell() {
  const [dark, setDark] = useDarkMode();
  const { favorites, toggle: toggleFav, isFav, hydrated } = useFavorites();

  // State awal identik di server dan client untuk mencegah hydration mismatch.
  // URL params disinkronkan via useEffect setelah mount (client only).
  const [inputValue, setInputValue] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("best-match");
  const [language, setLanguage] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "favorites">("search");
  const [mobileDetail, setMobileDetail] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Baca URL params sekali setelah mount di client.
  useEffect(() => {
    const p = getURLParams();
    if (p.query) {
      setInputValue(p.query);
      setSubmittedQuery(p.query);
    }
    if (p.sort !== "best-match") setSort(p.sort);
    if (p.language) setLanguage(p.language);
    if (p.page !== 1) setPage(p.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useGitHubSearch sekarang pakai submittedQuery (bukan debounced input)
  const searchParams: SearchParams = {
    query: submittedQuery,
    sort,
    language,
    page,
  };

  const { items, total, loading, error } = useGitHubSearch(searchParams);

  // Sync URL params saat query/filter berubah
  useEffect(() => {
    if (submittedQuery) {
      pushURLParams(
        { query: submittedQuery, sort, language, page },
        selectedRepo?.full_name
      );
    }
  }, [submittedQuery, sort, language, page, selectedRepo?.full_name]);

  // Reset page + selected saat query/filter berubah
  useEffect(() => {
    setPage(1);
    setSelectedRepo(null);
    setMobileDetail(false);
  }, [submittedQuery, sort, language]);

  const handleSubmit = () => {
    const q = inputValue.trim();
    if (!q) return;
    setSubmittedQuery(q);
    setPage(1);
    setSelectedRepo(null);
    setMobileDetail(false);
  };

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
    setSubmittedQuery("");
    setSelectedRepo(null);
    window.history.pushState({}, "", window.location.pathname);
    inputRef.current?.focus();
  };

  const handleGoHome = () => {
    setInputValue("");
    setSubmittedQuery("");
    setSort("best-match");
    setLanguage("");
    setPage(1);
    setSelectedRepo(null);
    setActiveTab("search");
    setMobileDetail(false);
    window.history.pushState({}, "", window.location.pathname);
    inputRef.current?.focus();
  };

  const handleRetry = () => {
    // trigger re-fetch dengan copy value
    setSubmittedQuery((q) => q + "");
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="w-full px-4 h-14 grid grid-cols-[auto_1fr_auto] items-center gap-4">

          {/* Kiri: Logo */}
          <button
            onClick={handleGoHome}
            aria-label="Go to home"
            className="flex items-center gap-2 shrink-0 rounded-lg px-1 py-1 hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-foreground" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="text-sm font-semibold hidden sm:block">RepoExplorer</span>
          </button>

          {/* Tengah: Search — tekan Enter untuk search */}
          <div className="relative w-full max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") handleClearSearch();
              }}
              placeholder="Search repositories..."
              aria-label="Search repositories"
              className="w-full pl-9 pr-24 py-1.5 text-sm bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow placeholder:text-muted-foreground"
              style={{ fontFamily: "var(--font-sans)" }}
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {inputValue && (
                <button
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleSubmit}
                aria-label="Search"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Search className="w-3 h-3" />
                <span className="hidden sm:block">Search</span>
              </button>
            </div>
          </div>

          {/* Kanan: Favorites + Dark mode */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveTab(activeTab === "favorites" ? "search" : "favorites")}
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

            <button
              onClick={() => setDark(!dark)}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 w-full flex flex-col">
        {activeTab === "favorites" ? (
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
          <div className="flex flex-col flex-1 min-h-0">
            {/* Filter bar */}
            {submittedQuery && (
              <div className="border-b border-border bg-card px-4 py-2 flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {loading ? "Searching…" : total > 0 ? `${formatNumber(total)} results` : ""}
                </span>
                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="sort-select" className="text-xs text-muted-foreground whitespace-nowrap">
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
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="lang-select" className="text-xs text-muted-foreground whitespace-nowrap">
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
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  {(sort !== "best-match" || language) && (
                    <button
                      onClick={() => { setSort("best-match"); setLanguage(""); }}
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
              {/* List */}
              <div
                className={clsx(
                  "flex flex-col border-r border-border lg:w-[420px] xl:w-[480px] shrink-0",
                  mobileDetail && selectedRepo ? "hidden lg:flex" : "flex w-full"
                )}
              >
                <div className="flex-1 overflow-y-auto">
                  {loading && !items.length ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                  ) : error ? (
                    <ErrorState message={error} onRetry={handleRetry} />
                  ) : !submittedQuery ? (
                    <LandingState />
                  ) : items.length === 0 ? (
                    <EmptyState query={submittedQuery} onClear={handleClearSearch} />
                  ) : (
                    <>
                      {items.map((repo) => (
                        <RepoCard
                          key={repo.id}
                          repo={repo}
                          selected={selectedRepo?.id === repo.id}
                          isFav={isFav(repo.id)}
                          onSelect={() => handleSelect(repo)}
                          onFav={(e) => { e.stopPropagation(); toggleFav(repo); }}
                        />
                      ))}
                      {loading && (
                        <div className="flex justify-center py-4">
                          <span className="text-muted-foreground text-xs">Loading…</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
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

              {/* Detail */}
              <div
                className={clsx(
                  "flex-1 min-w-0 overflow-hidden",
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
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <BookmarkCheck className="w-12 h-12 text-muted-foreground mb-3" strokeWidth={1} />
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