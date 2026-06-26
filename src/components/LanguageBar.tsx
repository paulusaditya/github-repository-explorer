import { LANG_COLORS } from "@/lib/constants";
import { LangDot } from "@/components/LangDot";

export function LanguageBar({ langs }: { langs: Record<string, number> }) {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden gap-px mb-2">
        {sorted.map(([lang, bytes]) => (
          <div
            key={lang}
            style={{
              width: `${(bytes / total) * 100}%`,
              backgroundColor: LANG_COLORS[lang] || "#8b949e",
            }}
            title={`${lang}: ${((bytes / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {sorted.map(([lang, bytes]) => (
          <span key={lang} className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <LangDot lang={lang} />
            {lang}
            <span className="text-muted-foreground/70">
              {((bytes / total) * 100).toFixed(1)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}