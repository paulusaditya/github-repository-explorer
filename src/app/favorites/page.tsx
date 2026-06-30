"use client";

import dynamic from "next/dynamic";

// Sama seperti app/page.tsx — AppShell murni client-side, jadi SSR dimatikan
// supaya tidak ada hydration mismatch akibat baca window.location/localStorage.
const AppShell = dynamic(
  () => import("@/components/AppShell").then((m) => m.AppShell),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    ),
  }
);

export default function FavoritesPage() {
  return <AppShell initialTab="favorites" />;
}