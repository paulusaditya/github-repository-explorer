import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FavoritesPanel } from "./FavoritesPanel";
import type { GitHubRepo } from "@/types/github";

const repo1 = {
  id: 1,
  name: "react",
  full_name: "facebook/react",
  description: "A JS library",
  html_url: "https://github.com/facebook/react",
  stargazers_count: 1000,
  forks_count: 200,
  watchers_count: 1000,
  open_issues_count: 5,
  language: "JavaScript",
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  pushed_at: new Date().toISOString(),
  topics: [],
  owner: { login: "facebook", avatar_url: "", html_url: "", type: "Organization" },
  license: null,
  size: 100,
  default_branch: "main",
  visibility: "public",
  archived: false,
  fork: false,
  homepage: null,
} as GitHubRepo;

const repo2 = { ...repo1, id: 2, name: "vue", full_name: "vuejs/vue" } as GitHubRepo;

describe("FavoritesPanel", () => {
  it("menampilkan pesan kosong jika belum ada favorit", () => {
    render(
      <FavoritesPanel
        favorites={[]}
        isFav={() => false}
        onToggleFav={vi.fn()}
        onSelect={vi.fn()}
        selectedId={null}
        onClose={vi.fn()}
        hydrated={true}
      />
    );
    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
  });

  it("tidak menampilkan badge jumlah favorit sebelum hydrated", () => {
    render(
      <FavoritesPanel
        favorites={[repo1]}
        isFav={() => true}
        onToggleFav={vi.fn()}
        onSelect={vi.fn()}
        selectedId={null}
        onClose={vi.fn()}
        hydrated={false}
      />
    );
    // badge jumlah tidak boleh tampil sebelum hydrated (mencegah flash data localStorage)
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("menampilkan daftar repo favorit dan jumlahnya saat hydrated", () => {
    render(
      <FavoritesPanel
        favorites={[repo1, repo2]}
        isFav={() => true}
        onToggleFav={vi.fn()}
        onSelect={vi.fn()}
        selectedId={null}
        onClose={vi.fn()}
        hydrated={true}
      />
    );
    expect(screen.getByText("facebook/react")).toBeInTheDocument();
    expect(screen.getByText("vuejs/vue")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("memanggil onSelect dengan repo yang benar saat sebuah card diklik", () => {
    const onSelect = vi.fn();
    render(
      <FavoritesPanel
        favorites={[repo1, repo2]}
        isFav={() => true}
        onToggleFav={vi.fn()}
        onSelect={onSelect}
        selectedId={null}
        onClose={vi.fn()}
        hydrated={true}
      />
    );
    fireEvent.click(screen.getByText("vuejs/vue"));
    expect(onSelect).toHaveBeenCalledWith(repo2);
  });

  it("memanggil onToggleFav saat tombol hati pada card favorit diklik", () => {
    const onToggleFav = vi.fn();
    render(
      <FavoritesPanel
        favorites={[repo1]}
        isFav={() => true}
        onToggleFav={onToggleFav}
        onSelect={vi.fn()}
        selectedId={null}
        onClose={vi.fn()}
        hydrated={true}
      />
    );
    fireEvent.click(screen.getByLabelText("Remove from favorites"));
    expect(onToggleFav).toHaveBeenCalledWith(repo1);
  });

  it("menandai card yang sedang dipilih sebagai aria-pressed true", () => {
    render(
      <FavoritesPanel
        favorites={[repo1, repo2]}
        isFav={() => true}
        onToggleFav={vi.fn()}
        onSelect={vi.fn()}
        selectedId={1}
        onClose={vi.fn()}
        hydrated={true}
      />
    );
    expect(screen.getByRole("button", { name: /facebook\/react/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("memanggil onClose saat tombol close diklik", () => {
    const onClose = vi.fn();
    render(
      <FavoritesPanel
        favorites={[]}
        isFav={() => false}
        onToggleFav={vi.fn()}
        onSelect={vi.fn()}
        selectedId={null}
        onClose={onClose}
        hydrated={true}
      />
    );
    fireEvent.click(screen.getByLabelText("Close favorites"));
    expect(onClose).toHaveBeenCalled();
  });
});