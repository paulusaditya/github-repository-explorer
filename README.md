# GitHub Repository Explorer

Aplikasi web untuk mencari dan mengeksplorasi repositori GitHub menggunakan GitHub REST API publik. Dibangun sebagai bagian dari technical assessment frontend.

**Live demo:** [github-repository-explorer-lake.vercel.app](https://github-repository-explorer-lake.vercel.app/)

---

## Cara Menjalankan Secara Lokal

**Prasyarat:** Node.js 18+ dan npm

```bash
# Clone repo
git clone https://github.com/<username>/github-repository-explorer.git
cd github-repository-explorer

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

> **Catatan:** Aplikasi menggunakan GitHub REST API publik tanpa autentikasi. Rate limit berlaku: 10 request/menit untuk search, 60 request/jam untuk endpoint lain. Jika muncul pesan rate limit, tunggu sebentar lalu coba lagi.

### Menjalankan Test

```bash
npm test              # jalankan semua test sekali
npm run test:watch    # watch mode, untuk development
npm run test:coverage # jalankan dengan laporan coverage
```

---

## Fitur

### Wajib

- **Pencarian dengan debounce** — Input menunggu 500ms setelah pengguna berhenti mengetik sebelum mengirim request, menghindari banjir API
- **Daftar hasil dengan pagination** — Menampilkan 10 hasil per halaman dengan navigasi halaman yang rapi; GitHub membatasi maksimal 1.000 hasil per query
- **Detail repositori** — Panel detail menampilkan statistik (stars, forks, watchers, issues), breakdown bahasa, topik, lisensi, ukuran repo, dan tanggal
- **Semua kondisi UI** — Loading skeleton, empty state, error state dengan tombol retry, dan landing state saat belum ada pencarian
- **Penggunaan API efisien** — Request lama diabaikan (pattern `cancelled` flag via cleanup `useEffect`) saat query baru masuk; tidak ada polling atau loop tak perlu
- **Tampilan responsif** — Mobile: list → detail full screen; tablet: layout stack; desktop: dua kolom (list kiri, detail kanan)
- **Filter dan sorting** — Filter berdasarkan 13 bahasa populer; sort berdasarkan Best Match, Most Stars, Most Forks, Recently Updated

### Nilai Tambah

- **Favorit persisten** — Simpan repositori ke daftar favorit, disimpan di `localStorage` dan bertahan antar sesi
- **URL state sync** — Query, filter, halaman, dan repo yang dipilih tersimpan di query params (`?q=react&sort=stars&lang=TypeScript&page=2`). Link bisa dibagikan dan di-bookmark
- **Dark mode** — Toggle light/dark dengan deteksi otomatis `prefers-color-scheme`, preferensi disimpan di `localStorage`
- **Pengujian otomatis** — 48 test (unit + integration) menggunakan Vitest dan React Testing Library, mencakup hooks, komponen, dan alur pencarian end-to-end

---

## Keputusan Teknis

### Framework: Next.js (App Router)

Menggunakan Next.js dengan App Router sesuai rekomendasi assessment. Semua interaktivitas (search, filter, favorites, dark mode) berjalan sebagai Client Component (`"use client"`), karena seluruh state bergantung pada interaksi browser (input, localStorage, URL query params) dan data diambil langsung dari GitHub API di sisi client tanpa backend.

**Trade-off:** Tidak memanfaatkan Server Component atau SSR data-fetching untuk pencarian awal, karena GitHub API publik dipanggil langsung dari client sesuai ketentuan teknis (tidak perlu backend). Komponen utama (`AppShell`) tetap perlu inisialisasi state secara konsisten di server dan client untuk menghindari hydration mismatch — state dimulai dengan nilai default, lalu disinkronkan ke URL query params lewat `useEffect` setelah mount, bukan dibaca langsung dari `window.location` saat render.

### Struktur Kode: Pemisahan Komponen, Hooks, dan Lib

Kode dipecah menjadi modul-modul kecil dan terfokus:
src/

├── app/              # routing Next.js saja: layout.tsx, page.tsx, globals.css

├── components/       # komponen UI (AppShell, RepoCard, DetailPanel, dst)

│   └── states/        # komponen untuk loading/empty/error/landing state

├── hooks/            # custom hooks (useDebounce, useFavorites, useGitHubSearch, dst)

├── lib/              # fungsi utilitas murni (format angka/tanggal, parsing URL params)

└── types/            # definisi TypeScript (GitHubRepo, SearchParams, dst)

**Alasan:** Memisahkan logic (hooks), presentasi (components), dan utilitas murni (lib) membuat setiap bagian bisa diuji secara terisolasi, lebih mudah dibaca, dan lebih mudah di-maintain dibanding satu file besar yang menggabungkan semuanya.

**Trade-off:** Lebih banyak file dan lebih banyak import dibanding pendekatan satu file, tapi keterbacaan dan testability yang didapat jauh lebih besar daripada biaya tambahan ini.

### State Management: React Hooks (tanpa library eksternal)

Memilih custom hooks (`useGitHubSearch`, `useFavorites`, `useDarkMode`, `useDebounce`) daripada Redux/Zustand karena:

- State yang perlu di-share antar komponen relatif sederhana
- Tidak ada kebutuhan optimistic update atau cache invalidation kompleks
- Menghindari overhead library untuk scope masalah yang bisa diselesaikan dengan `useState` + `useEffect`

**Trade-off:** Jika fitur berkembang (mis. cache hasil pencarian, shared state yang lebih kompleks), akan lebih sulit di-maintain dibanding solusi terpusat seperti Zustand.

### Data Fetching: Native `fetch` (tanpa React Query/SWR)

Memilih tidak menambahkan library data fetching karena GitHub API yang digunakan bersifat sederhana (satu endpoint search, satu endpoint languages). Custom hook `useGitHubSearch` sudah menangani:

- Request cancellation via boolean `cancelled` flag di cleanup `useEffect`
- Loading/error state
- Deduplication (debounce + dependency array `useEffect`)

**Trade-off:** Tidak ada caching otomatis — berpindah halaman lalu kembali akan re-fetch. Jika ini produk nyata, React Query atau SWR akan lebih tepat.

### Debounce: 500ms

Dipilih berdasarkan keseimbangan antara responsivitas (tidak terasa lambat) dan efisiensi API. Nilai di bawah 300ms mulai membanjiri API; di atas 700ms terasa lag.

### Styling: Tailwind CSS

Memungkinkan iterasi cepat tanpa context switching ke file CSS terpisah. Design tokens (warna, radius, tipografi) dikelola secara konsisten untuk light/dark mode.

### Tipografi

- **Inter** untuk UI umum — humanist sans yang sangat readable di layar kecil maupun besar
- **JetBrains Mono** untuk angka dan label teknis (jumlah stars, ukuran file, bahasa) — monospace membantu alignment visual di data-dense UI

### Pengujian: Vitest + React Testing Library

Memilih Vitest dibanding Jest karena:

- Setup lebih ringan untuk project TypeScript + Next.js (tidak perlu konfigurasi transform manual sebanyak Jest)
- Native ESM, lebih cepat dijalankan
- API mirip Jest (`describe`, `it`, `expect`), sehingga tetap familiar

**Cakupan test (48 test, 7 file):**

| Area | Yang diuji |
|---|---|
| `lib/github.ts` | Fungsi murni: format angka/tanggal/bytes, parsing & penulisan URL query params |
| `hooks/useDebounce` | Delay debounce, reset timer saat value berubah sebelum delay selesai |
| `hooks/useFavorites` | Tambah/hapus favorit, persistensi localStorage, fallback saat data localStorage korup |
| `hooks/useGitHubSearch` | Loading/error state, error 403 (rate limit) & 422 (query invalid), pembatasan total 1000, race condition antar request (request lama tidak menimpa hasil request baru) |
| `components/RepoCard` | Render data, klik & navigasi keyboard (Enter), `stopPropagation` tombol favorit |
| `components/Pagination` | Disable tombol di halaman pertama/terakhir, ellipsis untuk banyak halaman, navigasi |
| `components/FavoritesPanel` | Empty state, render daftar, toggle favorit, badge jumlah setelah hydrated |
| `components/AppShell` (integration) | Alur pencarian penuh: debounce → loading → empty/error/hasil → pilih detail → tab favorites |

**Trade-off:** Test integration di `AppShell` mensimulasikan fetch dengan mock, bukan request sungguhan ke GitHub API — ini menjaga test cepat dan deterministik, tapi tidak menangkap perubahan kontrak API GitHub yang sesungguhnya (mis. perubahan struktur response).

---

## Yang Akan Ditambahkan Jika Ada Waktu Lebih

1. **GitHub Personal Access Token support** — Form opsional untuk memasukkan token sendiri, menaikkan rate limit dari 60 ke 5.000 request/jam
2. **Riwayat pencarian** — Menyimpan 10 pencarian terakhir di localStorage dan menampilkannya sebagai suggestion dropdown
3. **Tab "Contributors" di detail panel** — Fetch dan tampilkan top contributors dari `GET /repos/{owner}/{repo}/contributors`
4. **Infinite scroll** sebagai alternatif pagination — Lebih natural di mobile
5. **Keyboard shortcuts** — `/` untuk fokus ke search box, `Escape` untuk tutup detail panel, arrow keys untuk navigasi list
6. **E2E test** dengan Playwright untuk melengkapi unit/integration test yang sudah ada, terutama untuk memverifikasi perilaku di browser sungguhan (bukan jsdom)
7. **CI pipeline** (GitHub Actions) untuk menjalankan test dan lint otomatis di setiap push/PR

---

## Perkiraan Waktu Pengerjaan

Sekitar **4 jam**, mencakup development fitur inti, refactor struktur kode menjadi modul terpisah, serta penulisan dan perbaikan test (unit + integration).

---

## Catatan Teknis Lain

- Search box menggunakan `<input type="search">` dengan `aria-label` eksplisit untuk aksesibilitas.
- Semua elemen interaktif (kartu repo, tombol pagination, tombol favorit) dapat dinavigasi dan dioperasikan lewat keyboard (`Tab`, `Enter`, `Space`).
- State awal komponen utama (`AppShell`) sengaja diinisialisasi dengan nilai default yang identik di server dan client untuk menghindari *hydration mismatch* khas Next.js App Router; nilai dari URL query params disinkronkan setelah mount lewat `useEffect`.
- Nama file di repo disesuaikan agar konsisten dengan huruf besar/kecil pada statement import (`useGitHubSearch.ts`, bukan `useGithubSearch.ts`), karena environment deploy (Linux) bersifat case-sensitive berbeda dari Windows.