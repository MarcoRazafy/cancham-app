import { prisma } from "@/lib/db";
import { servirFichier } from "@/lib/flux";
import { isAccessLocked } from "@/lib/membership";
import { utilisateurConnecte } from "@/lib/session";
import { typeVideo } from "@/lib/video-presentation";
import { cheminVideo } from "@/lib/videos";

/**
 * Lecture d'une vidéo de présentation, par morceaux.
 *
 * L'annuaire est réservé aux adhérents, et sa vidéo avec : il faut être
 * connecté. Un membre dont l'accès est restreint garde son profil, donc sa
 * propre vidéo, mais pas celles des autres. Et seul le fichier posé sur une
 * fiche se lit : une vidéo remplacée ou retirée ne répond plus, même à qui
 * en a gardé l'adresse.
 *
 * Chaque morceau repasse par ces contrôles : le lecteur du navigateur en
 * demande plusieurs, et l'accès peut se fermer entre deux.
 */
const ENTETES = {
  // Le nom d'un fichier ne resert jamais : le navigateur peut le garder,
  // pour ne pas tout retélécharger à la seconde lecture.
  "Cache-Control": "private, max-age=3600",
  "Content-Disposition": "inline",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

/** Quatre mégaoctets par réponse : assez pour ne pas hacher la lecture. */
const MORCEAU = 4 * 1024 * 1024;

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ fichier: string }> },
) {
  const { fichier } = await params;
  const chemin = cheminVideo(fichier);
  if (!chemin) return new Response("Vidéo introuvable.", { status: 404 });

  const user = await utilisateurConnecte();
  if (!user || (user.role !== "admin" && user.role !== "membre")) {
    return new Response("Connexion requise.", { status: 401 });
  }

  const [fiche, moi] = await Promise.all([
    prisma.member.findFirst({
      where: { video: fichier },
      select: { id: true },
    }),
    user.role === "membre" && user.memberId
      ? prisma.member.findUnique({
          where: { id: user.memberId },
          select: { id: true, statut: true, retardDepuis: true },
        })
      : null,
  ]);
  if (!fiche) return new Response("Vidéo introuvable.", { status: 404 });

  if (user.role === "membre") {
    // `isAccessLocked` attend le modèle de vue : la date y est une ISO courte.
    const restreint =
      !moi ||
      isAccessLocked({
        statut: moi.statut,
        retardDepuis: moi.retardDepuis
          ? moi.retardDepuis.toISOString().slice(0, 10)
          : null,
      } as Parameters<typeof isAccessLocked>[0]);
    if (restreint && moi?.id !== fiche.id) {
      return new Response("Accès réservé aux membres à jour de cotisation.", {
        status: 403,
      });
    }
  }

  try {
    return await servirFichier(
      requete,
      chemin,
      { ...ENTETES, "Content-Type": typeVideo(fichier) },
      MORCEAU,
    );
  } catch {
    // La fiche nomme un fichier que le disque n'a plus.
    return new Response("Vidéo introuvable.", { status: 404 });
  }
}
