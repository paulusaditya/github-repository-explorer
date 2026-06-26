import { useState, useEffect, useCallback } from "react";
import type { GitHubRepo } from "@/types/github";

export function useFavorites() {
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