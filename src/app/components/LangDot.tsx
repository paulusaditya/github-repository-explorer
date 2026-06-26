import { LANG_COLORS } from "@/lib/constants";

export function LangDot({ lang }: { lang: string }) {
  const color = LANG_COLORS[lang] || "#8b949e";
  return (
    <span
      className="inline-block w-3 h-3 rounded-full shrink-0"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}