export interface Owner {
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface GitHubRepo {
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

export type SortOption = "best-match" | "stars" | "forks" | "updated";

export interface SearchParams {
  query: string;
  sort: SortOption;
  language: string;
  page: number;
}

export interface SearchResult {
  items: GitHubRepo[];
  total: number;        // dibatasi 1000 — untuk pagination (GitHub limit) Nomor 8
  totalDisplay: number; // angka asli dari API — untuk ditampilkan ke user
  loading: boolean;
  error: string | null;
}