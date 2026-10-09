"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";

export const EMOJIS = [
  "😀",
  "😊",
  "🙂",
  "😉",
  "😄",
  "😅",
  "🤝",
  "👍",
  "👏",
  "🙏",
  "💪",
  "🎉",
  "✅",
  "❌",
  "⚠️",
  "📌",
  "📎",
  "📄",
  "📅",
  "⏰",
  "📞",
  "✉️",
  "💼",
  "📊",
  "💡",
  "🚀",
  "🌍",
  "🇨🇦",
  "🇲🇬",
  "❤️",
  "😂",
  "🤔",
];

export function insererAuCurseur(
  zone: HTMLTextAreaElement | HTMLInputElement,
  texte: string,
) {
  const debut = zone.selectionStart ?? zone.value.length;
  const fin = zone.selectionEnd ?? zone.value.length;
  zone.value = zone.value.slice(0, debut) + texte + zone.value.slice(fin);
  const curseur = debut + texte.length;
  zone.focus();
  zone.setSelectionRange(curseur, curseur);
  zone.dispatchEvent(new Event("input", { bubbles: true }));
}

export function SelecteurEmojis({
  onChoisir,
  vers = "haut",
}: {
  onChoisir: (emoji: string) => void;
  vers?: "haut" | "bas";
}) {
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: Event) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !zone.current?.contains(e.target as Node)
      )
        setOuvert(false);
    };
    document.addEventListener("pointerdown", fermer);
    document.addEventListener("keydown", fermer);
    return () => {
      document.removeEventListener("pointerdown", fermer);
      document.removeEventListener("keydown", fermer);
    };
  }, [ouvert]);

  return (
    <span ref={zone} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label="Émojis"
        title="Émojis"
        className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-0 ${
          ouvert
            ? "bg-accent-soft text-accent"
            : "bg-transparent text-muted hover:bg-surface-2 hover:text-ink"
        }`}
      >
        <Smile size={19} />
      </button>
      {ouvert ? (
        <span
          role="dialog"
          aria-label="Émojis"
          className={`absolute left-0 z-30 w-[300px] max-w-[80vw] rounded-[var(--radius-m)] border border-line bg-surface shadow-[0_12px_32px_-12px_rgba(15,29,44,0.4)] p-2 grid grid-cols-8 gap-0.5 ${
            vers === "haut" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChoisir(e)}
              aria-label={`Insérer ${e}`}
              className="h-8 rounded-md text-[19px] leading-none cursor-pointer bg-transparent border-0 hover:bg-surface-2"
            >
              {e}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
