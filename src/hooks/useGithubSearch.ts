import { useState, useEffect } from "react";
import type { SearchParams, SearchResult } from "@/types/github";
import { PER_PAGE } from "@/lib/constants";

export function useGitHubSearch(params: SearchParams): SearchResult {
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