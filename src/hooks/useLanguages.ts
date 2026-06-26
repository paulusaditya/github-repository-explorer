import { useState, useEffect } from "react";
import type { GitHubRepo } from "@/types/github";

export function useLanguages(repo: GitHubRepo | null) {
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