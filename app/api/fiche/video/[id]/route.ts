import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { utilisateurConnecte } from "@/lib/session";
import {
  abandonnerEnvoi,
  etatEnvoi,
  recevoirMorceau,
  supprimerVideo,
  terminerEnvoi,
} from "@/lib/videos";
import { dIci, refus, reponseDErreur } from "../commun";

type Contexte = { params: Promise<{ id: string }> };

async function quiEnvoie(requete: Request) {
  if (!dIci(requete)) return null;
  const user = await utilisateurConnecte();
  return user && (user.role === "admin" || user.role === "membre")
    ? user
    : null;
}

export async function GET(requete: Request, { params }: Contexte) {
  const user = await quiEnvoie(requete);
  if (!user) return refus("Connexion requise.", 401);
  try {
    return NextResponse.json({
      recu: await etatEnvoi((await params).id, user.id),
    });
  } catch (e) {
    return reponseDErreur(e);
  }
}

export async function PUT(requete: Request, { params }: Contexte) {
  const user = await quiEnvoie(requete);
  if (!user) return refus("Connexion requise.", 401);
  if (!requete.body) return refus("Morceau vide.", 400);

  const position = Number(new URL(requete.url).searchParams.get("position"));
  if (!Number.isSafeInteger(position) || position < 0) {
    return refus("Position illisible.", 400);
  }
  try {
    const recu = await recevoirMorceau(
      (await params).id,
      user.id,
      position,
      requete.body,
    );
    return NextResponse.json({ recu });
  } catch (e) {
    return reponseDErreur(e);
  }
}

export async function POST(requete: Request, { params }: Contexte) {
  const user = await quiEnvoie(requete);
  if (!user) return refus("Connexion requise.", 401);

  let pose: { memberId: string; fichier: string };
  try {
    pose = await terminerEnvoi((await params).id, user.id);
  } catch (e) {
    return reponseDErreur(e);
  }

  const fiche = await prisma.member.findUnique({
    where: { id: pose.memberId },
    select: { id: true, video: true },
  });
  if (!fiche || (user.role === "membre" && user.memberId !== fiche.id)) {
    await supprimerVideo(pose.fichier);
    return refus("Fiche introuvable.", 404);
  }

  await prisma.member.update({
    where: { id: fiche.id },
    data: { video: pose.fichier },
  });
  if (fiche.video && fiche.video !== pose.fichier) {
    await supprimerVideo(fiche.video);
  }
  if (user.role === "admin") {
    await prisma.auditLog.create({
      data: {
        action: "fiche_modifiee",
        entite: "Member",
        entiteId: fiche.id,
        acteur: user.nom,
        detail: fiche.video
          ? "Vidéo de présentation remplacée."
          : "Vidéo de présentation ajoutée.",
      },
    });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ fichier: pose.fichier });
}

export async function DELETE(requete: Request, { params }: Contexte) {
  const user = await quiEnvoie(requete);
  if (!user) return refus("Connexion requise.", 401);
  try {
    await abandonnerEnvoi((await params).id, user.id);
    return new Response(null, { status: 204 });
  } catch (e) {
    return reponseDErreur(e);
  }
}
