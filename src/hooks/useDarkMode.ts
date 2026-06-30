import { useState, useEffect } from "react";

export function useDarkMode() {
  // Lazy init: baca class yang sudah dipasang oleh blocking script di layout.tsx,
  // supaya state awal React match dengan apa yang sudah ter-render di HTML.
  // Mencegah flash sesaat setelah hydration. Nomor 12
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  // Sinkronkan ulang setelah mount (mis. kalau localStorage berubah di tab lain,
  // atau saat SSR vs client mismatch jarang terjadi)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("gh-dark");
    const initialDark =
      stored !== null
        ? stored === "true"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;

    setDark(initialDark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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