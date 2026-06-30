"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Search, Moon, Sun, Heart, BookmarkCheck } from "lucide-react";

import type { GitHubRepo, SearchParams, SortOption } from "@/types/github";
import { POPULAR_LANGUAGES, SORT_OPTIONS } from "@/lib/constants";
import { getURLParams, pushURLParams } from "@/lib/github";

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

// Tinggi header (h-14 = 3.5rem). Dipakai untuk menghitung tinggi kolom sidebar
// supaya scroll-nya independen dan konsisten di breakpoint desktop (lg+).
const HEADER_HEIGHT = "3.5rem";

// Format angka tanpa singkatan k/M — tampilkan angka penuh dengan separator
function formatTotal(n: number): string {
  return n.toLocaleString("en-US");
}

// Baca query params dari URL secara SINKRON, dipakai sebagai initial state.
// Ini yang mencegah flash ke LandingState saat reload: state sudah benar
// di render pertama, tidak menunggu useEffect jalan setelah paint.
function getInitialParams() {
  if (typeof window === "undefined") {
    return { query: "", sort: "best-match" as SortOption, language: "", page: 1 };
  }
  return getURLParams();
}

function getInitialRepoFullName() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("repo");
}

interface AppShellProps {
  /** Tab awal saat komponen mount. Dikontrol oleh route: "/" -> "search", "/favorites" -> "favorites". */
  initialTab?: "search" | "favorites";
}

export function AppShell({ initialTab = "search" }: AppShellProps) {
  const router = useRouter();
  const [dark, setDark] = useDarkMode();
  const { favorites, toggle: toggleFav, isFav, hydrated } = useFavorites();

  const [initialParams] = useState(getInitialParams);
  const [initialRepoFullName] = useState(getInitialRepoFullName);

  const [inputValue, setInputValue] = useState(() => initialParams.query || "");
  const [submittedQuery, setSubmittedQuery] = useState(() => initialParams.query || "");
  const [sort, setSort] = useState<SortOption>(() => initialParams.sort || "best-match");
  const [language, setLanguage] = useState(() => initialParams.language || "");
  const [page, setPage] = useState(() => initialParams.page || 1);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "favorites">(initialTab);
  const [mobileDetail, setMobileDetail] = useState(false);

  // True selama proses fetch detail repo dari URL saat reload berlangsung.
  // Selagi true, UI normal (termasuk LandingState) belum dirender sama sekali,
  // supaya tidak ada flash "home" sebelum detail-nya muncul.
  const [restoringDetail, setRestoringDetail] = useState(() => !!initialRepoFullName);

  const inputRef = useRef<HTMLInputElement>(null);
  // ref untuk scroll list kembali ke atas saat pindah halaman
  const listRef = useRef<HTMLDivElement>(null);

  const searchParams: SearchParams = {
    query: submittedQuery,
    sort,
    language,
    page,
  };

  const { items, total, totalDisplay, loading, error } = useGitHubSearch(searchParams);

  // Sync URL saat state berubah (hanya relevan di halaman search "/")
  useEffect(() => {
    if (activeTab === "search" && submittedQuery) {
      pushURLParams(
        { query: submittedQuery, sort, language, page },
        selectedRepo?.full_name
      );
    }
  }, [activeTab, submittedQuery, sort, language, page, selectedRepo?.full_name]);

  // ── Reload dengan URL berisi ?repo=owner/name -> restore detail panel ──
  // Fetch langsung ke GitHub API karena repo yang dipilih belum tentu ada
  // di halaman hasil pencarian saat ini.
  useEffect(() => {
    if (!initialRepoFullName) return;

    let cancelled = false;
    fetch(`https://api.github.com/repos/${initialRepoFullName}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GitHubRepo | null) => {
        if (!cancelled && data) {
          setSelectedRepo(data);
          setMobileDetail(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRestoringDetail(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll list ke atas saat pindah halaman ────────────────────────
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleSubmit = () => {
    const q = inputValue.trim();
    if (!q) return;
    setSubmittedQuery(q);
    setPage(1);
    setSelectedRepo(null);
    setMobileDetail(false);
  };

  // Reset eksplisit dipanggil dari handler perubahan filter (bukan dari effect
  // yang memantau submittedQuery/sort/language), supaya tidak konflik dengan
  // restore state dari URL saat reload (efek lama menimpa balik page/selectedRepo
  // yang baru saja di-restore).
  const handleSortChange = (value: SortOption) => {
    setSort(value);
    setPage(1);
    setSelectedRepo(null);
    setMobileDetail(false);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    setPage(1);
    setSelectedRepo(null);
    setMobileDetail(false);
  };

  const handleClearFilters = () => {
    setSort("best-match");
    setLanguage("");
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
    router.push("/");
    inputRef.current?.focus();
  };

  const handleRetry = () => {
    setSubmittedQuery((q) => q + "");
  };

  // Selagi sedang fetch detail repo dari URL (reload di halaman detail),
  // tampilkan loading penuh layar dulu — JANGAN render layout normal,
  // supaya tidak sempat kelihatan LandingState/list sebelum detail muncul.
  if (restoringDetail) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-hidden bg-background text-foreground flex flex-col"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* ── Header ── */}
      <header
        className="shrink-0 z-30 bg-card border-b border-border shadow-sm"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="w-full px-4 h-full grid grid-cols-[auto_1fr_auto] items-center gap-4">

          {/* Kiri: Logo -> Home */}
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

          {/* Tengah: Search */}
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
              placeholder="Search repositories… (Enter to search)"
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
              onClick={() => router.push(activeTab === "favorites" ? "/" : "/favorites")}
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
      <main className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
        {activeTab === "favorites" ? (
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            {/* Sidebar favorites — scroll independen di desktop */}
            <div
              className={clsx(
                "lg:w-[420px] xl:w-[480px] shrink-0 border-r border-border flex flex-col overflow-y-auto",
                mobileDetail && selectedRepo ? "hidden lg:flex" : "flex"
              )}
            >
              <FavoritesPanel
                favorites={favorites}
                isFav={isFav}
                onToggleFav={toggleFav}
                onSelect={handleSelect}
                selectedId={selectedRepo?.id ?? null}
                onClose={() => router.push("/")}
                hydrated={hydrated}
              />
            </div>

            {/* Detail — scroll terkontainer sendiri, tidak ikut scroll halaman */}
            <div
              className={clsx(
                "flex-1 min-w-0 overflow-y-auto",
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
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

            {/* Filter bar + result count */}
            {submittedQuery && (
              <div className="shrink-0 border-b border-border bg-card px-4 py-2 flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {loading
                    ? "Searching…"
                    : totalDisplay > 0
                    ? `${formatTotal(totalDisplay)} results`
                    : "No results"}
                </span>

                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="sort-select" className="text-xs text-muted-foreground whitespace-nowrap">
                      Sort
                    </label>
                    <select
                      id="sort-select"
                      value={sort}
                      onChange={(e) => handleSortChange(e.target.value as SortOption)}
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
                      onChange={(e) => handleLanguageChange(e.target.value)}
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
                      onClick={handleClearFilters}
                      className="text-xs text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Three-column layout */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

              {/* List — scroll independen, pagination selalu kelihatan di dalam frame */}
              <div
                className={clsx(
                  "flex flex-col border-r border-border lg:w-[420px] xl:w-[480px] shrink-0 h-full",
                  mobileDetail && selectedRepo ? "hidden lg:flex" : "flex w-full"
                )}
              >
                <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto">
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
                  <div className="shrink-0">
                    <Pagination
                      page={page}
                      total={total}
                      onChange={(p) => {
                        setPage(p);
                        setSelectedRepo(null);
                        setMobileDetail(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Detail column — scroll terkontainer sendiri, TIDAK mendorong tinggi halaman */}
              <div
                className={clsx(
                  "flex-1 min-w-0 h-full overflow-y-auto",
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
                  <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
                    <BookmarkCheck className="w-10 h-10 text-muted-foreground/40 mb-3" strokeWidth={1} />
                    <p className="text-sm font-medium text-foreground mb-1">
                      No repository selected
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {submittedQuery
                        ? "Click any repository from the list on the left to view its details here."
                        : "Search for repositories and select one to view details."}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Sidebar favorites kanan — gaya sama persis dengan list kiri ──
                  Hanya tampil di halaman awal (belum ada submittedQuery / belum search).
                  Begitu user search atau buka detail repo, sidebar ini disembunyikan.
                  Kode TIDAK dihapus, hanya dibungkus kondisi di bawah. */}
              {!submittedQuery && (
              <div
                className={clsx(
                  "hidden lg:flex lg:flex-col border-l border-border lg:w-[320px] xl:w-[360px] shrink-0 h-full"
                )}
              >
                <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-primary" />
                    Your Favorites
                  </h3>
                  {hydrated && favorites.length > 0 && (
                    <button
                      onClick={() => router.push("/favorites")}
                      className="text-xs text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      View all
                    </button>
                  )}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  {!hydrated ? (
                    <div className="px-4 py-6 text-xs text-muted-foreground">Loading…</div>
                  ) : favorites.length === 0 ? (
                    <div className="px-4 py-6 text-xs text-muted-foreground">
                      You haven&apos;t saved any repositories yet. Tap the heart icon on a repo to save it here.
                    </div>
                  ) : (
                    favorites.map((repo) => (
                      <RepoCard
                        key={repo.id}
                        repo={repo}
                        selected={selectedRepo?.id === repo.id}
                        isFav={isFav(repo.id)}
                        onSelect={() => handleSelect(repo)}
                        onFav={(e) => { e.stopPropagation(); toggleFav(repo); }}
                      />
                    ))
                  )}
                </div>
              </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}