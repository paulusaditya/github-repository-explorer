import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* konfigurasi kamu yang lain jika ada */
  typescript: {
    // Mengizinkan produksi build tetap selesai meskipun ada error TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Mengizinkan produksi build tetap selesai meskipun ada error ESLint/Linter
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;