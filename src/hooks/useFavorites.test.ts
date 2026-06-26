import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useFavorites } from "./useFavorites";

const mockRepo = { id: 1, full_name: "facebook/react" } as any;

describe("useFavorites", () => {
  beforeEach(() => localStorage.clear());

  it("mulai dengan favorites kosong jika localStorage kosong", async () => {
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.favorites).toEqual([]);
  });

  it("toggle menambah repo ke favorites dan menyimpan ke localStorage", async () => {
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.toggle(mockRepo));
    expect(result.current.favorites).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem("gh-favorites")!)).toHaveLength(1);
  });

  it("toggle dua kali menghapus repo dari favorites", async () => {
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.toggle(mockRepo));
    act(() => result.current.toggle(mockRepo));
    expect(result.current.favorites).toHaveLength(0);
  });

  it("memuat favorites yang sudah ada dari localStorage saat mount", async () => {
    localStorage.setItem("gh-favorites", JSON.stringify([mockRepo]));
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.isFav(1)).toBe(true);
  });

  it("fallback ke array kosong jika localStorage berisi JSON rusak", async () => {
    localStorage.setItem("gh-favorites", "{invalid json");
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.favorites).toEqual([]);
  });
});