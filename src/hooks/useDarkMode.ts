import { useState, useEffect } from "react";

export function useDarkMode() {
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