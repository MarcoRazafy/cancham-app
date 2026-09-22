"use client";

import { useEffect, useRef, useState } from "react";
import {
  Ban,
  Check,
  Copy,
  Forward,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { TexteLie } from "@/components/TexteLie";
import { useFormStatus } from "react-dom";
import { FermerApresEnvoi } from "@/components/form-bits";
import { modifierMessage } from "@/lib/actions/messages";
import type { Message, Space } from "@/lib/types";
import { useActionsMessages } from "./ActionsMessages";
import { PiecesJointes } from "./PiecesJointes";

/** Encombrement du menu d'un message, en pixels (`w-[190px]`, quatre entrées). */
const LARGEUR_MENU = 190;
const HAUTEUR_MENU = 170;

/** Lien lisible sur la bulle rouge de l'expéditeur. */
const LIEN_SUR_ROUGE =
  "text-white underline underline-offset-2 decoration-white/60 hover:decoration-white [overflow-wrap:anywhere]";

/**
 * Une bulle de conversation, avec son menu.
 *
 * Tout le monde peut transférer un message ou en copier le texte ; seul son
 * auteur peut le modifier ou le supprimer. Le menu apparaît au survol de la
 * bulle, et reste visible sur les écrans tactiles, qui n'ont pas de survol.
 */
export function Bulle({
  message: m,
  heure,
  groupe,
  nomAuteur,
  equipeADroite = false,
  space,
}: {
  message: Message;
  /** Heure exacte, calculée côté serveur pour éviter un écart de fuseau. */
  heure: string;
  /**
   * Le nom de l'auteur s'affiche au-dessus du texte : dans un groupe, et dans
   * la conversation d'assistance, où plusieurs personnes répondent.
   */
  groupe: boolean;
  /**
   * Nom affiché à la place de celui de l'auteur : le membre voit répondre
   * « Équipe CanCham », pas la personne de permanence.
   */
  nomAuteur?: string;
  /**
   * Dans l'assistance vue par l'équipe, ses messages se rangent à droite,
   * comme ceux de la personne connectée : en face, il n'y a que le membre.
   */
  equipeADroite?: boolean;
  space: Space;
}) {
  const [edition, setEdition] = useState(false);
  /** Position du menu ouvert, dans la fenêtre. */
  const [menu, setMenu] = useState<{
    haut?: number;
    bas?: number;
    gauche: number;
  } | null>(null);
  const [copie, setCopie] = useState(false);
  const zoneMenu = useRef<HTMLDivElement>(null);
  const { transferer, supprimer } = useActionsMessages();

  useEffect(() => {
    if (!menu) return;
    const fermer = (e: Event) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !zoneMenu.current?.contains(e.target as Node)
      )
        setMenu(null);
    };
    // Posé en coordonnées de fenêtre, le menu ne suivrait pas la bulle au
    // défilement : on le referme plutôt que de le laisser flotter ailleurs.
    const refermer = () => setMenu(null);
    document.addEventListener("pointerdown", fermer);
    document.addEventListener("keydown", fermer);
    window.addEventListener("scroll", refermer, true);
    window.addEventListener("resize", refermer);
    return () => {
      document.removeEventListener("pointerdown", fermer);
      document.removeEventListener("keydown", fermer);
      window.removeEventListener("scroll", refermer, true);
      window.removeEventListener("resize", refermer);
    };
  }, [menu]);

  const vise = {
    id: m.id,
    de: m.moi ? "Vous" : m.de,
    apercu:
      m.texte ||
      m.pieces.map((p) => `📎 ${p.nom}`).join("\n") ||
      "Message sans texte",
  };

  const aDroite = m.moi || (equipeADroite && m.equipe);
  const cote = aDroite ? "self-end" : "self-start";

  if (m.supprime) {
    return (
      <div
        id={`msg-${m.id}`}
        className={`${cote} scroll-mt-20 max-w-[72%] px-3 py-2 rounded-[14px] border border-dashed border-line text-[12.8px] italic text-faint flex items-center gap-2`}
      >
        <Ban size={13} className="shrink-0" />
        {m.moi ? "Vous avez supprimé ce message" : "Ce message a été supprimé"}
        <span className="not-italic text-[10.5px] tabular-nums ml-1">
          {heure}
        </span>
      </div>
    );
  }

  const ouvrirMenu = (bouton: HTMLElement) => {
    // En position fixe, calé sur la fenêtre : dans la zone de défilement de la
    // conversation, le menu serait coupé dès qu'elle est basse — sur un
    // téléphone surtout. Il s'ouvre sous le bouton s'il y a la place, sinon
    // au-dessus ; vers la gauche pour un message envoyé, si la place le permet.
    const r = bouton.getBoundingClientRect();
    const place = window.innerHeight - r.bottom >= HAUTEUR_MENU + 8;
    const tientAGauche = r.right - LARGEUR_MENU >= 8;
    const tientADroite = r.left + LARGEUR_MENU <= window.innerWidth - 8;
    const versLaGauche = aDroite
      ? tientAGauche || !tientADroite
      : !tientADroite;
    setMenu({
      ...(place
        ? { haut: r.bottom + 4 }
        : { bas: window.innerHeight - r.top + 4 }),
      gauche: versLaGauche ? r.right - LARGEUR_MENU : r.left,
    });
  };

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(m.texte);
      setCopie(true);
      setTimeout(() => {
        setCopie(false);
        setMenu(null);
      }, 900);
    } catch {
      setMenu(null);
    }
  };

  return (
    <div
      className={`${cote} group/bulle flex items-center gap-1 max-w-[80%] ${
        aDroite ? "flex-row-reverse" : ""
      } ${edition ? "w-[min(460px,80%)]" : ""}`}
    >
      <div
        id={`msg-${m.id}`}
        className={`scroll-mt-20 min-w-0 px-3 py-2 text-[13.3px] leading-relaxed whitespace-pre-line rounded-[14px] ${
          m.moi ? "bg-accent text-white" : "bg-surface-2"
        } ${aDroite ? "rounded-br-[4px]" : "rounded-bl-[4px]"} ${
          m.pieces.length ? "min-w-[220px]" : ""
        } ${edition ? "flex-1" : ""}`}
      >
        {!m.moi && groupe ? (
          <div className="text-[10.6px] font-bold opacity-75 mb-0.5">
            {nomAuteur ?? m.de}
          </div>
        ) : null}
        {m.transfere ? (
          <div
            className={`flex items-center gap-1 text-[10.8px] italic mb-0.5 ${
              m.moi ? "text-white/75" : "text-faint"
            }`}
          >
            <Forward size={11} /> Transféré
          </div>
        ) : null}

        <PiecesJointes pieces={m.pieces} moi={m.moi} space={space} />

        {edition ? (
          <form action={modifierMessage} className="flex flex-col gap-2">
            <FermerApresEnvoi fermer={() => setEdition(false)} />
            <input type="hidden" name="messageId" value={m.id} />
            <input type="hidden" name="space" value={space} />
            <textarea
              name="texte"
              defaultValue={m.texte}
              autoFocus
              rows={2}
              aria-label="Modifier le message"
              ref={ajuster}
              onInput={(e) => ajuster(e.currentTarget)}
              onFocus={(e) => {
                const fin = e.currentTarget.value.length;
                e.currentTarget.setSelectionRange(fin, fin);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEdition(false);
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              className="w-full resize-none rounded-[var(--radius-s)] border border-line bg-surface text-ink px-2.5 py-2 text-[13.3px] leading-[1.45] outline-none focus:border-navy"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setEdition(false)}
                className={`rounded-[var(--radius-s)] px-2.5 py-1 text-[12.2px] font-semibold cursor-pointer border ${
                  m.moi
                    ? "bg-transparent border-white/40 text-white hover:bg-white/10"
                    : "bg-transparent border-line text-ink hover:bg-surface"
                }`}
              >
                Annuler
              </button>
              <BoutonEnregistrer moi={m.moi} />
            </div>
          </form>
        ) : (
          <TexteLie
            texte={m.texte}
            classeLien={m.moi ? LIEN_SUR_ROUGE : undefined}
          />
        )}

        {/* L'heure se loge dans la bulle, alignée à droite : posée dessous,
            elle décalerait l'alignement des messages. */}
        <span
          className={`block text-right text-[10.5px] mt-1 tabular-nums ${
            m.moi ? "text-white/70" : "text-faint"
          }`}
        >
          {m.modifie ? "modifié · " : ""}
          {heure}
        </span>
      </div>

      {edition ? null : (
        <div ref={zoneMenu} className="relative shrink-0">
          <button
            type="button"
            onClick={(e) =>
              menu ? setMenu(null) : ouvrirMenu(e.currentTarget)
            }
            aria-label="Actions sur le message"
            aria-haspopup="menu"
            aria-expanded={Boolean(menu)}
            className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border-0 bg-transparent text-faint hover:bg-surface-2 hover:text-ink focus-visible:opacity-100 transition-opacity [@media(hover:none)]:opacity-100 ${
              menu
                ? "opacity-100 bg-surface-2 text-ink"
                : "opacity-0 group-hover/bulle:opacity-100"
            }`}
          >
            <MoreHorizontal size={16} />
          </button>

          {menu ? (
            <div
              role="menu"
              style={{ top: menu.haut, bottom: menu.bas, left: menu.gauche }}
              className="fixed z-50 w-[190px] rounded-[var(--radius-m)] border border-line bg-surface py-1 shadow-[0_12px_32px_-12px_rgba(15,29,44,0.4)]"
            >
              <EntreeMenu
                icone={<Forward size={14} />}
                onClick={() => {
                  setMenu(null);
                  transferer(vise);
                }}
              >
                Transférer
              </EntreeMenu>
              {m.texte ? (
                <EntreeMenu
                  icone={copie ? <Check size={14} /> : <Copy size={14} />}
                  onClick={copier}
                >
                  {copie ? "Texte copié" : "Copier le texte"}
                </EntreeMenu>
              ) : null}
              {m.moi ? (
                <>
                  <EntreeMenu
                    icone={<Pencil size={14} />}
                    onClick={() => {
                      setMenu(null);
                      setEdition(true);
                    }}
                  >
                    Modifier
                  </EntreeMenu>
                  <div className="my-1 border-t border-line" />
                  <EntreeMenu
                    icone={<Trash2 size={14} />}
                    danger
                    onClick={() => {
                      setMenu(null);
                      supprimer(vise);
                    }}
                  >
                    Supprimer
                  </EntreeMenu>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** La zone d'édition grandit avec le texte, jusqu'à une hauteur raisonnable. */
function ajuster(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight + 2, 220)}px`;
}

/** Blanc sur la bulle rouge, rouge sur la bulle grise : lisible sur les deux. */
function BoutonEnregistrer({ moi }: { moi: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1 rounded-[var(--radius-s)] px-2.5 py-1 text-[12.2px] font-semibold cursor-pointer border disabled:opacity-60 ${
        moi
          ? "bg-white border-white text-accent-strong hover:bg-white/90"
          : "bg-accent border-accent text-white hover:opacity-90"
      }`}
    >
      <Check size={13} /> {pending ? "Enregistrement…" : "Enregistrer"}
    </button>
  );
}

function EntreeMenu({
  icone,
  children,
  onClick,
  danger = false,
}: {
  icone: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] cursor-pointer border-0 bg-transparent ${
        danger ? "text-bad hover:bg-bad-soft" : "text-ink hover:bg-surface-2"
      }`}
    >
      <span className={danger ? "text-bad" : "text-muted"}>{icone}</span>
      {children}
    </button>
  );
}
