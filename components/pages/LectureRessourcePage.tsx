import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Lock } from "lucide-react";
import {
  LecteurProtege,
  PagesDocument,
  VideoProtegee,
} from "@/components/LecteurProtege";
import { SubmitButton } from "@/components/form-bits";
import { EtapesDossier } from "@/components/ressources/EtapesDossier";
import { PageRessource } from "@/components/ressources/PageRessource";
import { BtnLink, Card, Kicker } from "@/components/ui";
import { terminerRessource } from "@/lib/actions/content";
import { verifierAcces } from "@/lib/acces-ressources";
import {
  getFilDossier,
  getResources,
  getRessourceLisible,
} from "@/lib/queries";

/**
 * Lecture d'une ressource dans la plateforme, côté membre comme côté équipe.
 *
 * Le contrôle d'accès est fait ici pour l'affichage, et rejoué par chaque
 * route de contenu : la page seule ne protège rien, puisque les pages et la
 * vidéo se chargent par des requêtes séparées.
 *
 * En fin de lecture, le membre dit qu'il a terminé : c'est ce qui coche
 * l'étape dans son dossier et avance sa progression.
 *
 * Rangée dans un dossier, la ressource se lit à côté des étapes de ce
 * dossier : on sait où l'on en est, et l'on passe à la suivante sans
 * repasser par le dossier. La page tient alors en deux colonnes, centrées ;
 * seule, la ressource occupe une colonne de lecture, titre aligné sur elle.
 */
export async function LectureRessourcePage({
  space,
  params,
}: {
  space: "membre" | "admin";
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Introuvable aussi pour qui n'a pas à la voir : une ressource rangée
  // dans un dossier réservé n'a pas de page pour les autres.
  const r = await getRessourceLisible(id);
  if (!r) notFound();

  const acces = await verifierAcces(id);
  const video = r.fmt === "video";
  // Une page composée dans la plateforme : des blocs, pas un fichier.
  const page = r.fmt === "page";
  // On revient au dossier qui range la ressource, pas à la racine.
  const retour = `/${space}/ressources${r.dossierId ? `?dossier=${r.dossierId}` : ""}`;

  // Les étapes du dossier qui la range, dans l'ordre que l'équipe a donné.
  const [fil, etapes] = r.dossierId
    ? await Promise.all([
        getFilDossier(r.dossierId),
        getResources(undefined, r.dossierId),
      ])
    : [null, []];
  const dossier = fil?.[fil.length - 1] ?? null;
  const rang = etapes.findIndex((e) => e.id === id);
  const precedente = rang > 0 ? etapes[rang - 1] : null;
  const suivante =
    rang >= 0 && rang < etapes.length - 1 ? etapes[rang + 1] : null;
  // Une seule ressource dans le dossier : pas de parcours à montrer.
  const parcours = dossier && rang >= 0 && etapes.length > 1 ? dossier : null;

  return (
    <div className={`mx-auto ${parcours ? "max-w-[1260px]" : "max-w-[900px]"}`}>
      <div className="mb-4">
        <BtnLink href={retour} variant="ghost" sm>
          <ArrowLeft size={14} />{" "}
          {r.dossierId ? "Retour au dossier" : "Retour aux ressources"}
        </BtnLink>
      </div>

      <div
        className={
          parcours
            ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_330px]"
            : ""
        }
      >
        <div className="min-w-0">
          <div className="mb-5">
            <Kicker>
              {page
                ? "Page"
                : video
                  ? "Vidéo"
                  : r.fmt === "image"
                    ? "Photo"
                    : "Document"}{" "}
              · {r.taille}
            </Kicker>
            <h1 className="m-0 mt-1.5 text-[26px]">{r.titre}</h1>
            {r.description ? (
              <p className="m-0 mt-2 max-w-[70ch] text-[14px] leading-relaxed text-muted whitespace-pre-line">
                {r.description}
              </p>
            ) : null}
          </div>

          {acces.ok ? (
            <LecteurProtege>
              {page ? (
                // Une page composée se lit sous la même protection qu'un
                // document : son texte ne se sélectionne pas, ne se copie pas.
                <PageRessource id={id} titre={r.titre} blocs={r.blocs} />
              ) : video ? (
                <VideoProtegee id={id} titre={r.titre} />
              ) : (
                <PagesDocument
                  id={id}
                  pages={acces.ressource.pages ?? 0}
                  titre={r.titre}
                />
              )}
            </LecteurProtege>
          ) : (
            <Card className="p-8 text-center max-w-[520px] mx-auto">
              <Lock size={28} className="mx-auto text-faint" />
              <p className="m-0 mt-3 text-[15px] font-semibold">
                {acces.message}
              </p>
              <p className="m-0 mt-1.5 text-[13px] text-muted">
                Contactez l’équipe CanCham pour toute question sur l’accès à
                cette ressource.
              </p>
            </Card>
          )}

          {/* ---------- Fin de la ressource ---------- */}
          {acces.ok && space === "membre" ? (
            <Card className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-5">
              {r.terminee ? (
                <>
                  <span className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-success-strong">
                    <CheckCircle2 size={20} /> Étape terminée
                  </span>
                  <BtnLink href={retour} variant="line" sm>
                    {r.dossierId
                      ? "Retour au dossier"
                      : "Retour aux ressources"}
                  </BtnLink>
                </>
              ) : (
                <>
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-semibold text-ink">
                      Vous êtes arrivé au bout ?
                    </div>
                    <p className="m-0 mt-0.5 text-[13px] text-muted">
                      Terminez cette étape : elle sera cochée dans votre
                      progression.
                    </p>
                  </div>
                  <form action={terminerRessource}>
                    <input type="hidden" name="resourceId" value={id} />
                    <SubmitButton pendingLabel="Un instant…">
                      <Check size={15} /> Terminer
                    </SubmitButton>
                  </form>
                </>
              )}
            </Card>
          ) : null}

          {/* ---------- D'une étape à l'autre ---------- */}
          {parcours && (precedente || suivante) ? (
            <nav
              aria-label="Étapes voisines"
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              {precedente ? (
                <Link
                  href={`/${space}/ressources/${precedente.id}`}
                  className="rounded-[var(--radius-m)] border border-line bg-surface px-4 py-3 no-underline hover:border-accent"
                >
                  <span className="flex items-center gap-1.5 text-[11.8px] font-semibold text-faint">
                    <ArrowLeft size={13} /> Étape précédente
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-[13.8px] font-semibold text-ink">
                    {precedente.titre}
                  </span>
                </Link>
              ) : null}
              {suivante ? (
                <Link
                  href={`/${space}/ressources/${suivante.id}`}
                  className="rounded-[var(--radius-m)] border border-line bg-surface px-4 py-3 text-right no-underline hover:border-accent sm:col-start-2"
                >
                  <span className="flex items-center justify-end gap-1.5 text-[11.8px] font-semibold text-faint">
                    Étape suivante <ArrowRight size={13} />
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-[13.8px] font-semibold text-ink">
                    {suivante.titre}
                  </span>
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>

        {parcours ? (
          <aside className="xl:sticky xl:top-[88px]">
            <EtapesDossier
              space={space}
              dossier={parcours}
              etapes={etapes}
              courante={id}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
