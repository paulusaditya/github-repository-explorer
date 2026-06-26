// components/RepoCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RepoCard } from "./RepoCard";

const repo = {
  id: 1, full_name: "facebook/react", description: "A library", html_url: "",
  stargazers_count: 1000, forks_count: 200, watchers_count: 0, open_issues_count: 0,
  language: "JavaScript", updated_at: new Date().toISOString(), created_at: "", pushed_at: "",
  topics: ["ui", "frontend"], owner: { login: "facebook", avatar_url: "", html_url: "", type: "Organization" },
  license: null, size: 100, default_branch: "main", visibility: "public", archived: false, fork: false, homepage: null,
} as any;

describe("RepoCard", () => {
  it("menampilkan nama, deskripsi, dan jumlah stars", () => {
    render(<RepoCard repo={repo} selected={false} isFav={false} onSelect={vi.fn()} onFav={vi.fn()} />);
    expect(screen.getByText("facebook/react")).toBeInTheDocument();
    expect(screen.getByText("A library")).toBeInTheDocument();
    expect(screen.getByText("1.0k")).toBeInTheDocument();
  });

  it("memanggil onSelect saat card diklik", () => {
    const onSelect = vi.fn();
    render(<RepoCard repo={repo} selected={false} isFav={false} onSelect={onSelect} onFav={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /facebook\/react/i }));
    expect(onSelect).toHaveBeenCalled();
  });

  it("memanggil onSelect saat menekan Enter (akses keyboard)", () => {
    const onSelect = vi.fn();
    render(<RepoCard repo={repo} selected={false} isFav={false} onSelect={onSelect} onFav={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /facebook\/react/i }), { key: "Enter" });
    expect(onSelect).toHaveBeenCalled();
  });

  it("tidak memicu onSelect saat tombol favorite diklik (stopPropagation)", () => {
    const onSelect = vi.fn();
    const onFav = vi.fn((e) => e.stopPropagation());
    render(<RepoCard repo={repo} selected={false} isFav={false} onSelect={onSelect} onFav={onFav} />);
    fireEvent.click(screen.getByLabelText("Add to favorites"));
    expect(onFav).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("menampilkan badge archived jika repo di-archive", () => {
    render(<RepoCard repo={{ ...repo, archived: true }} selected={false} isFav={false} onSelect={vi.fn()} onFav={vi.fn()} />);
    expect(screen.getByText("archived")).toBeInTheDocument();
  });
});