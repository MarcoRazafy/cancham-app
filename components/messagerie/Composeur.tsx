"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Image as IconeImage,
  Paperclip,
  Send,
  Smile,
  Video,
  X,
} from "lucide-react";
import { SubmitButton } from "@/components/form-bits";
import { EMOJIS } from "@/components/SelecteurEmojis";
import { sendMessage } from "@/lib/actions/messages";
import type { Space } from "@/lib/types";
import { poids } from "./outils";

/** Mêmes plafonds que le serveur, pour prévenir avant l'envoi plutôt qu'après. */
const PLAFONDS = { image: 8, video: 25, pdf: 10 } as const;
const MAX_PIECES = 5;
const ACCEPTE = "image/*,video/mp4,video/webm,video/quicktime,application/pdf";

function typeDe(f: File): keyof typeof PLAFONDS | null {
  if (f.type.startsWith("image/")) return "image";
  if (["video/mp4", "video/webm", "video/quicktime"].includes(f.type))
    return "video";
  if (f.type === "application/pdf") return "pdf";
  return null;
}

/**
 * Zone de saisie d'un fil : texte, émojis et pièces jointes.
 *
 * Entrée envoie, Maj + Entrée passe à la ligne. Les fichiers choisis
 * s'affichent en étiquettes retirables avant l'envoi ; comme un `FileList`
 * ne se modifie pas, on reconstruit celui du champ caché à chaque retrait.
 *
 * Le composant est remonté après chaque envoi (clé posée par la page) : les
 * étiquettes et le texte repartent à vide.
 */
export function Composeur({
  threadId,
  space,
}: {
  threadId: string;
  space: Space;
}) {
  const formulaire = useRef<HTMLFormElement>(null);
  const zone = useRef<HTMLTextAreaElement>(null);
  const champFichiers = useRef<HTMLInputElement>(null);
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [emojis, setEmojis] = useState(false);
  const [vide, setVide] = useState(true);

  // Le champ caché reflète toujours la liste affichée : c'est lui que le
  // formulaire envoie.
  useEffect(() => {
    if (!champFichiers.current) return;
    const dt = new DataTransfer();
    fichiers.forEach((f) => dt.items.add(f));
    champFichiers.current.files = dt.files;
  }, [fichiers]);

  const ajuster = () => {
    const el = zone.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
    setVide(el.value.trim() === "");
  };

  const choisir = (liste: FileList | null) => {
    if (!liste) return;
    setErreur(null);
    const retenus: File[] = [];
    for (const f of Array.from(liste)) {
      const type = typeDe(f);
      if (!type) {
        setErreur(
          `« ${f.name} » : images, vidéos (MP4, WebM, MOV) et PDF seulement.`,
        );
        continue;
      }
      if (f.size > PLAFONDS[type] * 1024 * 1024) {
        setErreur(`« ${f.name} » dépasse ${PLAFONDS[type]} Mo.`);
        continue;
      }
      retenus.push(f);
    }
    setFichiers((avant) => {
      const tous = [...avant, ...retenus];
      if (tous.length > MAX_PIECES)
        setErreur(`${MAX_PIECES} pièces jointes au plus par message.`);
      return tous.slice(0, MAX_PIECES);
    });
  };

  const insererEmoji = (e: string) => {
    const el = zone.current;
    if (!el) return;
    const debut = el.selectionStart ?? el.value.length;
    const fin = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, debut) + e + el.value.slice(fin);
    const curseur = debut + e.length;
    el.focus();
    el.setSelectionRange(curseur, curseur);
    ajuster();
  };

  const peutEnvoyer = !vide || fichiers.length > 0;

  return (
    <form
      ref={formulaire}
      action={sendMessage}
      className="border-t border-line shrink-0 relative"
    >
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="space" value={space} />
      <input
        ref={champFichiers}
        type="file"
        name="pieces"
        multiple
        accept={ACCEPTE}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          // On lit les fichiers choisis, puis la liste affichée reprend la main.
          choisir(e.target.files);
        }}
      />

      {fichiers.length ? (
        <ul className="list-none m-0 px-3.5 pt-2.5 flex gap-2 flex-wrap">
          {fichiers.map((f, i) => {
            const type = typeDe(f);
            return (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 rounded-[var(--radius-s)] border border-line bg-surface-2 pl-2 pr-1 py-1 max-w-[240px]"
              >
                <span className="text-muted shrink-0">
                  {type === "image" ? (
                    <IconeImage size={14} />
                  ) : type === "video" ? (
                    <Video size={14} />
                  ) : (
                    <FileText size={14} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-ink truncate">
                    {f.name}
                  </span>
                  <span className="block text-[10.5px] text-faint">
                    {poids(f.size)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFichiers((l) => l.filter((_, j) => j !== i))
                  }
                  aria-label={`Retirer ${f.name}`}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-faint cursor-pointer hover:bg-line hover:text-ink shrink-0"
                >
                  <X size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {erreur ? (
        <p className="m-0 px-3.5 pt-2 text-[12px] text-bad">{erreur}</p>
      ) : null}

      {emojis ? (
        <div
          role="dialog"
          aria-label="Émojis"
          className="absolute bottom-full left-3 mb-2 z-20 w-[300px] rounded-[var(--radius-m)] border border-line bg-surface shadow-[0_12px_32px_-12px_rgba(15,29,44,0.4)] p-2 grid grid-cols-8 gap-0.5"
        >
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => insererEmoji(e)}
              aria-label={`Insérer ${e}`}
              className="h-8 rounded-md text-[19px] leading-none cursor-pointer bg-transparent border-0 hover:bg-surface-2"
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-1.5 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setEmojis((o) => !o)}
          aria-expanded={emojis}
          aria-label="Émojis"
          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 border-0 ${
            emojis
              ? "bg-accent-soft text-accent"
              : "bg-transparent text-muted hover:bg-surface-2 hover:text-ink"
          }`}
        >
          <Smile size={19} />
        </button>
        <button
          type="button"
          onClick={() => champFichiers.current?.click()}
          aria-label="Joindre une image, une vidéo ou un PDF"
          title="Image, vidéo ou PDF"
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 border-0 bg-transparent text-muted hover:bg-surface-2 hover:text-ink"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={zone}
          name="texte"
          rows={1}
          autoComplete="off"
          placeholder="Écrire un message…"
          onInput={ajuster}
          onFocus={() => setEmojis(false)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              if (peutEnvoyer) formulaire.current?.requestSubmit();
            }
          }}
          className="flex-1 min-w-0 resize-none rounded-[var(--radius-s)] border border-line bg-surface text-ink px-3 py-2 text-[13.6px] leading-[1.45] outline-none focus:border-accent max-h-[132px]"
        />

        <SubmitButton
          sm
          pendingLabel="…"
          aria-label="Envoyer"
          disabled={!peutEnvoyer}
        >
          <Send size={14} />
        </SubmitButton>
      </div>
    </form>
  );
}
