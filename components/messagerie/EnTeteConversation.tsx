"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  ExternalLink,
  FileText,
  Globe,
  Image as IconeImage,
  Info,
  Mail,
  Phone,
  Search,
  Video,
  X,
} from "lucide-react";
import { initialesDe } from "@/lib/avatars";
import { affichageSite } from "@/lib/liens";
import type { Personne, Space } from "@/lib/types";
import { AjouterParticipants, QuitterGroupe } from "./Groupe";
import type { ElementACocher } from "./ListeACocher";
import { Pastille, normaliser, poids, urlPiece } from "./outils";

export interface MessageRecherche {
  id: string;
  de: string;
  texte: string;
  heure: string;
  pieces: {
    id: string;
    nom: string;
    type: "image" | "video" | "pdf";
    taille: number;
  }[];
}

export interface InfoConversation {
  type: "individuel" | "groupe";
  /** Personne en face, pour un échange individuel avec un membre. */
  contact: {
    nom: string;
    fonction: string;
    email: string;
    tel: string | null;
    photo: string | null;
  } | null;
  /** Entreprise en face, et où la trouver dans l'annuaire. */
  entreprise: {
    nom: string;
    lienProfil: string;
    siteweb: string | null;
  } | null;
  /** Coordonnées de la chambre, quand on parle à l'équipe CanCham. */
  equipe: { telephone: string; email: string } | null;
}

/**
 * En-tête d'une conversation et son panneau d'information.
 *
 * Un clic sur le portrait ou le nom mène au profil de l'entreprise. Le bouton
 * « i » ouvre un panneau : la personne, son entreprise, ses coordonnées — ou,
 * pour un groupe, ses participants —, la recherche dans la conversation et les
 * fichiers échangés.
 *
 * Le parent doit être positionné (`relative`) : le panneau vient se poser sur
 * la droite de la conversation.
 */
export function EnTeteConversation({
  threadId,
  space,
  moiId,
  nom,
  sousTitre,
  avatar,
  init,
  info,
  participants,
  ajoutables,
  messages,
}: {
  threadId: string;
  space: Space;
  moiId: string;
  nom: string;
  sousTitre: string;
  avatar: string | null;
  init: string;
  info: InfoConversation;
  participants: Personne[];
  /** Personnes qu'on peut encore ajouter, pour un groupe. */
  ajoutables: ElementACocher[];
  messages: MessageRecherche[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");
  const terme = normaliser(saisie.trim());
  const lienProfil = info.entreprise?.lienProfil ?? null;

  const trouves = useMemo(
    () =>
      terme
        ? messages.filter((m) =>
            normaliser(
              `${m.texte} ${m.de} ${m.pieces.map((p) => p.nom).join(" ")}`,
            ).includes(terme),
          )
        : [],
    [messages, terme],
  );

  const fichiers = useMemo(
    () =>
      messages
        .flatMap((m) => m.pieces.map((p) => ({ ...p, heure: m.heure })))
        .reverse(),
    [messages],
  );

  /** Amène un message à l'écran et le fait briller un instant. */
  const allerA = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("message-repere");
    setTimeout(() => el.classList.remove("message-repere"), 1800);
    // Sur un petit écran, le panneau couvre la conversation : on le referme.
    if (window.matchMedia("(max-width: 767px)").matches) setOuvert(false);
  };

  const identite = (
    <>
      <Pastille
        src={avatar}
        alt={nom}
        initiales={init}
        taille={36}
        className={
          info.type === "groupe"
            ? "bg-navy-soft text-navy"
            : "bg-accent-soft text-accent-strong"
        }
      />
      <span className="min-w-0">
        <span className="block font-semibold text-[13.8px] text-ink truncate">
          {nom}
        </span>
        <span className="block text-[11.4px] text-faint truncate">
          {sousTitre}
        </span>
      </span>
    </>
  );

  return (
    <>
      <div className="px-[18px] py-3 border-b border-line flex items-center gap-2.5 shrink-0">
        {lienProfil ? (
          <Link
            href={lienProfil}
            title="Voir le profil"
            className="flex items-center gap-2.5 min-w-0 no-underline rounded-[var(--radius-s)] -m-1.5 p-1.5 hover:bg-surface-2"
          >
            {identite}
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">{identite}</div>
        )}

        <span className="flex-1" />

        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          aria-label="Informations sur la conversation"
          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border transition-colors shrink-0 ${
            ouvert
              ? "bg-accent text-white border-accent"
              : "bg-transparent text-muted border-line hover:text-ink hover:border-faint"
          }`}
        >
          <Info size={17} />
        </button>
      </div>

      {ouvert ? (
        <aside
          aria-label="Informations"
          className="absolute inset-y-0 right-0 z-20 w-full md:w-[340px] bg-surface border-l border-line shadow-[-12px_0_32px_-24px_rgba(15,29,44,0.45)] flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
            <span className="font-semibold text-[14px]">Informations</span>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              aria-label="Fermer"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted cursor-pointer hover:bg-surface-2 hover:text-ink"
            >
              <X size={17} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 px-4 py-4 flex flex-col gap-5">
            {/* ---------- Identité ---------- */}
            <div className="flex flex-col items-center text-center">
              <Pastille
                src={info.contact?.photo ?? avatar}
                alt={info.contact?.nom ?? nom}
                initiales={init}
                taille={72}
                className={
                  info.type === "groupe"
                    ? "bg-navy-soft text-navy"
                    : "bg-accent-soft text-accent-strong"
                }
              />
              <div className="mt-2.5 font-semibold text-[16px]">
                {info.contact?.nom ?? nom}
              </div>
              <div className="text-[12.6px] text-muted">
                {info.contact?.fonction ?? sousTitre}
              </div>
            </div>

            {/* ---------- Coordonnées ---------- */}
            {info.entreprise || info.contact || info.equipe ? (
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5 text-[13px]">
                {info.entreprise ? (
                  <Ligne icone={<Building2 size={15} />} libelle="Entreprise">
                    <Link
                      href={info.entreprise.lienProfil}
                      className="text-accent font-semibold no-underline hover:underline"
                    >
                      {info.entreprise.nom}
                    </Link>
                  </Ligne>
                ) : null}
                {info.contact?.tel || info.equipe?.telephone ? (
                  <Ligne icone={<Phone size={15} />} libelle="Contact">
                    <a
                      href={`tel:${(info.contact?.tel ?? info.equipe!.telephone).replace(/\s/g, "")}`}
                      className="text-ink no-underline hover:underline tabular-nums"
                    >
                      {info.contact?.tel ?? info.equipe!.telephone}
                    </a>
                  </Ligne>
                ) : null}
                {info.contact?.email || info.equipe?.email ? (
                  <Ligne icone={<Mail size={15} />} libelle="E-mail">
                    <a
                      href={`mailto:${info.contact?.email ?? info.equipe!.email}`}
                      className="text-ink no-underline hover:underline break-all"
                    >
                      {info.contact?.email ?? info.equipe!.email}
                    </a>
                  </Ligne>
                ) : null}
                {info.entreprise?.siteweb ? (
                  <Ligne icone={<Globe size={15} />} libelle="Site web">
                    <a
                      href={info.entreprise.siteweb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink no-underline hover:underline break-all"
                    >
                      {affichageSite(info.entreprise.siteweb)}
                    </a>
                  </Ligne>
                ) : null}
              </ul>
            ) : null}

            {info.entreprise ? (
              <Link
                href={info.entreprise.lienProfil}
                className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-s)] border border-line px-3 py-2 text-[12.8px] font-semibold text-ink no-underline hover:border-faint hover:bg-surface-2"
              >
                Voir le profil <ExternalLink size={13} />
              </Link>
            ) : null}

            {/* ---------- Participants d'un groupe ---------- */}
            {info.type === "groupe" ? (
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint mb-2">
                  Participants ({participants.length})
                </div>
                <ul className="list-none m-0 p-0 flex flex-col gap-2 mb-3">
                  {participants.map((p) => (
                    <li key={p.id} className="flex items-center gap-2.5">
                      <Pastille
                        src={p.photo}
                        alt={p.nom}
                        initiales={initialesDe(p.nom)}
                        taille={32}
                        className="bg-accent-soft text-accent-strong"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-ink truncate">
                          {p.nom}
                          {p.id === moiId ? (
                            <span className="font-normal text-faint">
                              {" "}
                              · vous
                            </span>
                          ) : null}
                        </span>
                        <span className="block text-[11.4px] text-faint truncate">
                          {[p.fonction, p.entreprise]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <AjouterParticipants
                    threadId={threadId}
                    space={space}
                    personnes={ajoutables}
                  />
                  <QuitterGroupe threadId={threadId} nom={nom} space={space} />
                </div>
              </div>
            ) : null}

            {/* ---------- Recherche dans la conversation ---------- */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint mb-2">
                Rechercher dans la conversation
              </div>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
                />
                <input
                  type="search"
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                  placeholder="Un mot, un nom de fichier…"
                  className="w-full rounded-[var(--radius-s)] border border-line bg-surface-2 text-ink pl-8 pr-2.5 py-2 text-[12.8px] outline-none focus:border-accent focus:bg-surface"
                />
              </div>
              {terme ? (
                <div className="mt-2 flex flex-col gap-1">
                  <div className="text-[11.4px] text-faint" aria-live="polite">
                    {trouves.length
                      ? `${trouves.length} message${trouves.length > 1 ? "s" : ""}`
                      : "Aucun message trouvé."}
                  </div>
                  {trouves.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => allerA(m.id)}
                      className="text-left rounded-[var(--radius-s)] px-2.5 py-2 cursor-pointer bg-transparent border border-transparent hover:bg-surface-2 hover:border-line"
                    >
                      <span className="flex justify-between gap-2 text-[11.4px] text-faint">
                        <span className="font-semibold text-muted truncate">
                          {m.de}
                        </span>
                        <span className="tabular-nums shrink-0">{m.heure}</span>
                      </span>
                      <span className="block text-[12.6px] text-ink line-clamp-2">
                        <Surligne
                          texte={
                            m.texte || m.pieces.map((p) => p.nom).join(", ")
                          }
                          terme={saisie.trim()}
                        />
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* ---------- Fichiers partagés ---------- */}
            {fichiers.length ? (
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint mb-2">
                  Fichiers partagés
                </div>
                <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
                  {fichiers.map((f) => (
                    <li key={f.id}>
                      <a
                        href={urlPiece(f.id, space)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 rounded-[var(--radius-s)] px-2 py-1.5 no-underline hover:bg-surface-2"
                      >
                        <span className="w-8 h-8 rounded-md bg-surface-2 border border-line flex items-center justify-center text-muted shrink-0">
                          {f.type === "image" ? (
                            <IconeImage size={15} />
                          ) : f.type === "video" ? (
                            <Video size={15} />
                          ) : (
                            <FileText size={15} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[12.6px] font-semibold text-ink truncate">
                            {f.nom}
                          </span>
                          <span className="block text-[11px] text-faint">
                            {poids(f.taille)} · {f.heure}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </aside>
      ) : null}
    </>
  );
}

function Ligne({
  icone,
  libelle,
  children,
}: {
  icone: React.ReactNode;
  libelle: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="text-faint mt-0.5 shrink-0">{icone}</span>
      <span className="min-w-0">
        <span className="block text-[10.8px] font-semibold uppercase tracking-[0.06em] text-faint">
          {libelle}
        </span>
        {children}
      </span>
    </li>
  );
}

/** Met en évidence le terme cherché, sans tenir compte des accents. */
function Surligne({ texte, terme }: { texte: string; terme: string }) {
  const t = normaliser(terme);
  const i = t ? normaliser(texte).indexOf(t) : -1;
  if (i < 0) return <>{texte}</>;
  // La normalisation conserve la longueur pour les lettres accentuées usuelles
  // du français : les index du texte normalisé valent pour le texte d'origine.
  return (
    <>
      {texte.slice(0, i)}
      <mark className="bg-accent-soft text-accent-strong rounded px-0.5">
        {texte.slice(i, i + terme.length)}
      </mark>
      {texte.slice(i + terme.length)}
    </>
  );
}
