# GitHub Repository Explorer

Aplikasi web untuk mencari dan mengeksplorasi repositori GitHub menggunakan GitHub REST API publik. Dibangun sebagai bagian dari technical assessment frontend.

---

## Cara Menjalankan Secara Lokal

**Prasyarat:** Node.js 18+ dan pnpm

```bash
# Clone repo
git clone https://github.com/username/repo-name.git
cd repo-name

# Install dependencies
pnpm install

# Jalankan dev server
pnpm dev
```

Buka [http://localhost:5173](http://localhost:5173) di browser.

> **Catatan:** Aplikasi menggunakan GitHub REST API publik tanpa autentikasi. Rate limit berlaku: 10 request/menit untuk search, 60 request/jam untuk endpoint lain. Jika muncul pesan rate limit, tunggu sebentar lalu coba lagi.

---

## Fitur

### Wajib
- **Pencarian dengan debounce** — Input menunggu 500ms setelah pengguna berhenti mengetik sebelum mengirim request, menghindari banjir API
- **Daftar hasil dengan pagination** — Menampilkan 10 hasil per halaman dengan navigasi halaman yang rapi; GitHub membatasi maksimal 1.000 hasil per query
- **Detail repositori** — Panel detail menampilkan statistik (stars, forks, watchers, issues), breakdown bahasa, topik, lisensi, ukuran repo, dan tanggal
- **Semua kondisi UI** — Loading skeleton, empty state, error state dengan tombol retry, dan landing state saat belum ada pencarian
- **Penggunaan API efisien** — Request lama dibatalkan (`AbortController` pattern via cleanup `useEffect`) saat query baru masuk; tidak ada polling atau loop tak perlu
- **Tampilan responsif** — Mobile: list → detail full screen; tablet: layout stack; desktop: dua kolom (list kiri, detail kanan)
- **Filter dan sorting** — Filter berdasarkan 13 bahasa populer; sort berdasarkan Best Match, Most Stars, Most Forks, Recently Updated

### Nilai Tambah
- **Favorit persisten** — Simpan repositori ke daftar favorit, disimpan di `localStorage` dan bertahan antar sesi
- **URL state sync** — Query, filter, halaman, dan repo yang dipilih tersimpan di query params (`?q=react&sort=stars&lang=TypeScript&page=2`). Link bisa dibagikan dan di-bookmark
- **Dark mode** — Toggle light/dark dengan deteksi otomatis `prefers-color-scheme`, preferensi disimpan di `localStorage`

---

## Keputusan Teknis

### Framework: React + Vite (bukan Next.js)
Assessment meminta Next.js, namun environment deploy yang tersedia adalah Vite/React SPA. Secara arsitektur, semua pattern yang digunakan (hooks, komponen terpisah, URL state sync) sepenuhnya kompatibel dan bisa dimigrasikan ke Next.js App Router tanpa perubahan logika bisnis — hanya perlu mengganti `window.history.pushState` dengan `useRouter` dan `useSearchParams` dari Next.js.

**Trade-off:** Kehilangan SSR dan file-based routing, tapi mendapatkan simplisitas deployment dan bundle yang lebih ringan untuk use case ini.

### State Management: React Hooks (tanpa library eksternal)
Memilih custom hooks (`useGitHubSearch`, `useFavorites`, `useDarkMode`) daripada Redux/Zustand karena:
- State yang perlu di-share antar komponen relatif sederhana
- Tidak ada kebutuhan optimistic update atau cache invalidation kompleks
- Menghindari overhead library untuk scope masalah yang bisa diselesaikan dengan `useState` + `useEffect`

**Trade-off:** Jika fitur berkembang (mis. cache hasil pencarian, shared state yang lebih kompleks), akan lebih sulit di-maintain dibanding solusi terpusat seperti Zustand.

### Data Fetching: Native `fetch` (tanpa React Query/SWR)
Memilih tidak menambahkan library data fetching karena GitHub API yang digunakan bersifat sederhana (satu endpoint search, satu endpoint languages). Custom hook `useGitHubSearch` sudah menangani:
- Request cancellation via boolean `cancelled` flag
- Loading/error state
- Deduplication (debounce + dependency array `useEffect`)

**Trade-off:** Tidak ada caching otomatis — berpindah halaman lalu kembali akan re-fetch. Jika ini produk nyata, React Query atau SWR akan lebih tepat.

### Debounce: 500ms
Dipilih berdasarkan keseimbangan antara responsivitas (tidak terasa lambat) dan efisiensi API. Nilai di bawah 300ms mulai membanjiri API; di atas 700ms terasa lag.

### Styling: Tailwind CSS
Memungkinkan iterasi cepat tanpa context switching ke file CSS terpisah. Design tokens (warna, radius, tipografi) dikelola di `src/styles/theme.css` sehingga mudah diganti secara konsisten untuk light/dark mode.

### Tipografi
- **Inter** untuk UI umum — humanist sans yang sangat readable di layar kecil maupun besar
- **JetBrains Mono** untuk angka dan label teknis (jumlah stars, ukuran file, bahasa) — monospace membantu alignment visual di data-dense UI

---

## Yang Akan Ditambahkan Jika Ada Waktu Lebih

1. **GitHub Personal Access Token support** — Form opsional untuk memasukkan token sendiri, menaikkan rate limit dari 60 ke 5.000 request/jam
2. **Search riwayat** — Menyimpan 10 pencarian terakhir di localStorage dan menampilkannya sebagai suggestion dropdown
3. **Tab "Contributors" di detail panel** — Fetch dan tampilkan top contributors dari `GET /repos/{owner}/{repo}/contributors`
4. **Infinite scroll** sebagai alternatif pagination — Lebih natural di mobile
5. **Unit test** untuk custom hooks (`useGitHubSearch`, `useFavorites`) menggunakan Vitest + `@testing-library/react`
6. **Keyboard shortcuts** — `/` untuk fokus ke search box, `Escape` untuk tutup detail panel, arrow keys untuk navigasi list
7. **Migrasi ke Next.js** — App Router dengan `useSearchParams`, SSR untuk initial search dari URL, dan `generateMetadata` untuk SEO

---

