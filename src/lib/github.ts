import type { SearchParams, SortOption } from "@/types/github";

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

export function formatDate(iso: string): string {
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

export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatBytes(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function getURLParams(): SearchParams {
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

export function pushURLParams(params: SearchParams, selectedRepo?: string | null) {
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