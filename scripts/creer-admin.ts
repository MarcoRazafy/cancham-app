/**
 * Crée un compte administrateur — le premier, sur une base neuve.
 *
 *   npm run admin:creer -- --email prenom@cancham.mg --nom "Prénom Nom"
 *
 * En production, la base part vide : pas de données de démonstration, donc
 * personne pour se connecter au back-office et promouvoir les autres. Ce
 * script ouvre la porte ; la suite se fait depuis « Équipe & accès ».
 *
 * Le mot de passe n'est jamais passé en argument — il resterait dans
 * l'historique du terminal. Il est demandé au clavier, sans écho, ou lu dans
 * ADMIN_MOT_DE_PASSE quand aucun terminal n'est là pour le saisir.
 *
 * Sur un compte administrateur qui existe déjà, le script remplace le mot de
 * passe et ferme ses sessions : c'est le recours quand l'accès est perdu et
 * que l'e-mail de réinitialisation ne peut pas arriver. Un compte membre,
 * lui, se promeut depuis le back-office, pas d'ici.
 */
import "dotenv/config";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { prisma } from "../lib/db";
import { hacher, MOT_DE_PASSE_MIN } from "../lib/mots-de-passe";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    nom: { type: "string" },
    fonction: { type: "string", default: "Équipe CanCham" },
  },
});

function arreter(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

/** Saisie au clavier sans écho : le mot de passe ne s'affiche pas. */
function demanderCache(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    let masque = false;
    const sortie = rl as unknown as { _writeToOutput: (s: string) => void };
    sortie._writeToOutput = (s) => {
      if (!masque) process.stdout.write(s);
    };
    rl.question(question, (reponse) => {
      rl.close();
      process.stdout.write("\n");
      resolve(reponse);
    });
    masque = true;
  });
}

async function motDePasse(): Promise<string> {
  const fourni = process.env.ADMIN_MOT_DE_PASSE;
  if (fourni !== undefined) return fourni;
  if (!process.stdin.isTTY) {
    arreter(
      "Pas de terminal pour saisir le mot de passe : définissez ADMIN_MOT_DE_PASSE.",
    );
  }
  const premier = await demanderCache("  Mot de passe : ");
  const second = await demanderCache("  Confirmation : ");
  if (premier !== second)
    arreter("Les deux mots de passe ne correspondent pas.");
  return premier;
}

async function main() {
  const email = values.email?.trim().toLowerCase() ?? "";
  if (!email.includes("@")) {
    arreter(
      'Indiquez l’adresse : npm run admin:creer -- --email prenom@cancham.mg --nom "Prénom Nom"',
    );
  }

  const existant = await prisma.user.findUnique({
    where: { email },
    select: { id: true, nom: true, role: true },
  });
  if (existant && existant.role !== "admin") {
    arreter(
      `${email} est un compte ${existant.role}. Promouvez-le depuis « Équipe & accès » dans le back-office.`,
    );
  }
  const nom = values.nom?.trim() || existant?.nom;
  if (!nom) arreter('Indiquez le nom : --nom "Prénom Nom"');

  const secret = await motDePasse();
  if (secret.length < MOT_DE_PASSE_MIN) {
    arreter(`Le mot de passe fait au moins ${MOT_DE_PASSE_MIN} caractères.`);
  }

  if (existant) {
    await prisma.user.update({
      where: { id: existant.id },
      // La date de changement ferme les sessions ouvertes avec l'ancien.
      data: { motDePasse: hacher(secret), motDePasseModifieLe: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        action: "mot_de_passe_reinitialise",
        entite: "User",
        entiteId: existant.id,
        acteur: "Script d’administration",
        detail: `Mot de passe de ${email} remplacé en ligne de commande.`,
      },
    });
    console.log(`\n  Mot de passe remplacé pour ${nom} (${email}).\n`);
  } else {
    const admin = await prisma.user.create({
      data: {
        role: "admin",
        niveauEquipe: "administrateur",
        nom,
        fonction: values.fonction!,
        email,
        motDePasse: hacher(secret),
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "admin_promu",
        entite: "User",
        entiteId: admin.id,
        acteur: "Script d’administration",
        detail: `Création du compte administrateur de ${nom} (${email}).`,
      },
    });
    console.log(
      `\n  Administrateur créé : ${nom} (${email}).\n  Connectez-vous sur /auth, puis ouvrez les comptes de vos collègues\n  depuis « Équipe & accès ».\n`,
    );
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
