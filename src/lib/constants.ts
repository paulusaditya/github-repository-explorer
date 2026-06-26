import type { SortOption } from "@/types/github";

export const PER_PAGE = 10;

export const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Shell: "#89e051",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Elixir: "#6e4a7e",
  Scala: "#c22d40",
  "C#": "#178600",
  Haskell: "#5e5086",
  Lua: "#000080",
  R: "#276dc3",
  Clojure: "#db5855",
  Zig: "#ec915c",
  Nim: "#ffc200",
  Crystal: "#000100",
};

export const POPULAR_LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C++",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "C#",
  "Shell",
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "best-match", label: "Best Match" },
  { value: "stars", label: "Most Stars" },
  { value: "forks", label: "Most Forks" },
  { value: "updated", label: "Recently Updated" },
];