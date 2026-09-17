/**
 * Dépose l'historique de démonstration dans le journal, sans rien effacer.
 *
 *   npm run journal:demo
 *
 * Pour une base déjà chargée avant l'arrivée du journal au back-office : le
 * seed le fait lui-même, mais le relancer effacerait tout ce qui a été saisi
 * depuis. Le script ne fait rien si le journal contient déjà des opérations.
 */
import { prisma } from "../lib/db";
import { journalDemo } from "../prisma/fixtures/journal";

async function main() {
  const deja = await prisma.auditLog.count({
    where: { action: { not: "seed" } },
  });
  if (deja > 0) {
    console.log(`  Journal déjà rempli (${deja} opérations) : rien à faire.`);
  } else {
    const { count } = await prisma.auditLog.createMany({
      data: journalDemo(new Date()),
    });
    console.log(`  ${count} opérations ajoutées au journal.`);
  }
  await prisma.$disconnect();
}

main();
