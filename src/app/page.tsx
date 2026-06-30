"use client";

import dynamic from "next/dynamic";

// AppShell murni client-side (baca window.location, localStorage, fetch GitHub API
// langsung di browser saat mount). SSR untuk komponen ini cuma bikin hydration
// mismatch (server render default state, client render state hasil baca URL).
// ssr:false memastikan komponen ini HANYA pernah dirender di client -> tidak ada
// dua versi HTML yang dibandingkan, jadi tidak ada hydration error.
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

export default function Home() {
  return <AppShell />;
}