import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import {
  LecteurProtege,
  PagesDocument,
  VideoProtegee,
} from "@/components/LecteurProtege";
import { BtnLink, Card, Kicker } from "@/components/ui";
import { verifierAcces } from "@/lib/acces-ressources";
import { prisma } from "@/lib/db";

/**
 * Lecture d'une ressource dans la plateforme.
 *
 * Le contrôle d'accès est fait ici pour l'affichage, et rejoué par chaque
 * route de contenu : la page seule ne protège rien, puisque les pages et la
 * vidéo se chargent par des requêtes séparées.
 */
export default async function LectureRessourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = await prisma.resource.findUnique({
    where: { id },
    select: { titre: true, cat: true, fmt: true, taille: true },
  });
  if (!r) notFound();

  const acces = await verifierAcces(id);
  const video = r.fmt === "video";

  return (
    <>
      <div className="mb-4">
        <BtnLink href="/membre/ressources" variant="ghost" sm>
          <ArrowLeft size={14} /> Retour aux ressources
        </BtnLink>
      </div>

      <div className="mb-5">
        <Kicker>
          {video ? "Vidéo" : "Document"} · {r.taille}
        </Kicker>
        <h1 className="m-0 mt-1.5 text-[26px]">{r.titre}</h1>
      </div>

      {acces.ok ? (
        <LecteurProtege lecteur={acces.lecteur.nom}>
          {video ? (
            <VideoProtegee
              id={id}
              lecteur={acces.lecteur.nom}
              titre={r.titre}
            />
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
    </>
  );
}
