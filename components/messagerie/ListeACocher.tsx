"use client";

import { useMemo, useState } from "react";
import { Check, Search, Users, X } from "lucide-react";
import { Pastille, normaliser } from "./outils";

export interface ElementACocher {
  /** Valeur envoyée par le formulaire. */
  valeur: string;
  nom: string;
  detail: string;
  avatar: string | null;
  init: string;
  groupe?: boolean;
}

/**
 * Liste à cocher avec recherche : les personnes d'un nouveau groupe, les
 * conversations vers lesquelles transférer un message.
 *
 * Les éléments choisis restent affichés en étiquettes au-dessus de la liste :
 * une recherche qui les masque ne doit pas faire oublier qu'ils sont cochés.
 * Ce sont des champs cachés qui partent avec le formulaire, pas les cases —
 * une case filtrée par la recherche sortirait du DOM et de l'envoi.
 */
export function ListeACocher({
  name,
  sections,
  max,
  onCompte,
  placeholder = "Rechercher…",
}: {
  name: string;
  sections: { titre?: string; elements: ElementACocher[] }[];
  max?: number;
  onCompte?: (n: number) => void;
  placeholder?: string;
}) {
  const [saisie, setSaisie] = useState("");
  const [choisis, setChoisis] = useState<string[]>([]);
  const terme = normaliser(saisie.trim());

  const tous = useMemo(() => sections.flatMap((s) => s.elements), [sections]);
  const plein = max !== undefined && choisis.length >= max;

  const basculer = (valeur: string) => {
    const suivants = choisis.includes(valeur)
      ? choisis.filter((v) => v !== valeur)
      : plein
        ? choisis
        : [...choisis, valeur];
    setChoisis(suivants);
    onCompte?.(suivants.length);
  };

  const filtrees = sections
    .map((s) => ({
      ...s,
      elements: terme
        ? s.elements.filter((e) =>
            normaliser(`${e.nom} ${e.detail}`).includes(terme),
          )
        : s.elements,
    }))
    .filter((s) => s.elements.length > 0);

  return (
    <div>
      {choisis.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}

      {choisis.length ? (
        <ul className="list-none m-0 p-0 mb-2.5 flex flex-wrap gap-1.5">
          {choisis.map((v) => {
            const e = tous.find((x) => x.valeur === v);
            if (!e) return null;
            return (
              <li
                key={v}
                className="flex items-center gap-1.5 rounded-full bg-accent-soft text-accent-strong pl-1 pr-1 py-0.5 text-[12px] font-semibold"
              >
                <Pastille
                  src={e.avatar}
                  alt={e.nom}
                  initiales={e.init}
                  taille={20}
                  className="bg-white text-accent-strong"
                />
                <span className="max-w-[160px] truncate">{e.nom}</span>
                <button
                  type="button"
                  onClick={() => basculer(v)}
                  aria-label={`Retirer ${e.nom}`}
                  className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer bg-transparent border-0 text-accent-strong hover:bg-white/70"
                >
                  <X size={12} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
        />
        <input
          type="search"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          // Entrée dans la recherche ne doit pas envoyer le formulaire.
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          className="w-full rounded-[var(--radius-s)] border border-line bg-surface-2 text-ink pl-8 pr-2.5 py-2 text-[13px] outline-none focus:border-accent focus:bg-surface"
        />
      </div>

      {max !== undefined ? (
        <p
          className={`m-0 mt-1.5 text-[11.4px] ${plein ? "text-bad" : "text-faint"}`}
          aria-live="polite"
        >
          {choisis.length} sélectionné{choisis.length > 1 ? "s" : ""} sur {max}{" "}
          au plus
        </p>
      ) : null}

      <div className="mt-2 max-h-[300px] overflow-y-auto rounded-[var(--radius-s)] border border-line">
        {filtrees.length === 0 ? (
          <p className="m-0 px-3 py-5 text-center text-[12.8px] text-faint">
            {tous.length
              ? `Aucun résultat pour « ${saisie.trim()} ».`
              : "Personne à ajouter."}
          </p>
        ) : null}
        {filtrees.map((s, i) => (
          <div key={s.titre ?? i}>
            {s.titre ? (
              <div className="sticky top-0 z-[1] bg-surface-2 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint border-b border-line">
                {s.titre}
              </div>
            ) : null}
            {s.elements.map((e) => {
              const coche = choisis.includes(e.valeur);
              const bloque = !coche && plein;
              return (
                <button
                  key={e.valeur}
                  type="button"
                  role="checkbox"
                  aria-checked={coche}
                  disabled={bloque}
                  onClick={() => basculer(e.valeur)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left border-0 border-b border-line last:border-b-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    coche
                      ? "bg-accent-soft/60"
                      : "bg-transparent hover:bg-surface-2"
                  }`}
                >
                  <Pastille
                    src={e.avatar}
                    alt={e.nom}
                    initiales={e.init}
                    taille={32}
                    className={
                      e.groupe
                        ? "bg-navy-soft text-navy"
                        : "bg-accent-soft text-accent-strong"
                    }
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold text-[13px] text-ink">
                      <span className="truncate">{e.nom}</span>
                      {e.groupe ? (
                        <Users size={12} className="text-faint shrink-0" />
                      ) : null}
                    </span>
                    <span className="block text-[11.6px] text-faint truncate">
                      {e.detail}
                    </span>
                  </span>
                  <span
                    className={`w-5 h-5 rounded-[5px] border flex items-center justify-center shrink-0 ${
                      coche
                        ? "bg-accent border-accent text-white"
                        : "border-line bg-surface"
                    }`}
                  >
                    {coche ? <Check size={13} strokeWidth={3} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
