/**
 * Seed de la base CanCham Connect.
 *
 * Il reprend telles quelles les données d'exemple de `lib/data/`, qui restent
 * la source de vérité tant que l'application n'a pas basculé sur la base.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { EVENTS, REGISTRATIONS } from "./fixtures/events";
import { INVOICES } from "./fixtures/invoices";
import { MEMBERS } from "./fixtures/members";
import { NEWS } from "./fixtures/news";
import { OFFERS, SERVICES } from "./fixtures/offers";
import { RESOURCES } from "./fixtures/resources";
import { THREADS } from "./fixtures/threads";
import { CONTACTS, USERS } from "./fixtures/users";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Les dates du jeu de données sont des ISO courtes (YYYY-MM-DD). */
const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

/* ---- Correspondances entre les libellés du jeu de données et les enums ---- */

const EVENT_FORMAT = {
  "Présentiel": "presentiel",
  Webinaire: "webinaire",
  Hybride: "hybride",
} as const;

const NEWS_CAT = {
  Programmation: "programmation",
  "Événement passé": "evenement_passe",
  "Vie de la chambre": "vie_de_la_chambre",
  Formation: "formation",
} as const;

const RES_CAT = {
  Guide: "guide",
  "Modèle": "modele",
  Formation: "formation",
  Rapport: "rapport",
} as const;

const RES_FMT = { PDF: "pdf", DOCX: "docx", "Vidéo": "video" } as const;

/* ---- Participants aux événements ---- */

const NOMS_PARTICIPANTS = [
  "Rado Andriamihaja", "Nantenaina Rasolofo", "Volatiana Ramamonjisoa",
  "Tiana Rakotoson", "Faniry Andriamanjato", "Zo Ravaoarimalala",
  "Miora Rasoamampionona", "Njaka Randrianasolo", "Lova Andrianirina",
  "Baholy Ratsimbazafy", "Fenitra Rakotondrabe", "Herimanana Razafindrakoto",
];

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, ".");

/**
 * Reconstitue la liste des participants d'un événement.
 *
 * Les premiers sont des représentants de membres, le reste des participants
 * individuels. Le total correspond au nombre d'inscrits du jeu de données, de
 * sorte que les compteurs affichés restent identiques.
 */
function participants(eventId: string, inscrits: number, passe: boolean) {
  const connus = MEMBERS.filter((m) => m.statut !== "candidature");
  const rows = [];
  for (let i = 0; i < inscrits; i++) {
    if (i < Math.min(connus.length, Math.ceil(inscrits * 0.4))) {
      const m = connus[i % connus.length];
      const u = m.id === "m1" ? USERS.membre : null;
      rows.push({
        id: `${eventId}-a${i}`,
        eventId,
        nom: u?.nom ?? `Représentant ${m.nom}`,
        entreprise: m.nom,
        email: u?.email ?? `contact@${slug(m.nom)}.mg`,
        statut: passe ? (i % 6 === 0 ? "absent" : "present") : "confirme",
      } as const);
    } else {
      const base = NOMS_PARTICIPANTS[i % NOMS_PARTICIPANTS.length];
      const suffixe =
        i >= NOMS_PARTICIPANTS.length
          ? ` ${Math.floor(i / NOMS_PARTICIPANTS.length) + 1}`
          : "";
      const nom = base + suffixe;
      rows.push({
        id: `${eventId}-a${i}`,
        eventId,
        nom,
        entreprise: "Participant individuel",
        email: `${slug(nom)}@exemple.mg`,
        statut: passe ? (i % 6 === 0 ? "absent" : "present") : "confirme",
      } as const);
    }
  }
  return rows;
}

async function main() {
  console.log("Nettoyage…");
  // L'ordre respecte les clés étrangères ; les cascades font le reste.
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.canchamService.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.news.deleteMany();
  await prisma.attendee.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.produit.deleteMany();
  await prisma.user.deleteMany();
  await prisma.member.deleteMany();

  console.log("Membres et produits…");
  for (const m of MEMBERS) {
    await prisma.member.create({
      data: {
        id: m.id,
        type: m.type,
        nom: m.nom,
        secteur: m.secteur,
        ville: m.ville,
        statut: m.statut,
        adhesion: d(m.adhesion),
        retardDepuis: m.retardDepuis ? d(m.retardDepuis) : null,
        activite: m.activite,
        desc: m.desc,
        besoins: m.besoins ?? null,
        interets: m.interets ?? null,
        statutJuridique: m.statutJuridique ?? null,
        pays: m.pays ?? null,
        siteweb: m.siteweb ?? null,
        motivation: m.motivation ?? null,
        paiementNote: m.paiementNote ?? null,
        cover: m.cover ?? null,
        photo: m.photo ?? null,
        logo: m.logo ?? null,
        produits: {
          create: m.produits.map((p, i) => ({
            label: p.label,
            photo: p.photo,
            ordre: i,
          })),
        },
      },
    });
  }

  console.log("Utilisateurs…");
  for (const u of Object.values(USERS)) {
    await prisma.user.create({
      data: {
        id: u.id,
        role: u.role,
        nom: u.nom,
        fonction: u.fonction,
        email: u.email,
        tel: u.tel ?? null,
        photo: u.photo ?? null,
        memberId: u.memberId,
        contactPrincipal: u.role === "membre" || u.role === "visiteur",
      },
    });
  }
  for (const c of CONTACTS) {
    await prisma.user.create({
      data: { ...c, role: "membre", contactPrincipal: false },
    });
  }

  console.log("Événements, inscriptions et participants…");
  const aujourdhui = new Date();
  for (const e of EVENTS) {
    const passe = d(e.date) < aujourdhui;
    await prisma.event.create({
      data: {
        id: e.id,
        titre: e.titre,
        date: d(e.date),
        lieu: e.lieu,
        format: EVENT_FORMAT[e.format],
        cap: e.cap,
        payant: e.payant,
        prix: e.prix,
        desc: e.desc,
        photo: e.photo,
        heure: e.heure ?? null,
        pourQui: e.pourQui ?? null,
        programme: {
          create: (e.programme ?? []).map((etape, i) => ({
            heure: etape.heure,
            titre: etape.titre,
            detail: etape.detail ?? null,
            ordre: i,
          })),
        },
      },
    });
    await prisma.attendee.createMany({
      data: participants(e.id, e.inscrits, passe),
    });
  }
  for (const r of REGISTRATIONS) {
    await prisma.registration.create({
      data: {
        eventId: r.eventId,
        memberId: r.memberId,
        code: r.code,
        createdAt: d(r.date),
      },
    });
  }

  console.log("Actualités…");
  for (const n of NEWS) {
    await prisma.news.create({
      data: {
        id: n.id,
        titre: n.titre,
        date: d(n.date),
        cat: NEWS_CAT[n.cat],
        extrait: n.extrait,
        corps: n.corps,
        mediaType: n.media.type,
        mediaTheme: n.media.theme,
        mediaDuration: n.media.duration ?? null,
        image: n.image ?? null,
        commentaires: {
          create: n.commentaires.map((c) => ({
            auteur: c.auteur,
            entreprise: c.entreprise,
            texte: c.texte,
            date: d(c.date),
          })),
        },
      },
    });
  }

  console.log("Ressources…");
  for (const r of RESOURCES) {
    await prisma.resource.create({
      data: {
        id: r.id,
        titre: r.titre,
        cat: RES_CAT[r.cat],
        fmt: RES_FMT[r.fmt],
        taille: r.taille,
        date: d(r.date),
        type: r.type,
        prix: r.prix,
        commentaires: {
          create: r.commentaires.map((c) => ({
            auteur: c.auteur,
            entreprise: c.entreprise,
            texte: c.texte,
            date: d(c.date),
          })),
        },
      },
    });
  }

  console.log("Offres et services…");
  for (const o of OFFERS) {
    await prisma.offer.create({
      data: { id: o.id, titre: o.titre, desc: o.desc, memberId: o.membreId },
    });
  }
  for (const [i, s] of SERVICES.entries()) {
    await prisma.canchamService.create({
      data: {
        id: s.id,
        titre: s.titre,
        desc: s.desc,
        type: s.type,
        prix: s.prix,
        icon: s.icon,
        ordre: i,
      },
    });
  }

  console.log("Factures…");
  for (const f of INVOICES) {
    await prisma.invoice.create({
      data: {
        id: f.id,
        numero: f.numero,
        date: d(f.date),
        objet: f.objet,
        montant: f.montant,
        statut: f.statut,
        memberId: f.membreId,
      },
    });
  }

  console.log("Messagerie…");
  // Le jeu de données porte des heures d'affichage (« Hier », « Lundi ») ;
  // on les convertit en horodatages décroissants, plus récents en dernier.
  for (const t of THREADS) {
    await prisma.messageThread.create({
      data: {
        id: t.id,
        type: t.type,
        nom: t.nom,
        sousTitre: t.sousTitre,
        init: t.init,
        avatar: t.avatar ?? null,
        unread: t.unread,
        messages: {
          create: t.messages.map((m, i) => ({
            auteur: m.moi ? USERS.membre.nom : m.de,
            texte: m.texte,
            sentAt: new Date(
              aujourdhui.getTime() -
                (t.messages.length - i) * 36e5 -
                THREADS.indexOf(t) * 24 * 36e5,
            ),
            userId: m.moi ? USERS.membre.id : null,
          })),
        },
      },
    });
  }

  console.log("Journal…");
  await prisma.auditLog.create({
    data: {
      action: "seed",
      entite: "Database",
      entiteId: "init",
      acteur: "script de seed",
      detail: "Chargement initial des données d'exemple.",
    },
  });
}

main()
  .then(async () => {
    const compte = {
      membres: await prisma.member.count(),
      utilisateurs: await prisma.user.count(),
      produits: await prisma.produit.count(),
      evenements: await prisma.event.count(),
      inscriptions: await prisma.registration.count(),
      participants: await prisma.attendee.count(),
      actualites: await prisma.news.count(),
      ressources: await prisma.resource.count(),
      commentaires: await prisma.comment.count(),
      offres: await prisma.offer.count(),
      services: await prisma.canchamService.count(),
      factures: await prisma.invoice.count(),
      fils: await prisma.messageThread.count(),
      messages: await prisma.message.count(),
    };
    console.table(compte);
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
