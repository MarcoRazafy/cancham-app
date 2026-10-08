import { notFound } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, Lock } from "lucide-react";
import {
  LecteurProtege,
  PagesDocument,
  VideoProtegee,
} from "@/components/LecteurProtege";
import { SubmitButton } from "@/components/form-bits";
import { PageRessource } from "@/components/ressources/PageRessource";
import { BtnLink, Card, Kicker } from "@/components/ui";
import { terminerRessource } from "@/lib/actions/content";
import { verifierAcces } from "@/lib/acces-ressources";
import { getRessourceLisible } from "@/lib/queries";

/**
 * Lecture d'une ressource dans la plateforme, côté membre comme côté équipe.
 *
 * Le contrôle d'accès est fait ici pour l'affichage, et rejoué par chaque
 * route de contenu : la page seule ne protège rien, puisque les pages et la
 * vidéo se chargent par des requêtes séparées.
 *
 * En fin de lecture, le membre dit qu'il a terminé : c'est ce qui coche
 * l'étape dans son dossier et avance sa progression.
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

  return (
    <>
      <div className="mb-4">
        <BtnLink href={retour} variant="ghost" sm>
          <ArrowLeft size={14} />{" "}
          {r.dossierId ? "Retour au dossier" : "Retour aux ressources"}
        </BtnLink>
      </div>

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
          <p className="m-0 mt-3 text-[15px] font-semibold">{acces.message}</p>
          <p className="m-0 mt-1.5 text-[13px] text-muted">
            Contactez l’équipe CanCham pour toute question sur l’accès à cette
            ressource.
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
                {r.dossierId ? "Retour au dossier" : "Retour aux ressources"}
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
    </>
  );
}
