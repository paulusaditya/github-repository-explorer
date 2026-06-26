import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AppShell } from "./AppShell";

describe("AppShell integration", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("menampilkan landing state saat belum ada pencarian", () => {
    render(<AppShell />);
    expect(screen.getByText(/explore github repositories/i)).toBeInTheDocument();
  });

  it("hanya memanggil fetch sekali setelah debounce, walau user mengetik banyak karakter", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], total_count: 0 }),
    });

    // gunakan fake timers HANYA untuk setTimeout debounce,
    // tapi beri tahu Vitest agar waitFor (queueMicrotask/promise) tetap berjalan normal
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      delay: null,
    });

    render(<AppShell />);

    const input = screen.getByPlaceholderText(/search repositories/i);
    await user.type(input, "react");

    // belum lewat debounce 500ms -> belum ada fetch
    expect(fetch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("menampilkan empty state saat hasil pencarian kosong", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], total_count: 0 }),
    });

    render(<AppShell />);
    fireEvent.change(screen.getByPlaceholderText(/search repositories/i), {
      target: { value: "zzzznonexistentrepo" },
    });

    // tunggu debounce 500ms + waktu fetch selesai, kasih timeout lebih besar dari default
    await waitFor(
      () => expect(screen.getByText(/no repositories found/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );
  }, 10000);

  it("menampilkan error state dengan tombol retry saat API gagal", async () => {
    (fetch as any).mockResolvedValue({ ok: false, status: 403 });

    render(<AppShell />);
    fireEvent.change(screen.getByPlaceholderText(/search repositories/i), {
      target: { value: "react" },
    });

    await waitFor(
      () => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  }, 10000);

  it("menampilkan detail panel saat repo dipilih dari list", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 1,
            full_name: "facebook/react",
            name: "react",
            description: null,
            html_url: "https://github.com/facebook/react",
            owner: { login: "facebook", avatar_url: "", html_url: "", type: "Organization" },
            stargazers_count: 1,
            forks_count: 1,
            watchers_count: 1,
            open_issues_count: 1,
            topics: [],
            size: 1,
            default_branch: "main",
            visibility: "public",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            pushed_at: "2024-01-01T00:00:00Z",
            archived: false,
            fork: false,
            homepage: null,
            language: null,
            license: null,
          },
        ],
        total_count: 1,
      }),
    });

    render(<AppShell />);
    fireEvent.change(screen.getByPlaceholderText(/search repositories/i), {
      target: { value: "react" },
    });

    await waitFor(
      () => expect(screen.getByText("facebook/react")).toBeInTheDocument(),
      { timeout: 3000 }
    );

    fireEvent.click(screen.getByText("facebook/react"));

    await waitFor(
      () => expect(screen.getByLabelText("Open on GitHub")).toBeInTheDocument(),
      { timeout: 3000 }
    );
  }, 10000);

  it("menampilkan empty state favorites saat belum ada repo difavoritkan", async () => {
    render(<AppShell />);

    // tombol tab nav "Favorites" - gunakan matcher function karena nama bisa
    // jadi "Favorites1" dst saat ada badge jumlah favorit
    fireEvent.click(
      screen.getByRole("button", {
        name: (name) => name.startsWith("Favorites"),
      })
    );

    await waitFor(() =>
      expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument()
    );
  });

  it("menambahkan repo ke favorites dan menampilkannya di tab Favorites", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 99,
            full_name: "vuejs/vue",
            name: "vue",
            description: null,
            html_url: "https://github.com/vuejs/vue",
            owner: { login: "vuejs", avatar_url: "", html_url: "", type: "Organization" },
            stargazers_count: 1,
            forks_count: 1,
            watchers_count: 1,
            open_issues_count: 1,
            topics: [],
            size: 1,
            default_branch: "main",
            visibility: "public",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            pushed_at: "2024-01-01T00:00:00Z",
            archived: false,
            fork: false,
            homepage: null,
            language: null,
            license: null,
          },
        ],
        total_count: 1,
      }),
    });

    render(<AppShell />);
    fireEvent.change(screen.getByPlaceholderText(/search repositories/i), {
      target: { value: "vue" },
    });

    await waitFor(
      () => expect(screen.getByText("vuejs/vue")).toBeInTheDocument(),
      { timeout: 3000 }
    );

    // klik tombol hati untuk menambahkan ke favorites
    fireEvent.click(screen.getByLabelText("Add to favorites"));

    // pindah ke tab Favorites. Gunakan matcher function karena accessible name
    // bisa jadi "Favorites1" dst saat badge jumlah favorit muncul (tanpa spasi,
    // karena badge & label adalah <span> bersebelahan tanpa whitespace di JSX)
    fireEvent.click(
      screen.getByRole("button", {
        name: (name) => name.startsWith("Favorites"),
      })
    );

    await waitFor(() =>
      expect(screen.getByText("vuejs/vue")).toBeInTheDocument()
    );
  }, 10000);

  it("menutup detail panel dan kembali ke tab Search saat tombol close di FavoritesPanel diklik", async () => {
    render(<AppShell />);

    fireEvent.click(
      screen.getByRole("button", {
        name: (name) => name.startsWith("Favorites"),
      })
    );
    await waitFor(() =>
      expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByLabelText("Close favorites"));

    await waitFor(() =>
      expect(screen.getByText(/explore github repositories/i)).toBeInTheDocument()
    );
  });
});