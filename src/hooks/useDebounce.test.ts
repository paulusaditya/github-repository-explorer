import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  it("tidak update value sebelum delay selesai", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "a" },
    });
    rerender({ value: "ab" });
    expect(result.current).toBe("a"); // belum berubah
    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("ab");
    vi.useRealTimers();
  });

  it("reset timer jika value berubah lagi sebelum delay selesai", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "a" },
    });
    rerender({ value: "ab" });
    act(() => vi.advanceTimersByTime(300));
    rerender({ value: "abc" }); // ganti lagi sebelum 500ms
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("a"); // masih "a" karena timer reset
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("abc");
    vi.useRealTimers();
  });
});