/**
 * Diffuse sur la page publique les actualités du jeu de démonstration.
 *
 *   npm run actualites:demo
 *
 * Le jeu de données les annonce publiques depuis toujours, et le seed écrit
 * bien cette colonne. Mais une base chargée avant l'arrivée de la diffusion
 * publique a gardé ses lignes privées, faute de colonne à remplir : la
 * vitrine reste alors vide alors que les articles existent.
 *
 * Le script ne touche qu'aux identifiants du jeu de démonstration, et rien
 * qu'à ceux restés privés : une actualité volontairement réservée aux membres
 * depuis le back-office n'est pas republiée par mégarde.
 */
import { prisma } from "../lib/db";
import { NEWS } from "../prisma/fixtures/news";

async function main() {
  const publiques = NEWS.filter((n) => n.public).map((n) => n.id);

  const aPublier = await prisma.news.findMany({
    where: { id: { in: publiques }, public: false },
    select: { id: true, titre: true },
  });

  if (!aPublier.length) {
    const deja = await prisma.news.count({ where: { public: true } });
    console.log(
      `  Rien à faire : ${deja} actualité${deja > 1 ? "s" : ""} déjà publiée${deja > 1 ? "s" : ""}.`,
    );
  } else {
    const { count } = await prisma.news.updateMany({
      where: { id: { in: aPublier.map((n) => n.id) } },
      data: { public: true },
    });
    console.log(`  ${count} actualités diffusées sur la page publique :`);
    for (const n of aPublier) console.log(`    · ${n.titre}`);
  }

  await prisma.$disconnect();
}

main();
