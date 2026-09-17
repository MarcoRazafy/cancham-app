"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageSquarePlus, Search, X } from "lucide-react";
import { ouvrirConversation } from "@/lib/actions/messages";
import type { Space } from "@/lib/types";
import { NouveauGroupe } from "./Groupe";
import type { ElementACocher } from "./ListeACocher";
import { Pastille, normaliser } from "./outils";

export interface ResumeFil {
  id: string;
  nom: string;
  sousTitre: string;
  avatar: string | null;
  init: string;
  type: "individuel" | "groupe";
  unread: number;
  heure: string;
  apercu: string;
}

export interface MembreJoignable {
  id: string;
  nom: string;
  secteur: string;
  vignette: string | null;
  /** Personne qui répondra : le contact principal. */
  referent: string | null;
}

/**
 * Liste des conversations, avec recherche de personnes.
 *
 * La recherche porte sur le nom du fil, son sous-titre — l'entreprise, la
 * fonction — et le dernier message. Elle cherche aussi dans l'annuaire : un
 * membre avec qui l'on n'a jamais échangé apparaît sous « Nouvelle
 * conversation », et un clic ouvre le fil sans repasser par sa fiche. Le
 * bouton voisin crée un groupe.
 */
export function ListeFils({
  fils,
  actifId,
  base,
  space,
  membres,
  personnes,
}: {
  fils: ResumeFil[];
  actifId: string;
  base: string;
  space: Space;
  /** Membres sans conversation individuelle en cours. Vide côté back-office. */
  membres: MembreJoignable[];
  /** Personnes qu'on peut réunir dans un groupe. */
  personnes: ElementACocher[];
}) {
  const [saisie, setSaisie] = useState("");
  const terme = normaliser(saisie.trim());

  const filsTrouves = useMemo(
    () =>
      terme
        ? fils.filter((f) =>
            normaliser(`${f.nom} ${f.sousTitre} ${f.apercu}`).includes(terme),
          )
        : fils,
    [fils, terme],
  );

  const membresTrouves = useMemo(
    () =>
      terme
        ? membres.filter((m) =>
            normaliser(`${m.nom} ${m.secteur} ${m.referent ?? ""}`).includes(
              terme,
            ),
          )
        : [],
    [membres, terme],
  );

  return (
    <div className="w-full md:w-[290px] md:shrink-0 border-b md:border-b-0 md:border-r border-line flex flex-col min-h-0 max-h-[40%] md:max-h-none">
      <div className="p-2.5 border-b border-line shrink-0 flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
          />
          <input
            type="search"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher une personne ou une conversation"
            className="w-full rounded-[var(--radius-s)] border border-line bg-surface-2 text-ink pl-9 pr-8 py-2 text-[13px] outline-none focus:border-accent focus:bg-surface"
          />
          {saisie ? (
            <button
              type="button"
              onClick={() => setSaisie("")}
              aria-label="Effacer"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-faint cursor-pointer hover:bg-line hover:text-ink"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
        <NouveauGroupe space={space} personnes={personnes} />
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        {filsTrouves.map((f) => {
          const actif = f.id === actifId;
          return (
            <Link
              key={f.id}
              href={`${base}?t=${f.id}`}
              className={`flex gap-2.5 px-3.5 py-3 border-b border-line no-underline ${
                actif ? "bg-[#14263a] text-white" : "hover:bg-surface-2"
              }`}
            >
              <Pastille
                src={f.avatar}
                alt={f.nom}
                initiales={f.init}
                taille={36}
                className={
                  actif
                    ? "bg-white/15 text-white"
                    : f.type === "groupe"
                      ? "bg-navy-soft text-navy"
                      : "bg-accent-soft text-accent-strong"
                }
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-1.5 items-baseline">
                  <span className="font-semibold text-[13px] truncate">
                    {f.nom}
                  </span>
                  <span
                    className={`text-[10.5px] shrink-0 tabular-nums ${actif ? "text-white/55" : "text-faint"}`}
                  >
                    {f.heure}
                  </span>
                  {f.unread ? (
                    <span className="text-[10.5px] font-bold px-[7px] py-px rounded-full bg-accent text-white shrink-0">
                      {f.unread}
                    </span>
                  ) : null}
                </div>
                <div
                  className={`text-[11.6px] truncate ${actif ? "text-white/60" : "text-faint"}`}
                >
                  {f.apercu}
                </div>
              </div>
            </Link>
          );
        })}

        {terme && filsTrouves.length === 0 && membresTrouves.length === 0 ? (
          <p className="m-0 px-4 py-6 text-[12.8px] text-faint text-center">
            Personne ne correspond à « {saisie.trim()} ».
          </p>
        ) : null}

        {membresTrouves.length ? (
          <div>
            <div className="px-3.5 pt-3.5 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint">
              Nouvelle conversation
            </div>
            {membresTrouves.map((m) => (
              <form key={m.id} action={ouvrirConversation}>
                <input type="hidden" name="memberId" value={m.id} />
                <input type="hidden" name="space" value={space} />
                <button
                  type="submit"
                  className="w-full flex gap-2.5 items-center px-3.5 py-2.5 text-left cursor-pointer bg-transparent border-0 border-b border-line hover:bg-surface-2"
                >
                  <Pastille
                    src={m.vignette}
                    alt={m.nom}
                    initiales={m.nom.slice(0, 2).toUpperCase()}
                    taille={32}
                    className="bg-accent-soft text-accent-strong"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-[12.8px] text-ink truncate">
                      {m.referent ?? m.nom}
                    </span>
                    <span className="block text-[11.4px] text-faint truncate">
                      {m.referent ? `${m.nom} · ` : ""}
                      {m.secteur}
                    </span>
                  </span>
                  <MessageSquarePlus
                    size={15}
                    className="text-accent shrink-0"
                  />
                </button>
              </form>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
