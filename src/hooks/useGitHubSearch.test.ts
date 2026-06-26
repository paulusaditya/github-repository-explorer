import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGitHubSearch } from "./useGitHubSearch";

describe("useGitHubSearch", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("tidak melakukan fetch jika query kosong", () => {
    renderHook(() => useGitHubSearch({ query: "", sort: "best-match", language: "", page: 1 }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("set loading true saat fetch dimulai, lalu items terisi saat sukses", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [{ id: 1, name: "react" }], total_count: 1 }),
    });

    const { result } = renderHook(() =>
      useGitHubSearch({ query: "react", sort: "best-match", language: "", page: 1 })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('set error "rate limit" saat respons 403', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 403 });
    const { result } = renderHook(() =>
      useGitHubSearch({ query: "react", sort: "best-match", language: "", page: 1 })
    );
    await waitFor(() => expect(result.current.error).toMatch(/rate limit/i));
  });

  it('set error "invalid query" saat respons 422', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 422 });
    const { result } = renderHook(() =>
      useGitHubSearch({ query: "react", sort: "best-match", language: "", page: 1 })
    );
    await waitFor(() => expect(result.current.error).toMatch(/invalid/i));
  });

  it("membatasi total ke maksimal 1000 sesuai limit GitHub API", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [], total_count: 5000 }),
    });
    const { result } = renderHook(() =>
      useGitHubSearch({ query: "react", sort: "best-match", language: "", page: 1 })
    );
    await waitFor(() => expect(result.current.total).toBe(1000));
  });

  it("menyertakan filter language di query string saat language di-set", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ items: [], total_count: 0 }),
    });
    renderHook(() =>
      useGitHubSearch({ query: "react", sort: "best-match", language: "TypeScript", page: 1 })
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const calledUrl = (fetch as any).mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain("language:TypeScript");
  });

  it("mengabaikan hasil fetch lama jika params berubah sebelum response datang (race condition)", async () => {
    let resolveFirst: (v: any) => void;
    (fetch as any)
      .mockImplementationOnce(() => new Promise((res) => (resolveFirst = res)))
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ items: [{ id: 2, name: "second" }], total_count: 1 }),
      });

    const { result, rerender } = renderHook(
      ({ query }) => useGitHubSearch({ query, sort: "best-match", language: "", page: 1 }),
      { initialProps: { query: "first" } }
    );

    rerender({ query: "second" });
    await waitFor(() => expect(result.current.items[0]?.id).toBe(2));

    // resolve fetch pertama SETELAH yang kedua selesai — hasil seharusnya tetap "second"
    resolveFirst!({ ok: true, status: 200, json: async () => ({ items: [{ id: 1, name: "first" }], total_count: 1 }) });
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.items[0]?.id).toBe(2); // tidak ter-overwrite oleh request lama
  });
});