"use server";

import { revalidatePath } from "next/cache";
import { exigerEquipe } from "@/lib/autorisations";
import { prisma } from "@/lib/db";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

const propresTags = (valeurs: string[]) =>
  [
    ...new Set(
      valeurs
        .map((v) => String(v).trim().replace(/\s+/g, " ").slice(0, 60))
        .filter(Boolean),
    ),
  ].slice(0, 20);

// Tags d'une entreprise : repères internes, réservés à l'équipe
export async function majTagsEntreprise(memberId: string, valeurs: string[]) {
  await exigerEquipe();
  const m = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true },
  });
  if (!m) return { ok: false as const, erreur: "Entreprise introuvable." };
  const propres = propresTags(valeurs);
  await prisma.member.update({
    where: { id: memberId },
    data: { etiquettes: propres },
  });
  for (const nom of propres)
    await prisma.tag.upsert({ where: { nom }, create: { nom }, update: {} });
  revalidatePath("/admin", "layout");
  return { ok: true as const, valeurs: propres };
}

/* ===== Page Tags (équipe) : renommer, supprimer, poser sur plusieurs entreprises ===== */
const propreEtiquette = (v: string) =>
  v.trim().replace(/\s+/g, " ").slice(0, 60);
const pluriel = (n: number) => `${n} entreprise${n > 1 ? "s" : ""}`;
const garderTag = (nom: string) =>
  prisma.tag.upsert({ where: { nom }, create: { nom }, update: {} });

// « Créer » dans le choix des tags (événement, contacts) : le tag rejoint tout de suite la liste des tags
export async function enregistrerTag(
  nom: string,
): Promise<{ nom: string } | { erreur: string }> {
  await exigerEquipe();
  const propre = propreEtiquette(nom);
  if (!propre) return { erreur: "Nom de tag vide." };
  await garderTag(propre);
  revalidatePath("/admin/etiquettes");
  return { nom: propre };
}

// Créer un tag : son nom suffit, les entreprises s'ajoutent ensuite depuis sa page
export async function creerTag(formData: FormData) {
  await exigerEquipe();
  const nom = propreEtiquette(texte(formData, "nom"));
  if (!nom) redirectWithErreur("/admin/etiquettes", "Indiquez le nom du tag.");
  await garderTag(nom);
  revalidatePath("/admin/etiquettes");
  redirectWithFlash(
    `/admin/etiquettes?e=${encodeURIComponent(nom)}`,
    `Tag « ${nom} » créé`,
  );
}

export async function renommerEtiquette(formData: FormData) {
  await exigerEquipe();
  const ancien = texte(formData, "ancien"),
    nouveau = propreEtiquette(texte(formData, "nouveau"));
  if (!ancien || !nouveau)
    redirectWithErreur("/admin/etiquettes", "Indiquez le nouveau nom.");
  if (ancien !== nouveau) {
    await prisma.tag.deleteMany({ where: { nom: ancien } });
    await garderTag(nouveau);
  }
  const ms = await prisma.member.findMany({
    where: { etiquettes: { has: ancien } },
    select: { id: true, etiquettes: true },
  });
  for (const m of ms) {
    await prisma.member.update({
      where: { id: m.id },
      data: {
        etiquettes: [
          ...new Set(m.etiquettes.map((e) => (e === ancien ? nouveau : e))),
        ],
      },
    });
  }
  // Les événements qui rattachent ce tag à leurs inscrits suivent le nouveau nom
  const evs = await prisma.event.findMany({
    where: { etiquettes: { has: ancien } },
    select: { id: true, etiquettes: true },
  });
  for (const e of evs) {
    await prisma.event.update({
      where: { id: e.id },
      data: {
        etiquettes: [
          ...new Set(e.etiquettes.map((x) => (x === ancien ? nouveau : x))),
        ],
      },
    });
  }
  revalidatePath("/admin", "layout");
  redirectWithFlash(
    `/admin/etiquettes?e=${encodeURIComponent(nouveau)}`,
    `« ${ancien} » renommé en « ${nouveau} »`,
  );
}

export async function supprimerEtiquette(formData: FormData) {
  await exigerEquipe();
  const nom = texte(formData, "nom");
  await prisma.tag.deleteMany({ where: { nom } });
  const ms = await prisma.member.findMany({
    where: { etiquettes: { has: nom } },
    select: { id: true, etiquettes: true },
  });
  for (const m of ms)
    await prisma.member.update({
      where: { id: m.id },
      data: { etiquettes: m.etiquettes.filter((e) => e !== nom) },
    });
  // Un tag supprimé n'est plus rattaché aux inscrits des événements (sinon il reviendrait à la prochaine inscription)
  const evs = await prisma.event.findMany({
    where: { etiquettes: { has: nom } },
    select: { id: true, etiquettes: true },
  });
  for (const e of evs)
    await prisma.event.update({
      where: { id: e.id },
      data: { etiquettes: e.etiquettes.filter((x) => x !== nom) },
    });
  revalidatePath("/admin", "layout");
  redirectWithFlash(
    "/admin/etiquettes",
    `Tag « ${nom} » retiré de ${pluriel(ms.length)}`,
  );
}

export async function attribuerEtiquette(formData: FormData) {
  await exigerEquipe();
  const nom = propreEtiquette(texte(formData, "nom"));
  const ids = formData.getAll("entreprises").map(String).filter(Boolean);
  if (!nom || !ids.length)
    redirectWithErreur(
      nom
        ? `/admin/etiquettes?e=${encodeURIComponent(nom)}`
        : "/admin/etiquettes",
      "Choisissez au moins une entreprise.",
    );
  await garderTag(nom);
  const ms = await prisma.member.findMany({
    where: { id: { in: ids } },
    select: { id: true, etiquettes: true },
  });
  for (const m of ms)
    if (!m.etiquettes.includes(nom))
      await prisma.member.update({
        where: { id: m.id },
        data: { etiquettes: [...m.etiquettes, nom] },
      });
  revalidatePath("/admin", "layout");
  // Depuis la page Contacts : on y revient, avec les mêmes filtres
  const retour = texte(formData, "retour");
  const destination = retour.startsWith("/admin/contacts")
    ? retour
    : `/admin/etiquettes?e=${encodeURIComponent(nom)}`;
  redirectWithFlash(destination, `« ${nom} » ajouté à ${pluriel(ms.length)}`);
}

export async function retirerEtiquetteEntreprise(formData: FormData) {
  await exigerEquipe();
  const nom = texte(formData, "nom"),
    id = texte(formData, "memberId");
  const m = await prisma.member.findUnique({
    where: { id },
    select: { etiquettes: true },
  });
  if (m)
    await prisma.member.update({
      where: { id },
      data: { etiquettes: m.etiquettes.filter((e) => e !== nom) },
    });
  revalidatePath("/admin", "layout");
  redirectWithFlash(
    `/admin/etiquettes?e=${encodeURIComponent(nom)}`,
    "Tag retiré",
  );
}
