"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Search, X } from "lucide-react";
import type { Question, Theme } from "@/lib/aide";
import { TexteLie } from "@/components/TexteLie";

/**
 * Centre d'aide : recherche, thèmes et questions dépliables.
 *
 * Les questions sont des `<details>` natifs : elles s'ouvrent au clic ou au
 * clavier sans JavaScript. La recherche filtre à la frappe et ignore accents et
 * majuscules — « acces » trouve « accès », sans quoi un membre qui tape vite ne
 * trouverait rien.
 *
 * Une réponse s'atteint par une ancre : `/membre/aide#acces-restreint` ouvre
 * directement la bonne question, pour qu'un lien envoyé par l'équipe mène au
 * bon endroit.
 */
export function CentreAide({ themes }: { themes: Theme[] }) {
  const [saisie, setSaisie] = useState("");
  const [ancre, setAncre] = useState<string | null>(null);

  useEffect(() => {
    const lire = () =>
      setAncre(decodeURIComponent(window.location.hash.slice(1)) || null);
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, []);

  const terme = normaliser(saisie.trim());

  const resultats = useMemo(() => {
    if (!terme) return themes;
    return themes
      .map((t) => ({
        ...t,
        questions: t.questions.filter((q) =>
          normaliser(`${t.titre} ${q.question} ${q.reponse}`).includes(terme),
        ),
      }))
      .filter((t) => t.questions.length > 0);
  }, [themes, terme]);

  const total = resultats.reduce((n, t) => n + t.questions.length, 0);

  return (
    <div>
      {/* ---------- Recherche ---------- */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
        />
        <input
          type="search"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Rechercher : cotisation, service, événement, ressource…"
          aria-label="Rechercher dans l’aide"
          className="w-full rounded-[var(--radius-m)] border border-line bg-surface text-ink pl-11 pr-11 py-3.5 text-[14.5px] outline-none shadow-[var(--shadow)] focus:border-accent"
        />
        {saisie ? (
          <button
            type="button"
            onClick={() => setSaisie("")}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-faint cursor-pointer hover:bg-surface-2 hover:text-ink"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      {/* ---------- Thèmes ---------- */}
      {!terme ? (
        <nav aria-label="Thèmes" className="flex gap-2 flex-wrap mb-6">
          {themes.map((t) => (
            <a
              key={t.id}
              href={`#theme-${t.id}`}
              className="text-[12.8px] font-semibold px-3 py-1.5 rounded-full border border-line bg-surface text-muted no-underline hover:border-accent hover:text-accent"
            >
              {t.titre}
            </a>
          ))}
        </nav>
      ) : (
        <p className="text-[13px] text-muted m-0 mb-5" aria-live="polite">
          {total
            ? `${total} réponse${total > 1 ? "s" : ""} pour « ${saisie.trim()} »`
            : `Aucune réponse pour « ${saisie.trim()} ».`}
        </p>
      )}

      {/* ---------- Questions ---------- */}
      <div className="flex flex-col gap-7">
        {resultats.map((t) => (
          <section key={t.id} id={`theme-${t.id}`} className="scroll-mt-24">
            <h2 className="text-[17px] font-semibold m-0 mb-3">{t.titre}</h2>
            <div className="flex flex-col gap-2">
              {t.questions.map((q) => (
                <Reponse
                  key={q.id}
                  question={q}
                  // Ouverte si elle est visée par l'ancre, ou si l'on cherche :
                  // un résultat de recherche replié obligerait à cliquer partout.
                  ouverte={ancre === q.id || !!terme}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Reponse({
  question,
  ouverte,
}: {
  question: Question;
  ouverte: boolean;
}) {
  return (
    <details
      id={question.id}
      open={ouverte}
      className="group scroll-mt-24 rounded-[var(--radius-m)] border border-line bg-surface open:border-accent/40 open:shadow-[var(--shadow)]"
    >
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-4 py-3.5 text-[14.4px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {question.question}
        <ChevronDown
          size={18}
          className="text-faint shrink-0 transition-transform group-open:rotate-180 group-open:text-accent"
        />
      </summary>

      <div className="px-4 pb-4 -mt-1 text-[13.8px] leading-relaxed text-muted">
        {question.reponse.split("\n\n").map((bloc, i) => {
          const lignes = bloc.split("\n");
          // Un bloc dont toutes les lignes commencent par « · » est une liste.
          if (lignes.every((l) => l.startsWith("· "))) {
            return (
              <ul key={i} className="m-0 mb-3 pl-5 flex flex-col gap-1">
                {lignes.map((l) => (
                  <li key={l}>
                    <TexteLie texte={l.slice(2)} />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className="m-0 mb-3 last:mb-0">
              <TexteLie texte={bloc} />
            </p>
          );
        })}

        {question.liens?.length ? (
          <div className="flex gap-2 flex-wrap mt-3.5">
            {question.liens.map((l) => (
              <Link
                key={l.href + l.libelle}
                href={l.href}
                className="inline-flex items-center gap-1.5 text-[12.8px] font-semibold text-accent no-underline px-3 py-1.5 rounded-[var(--radius-s)] bg-accent-soft hover:underline"
              >
                {l.libelle} <ArrowRight size={13} />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}

/** Minuscules, sans accents : « Accès » et « acces » se valent. */
function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
