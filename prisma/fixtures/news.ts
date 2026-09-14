import type { NewsItem } from "../../lib/types";

/** Fil d'actualité de la chambre. Contenus d'exemple. */
export const NEWS: NewsItem[] = [
  {
    id: "n1",
    titre: "Lancement de la 9ᵉ édition de la MECC : cap sur le tourisme et l’éducation",
    date: "2026-09-02",
    cat: "Programmation",
    media: { type: "image", theme: "navy" },
    extrait:
      "La prochaine Mission Économique et Commerciale au Canada s’articule autour de deux filières prioritaires, portées par une délégation de 10 à 12 entreprises. Le lancement officiel est fixé au 1er octobre, avec un ancrage fort autour du SITV Montréal.",
    corps:
      "La 9ᵉ édition de la MECC se tiendra du 11 octobre au 11 novembre 2026, avec un ancrage autour du SITV Montréal (30 octobre au 1er novembre). Le lancement officiel aura lieu le 1er octobre à Antananarivo, en présence des entreprises candidates et de nos partenaires institutionnels. La délégation portera sur deux filières prioritaires : le tourisme entrant, sous la bannière « Destination Madagascar », et l’éducation, dans la continuité de la dynamique engagée lors des éditions précédentes. Comme pour la MECC 8, la délégation devrait compter entre 10 et 12 entreprises malgaches. Les membres intéressés par une place au sein de la délégation, ou par un partenariat autour de l’événement, sont invités à se manifester auprès de l’équipe CanCham dans les prochaines semaines.",
    commentaires: [
      {
        id: "c1",
        auteur: "Hery Rakotomalala",
        entreprise: "Tsara Voyages",
        texte: "Notre équipe est très intéressée par une place dans la délégation Tourisme.",
        date: "2026-09-03",
      },
    ],
  },
  {
    id: "n7",
    titre: "5 à 7 Réseautage du 28 août : une salle comble pour la rentrée",
    date: "2026-08-29",
    cat: "Vie de la chambre",
    media: { type: "image", theme: "navy" },
    extrait:
      "Le premier 5 à 7 de la rentrée a rassemblé un nombre record de membres, avec plusieurs nouvelles entreprises venues découvrir la chambre. Retour en images sur une soirée particulièrement animée.",
    corps:
      "Le 5 à 7 Réseautage du 28 août a rassemblé un nombre record de participants pour une soirée de rentrée, avec plusieurs entreprises non membres venues découvrir la formule pour la première fois. Le format reste volontairement simple : un espace convivial, peu de prises de parole formelles, et beaucoup de temps laissé aux échanges spontanés entre entrepreneurs. Deux prochaines éditions sont déjà programmées, le 22 septembre et le 27 novembre, toujours à Antananarivo. Les membres qui souhaitent inviter un contact professionnel intéressé par la chambre peuvent le faire sans inscription préalable.",
    commentaires: [],
  },
  {
    id: "n3",
    titre: "Caravane de régionalisation : étape à Tamatave le 9 octobre",
    date: "2026-08-20",
    cat: "Programmation",
    media: { type: "image", theme: "green" },
    extrait:
      "Après Antananarivo, Canada Expo poursuit sa tournée régionale sur la côte Est. L’objectif : rapprocher les opportunités de coopération canadienne des entreprises situées en dehors de la capitale, avec une programmation adaptée aux réalités du port de Tamatave.",
    corps:
      "La caravane de régionalisation Canada Expo fait étape à Tamatave le 9 octobre, après une première halte réussie à Antananarivo le 30 juin. Une dernière étape est déjà prévue dans la région SAVA le 3 décembre, avec un accent particulier sur la filière vanille et épices. À Tamatave, la journée combinera des présentations sur les mécanismes d’accompagnement à l’export vers le Canada, des rendez-vous individuels avec l’équipe CanCham, et un temps d’échange avec des entreprises régionales déjà engagées dans une démarche d’internationalisation. L’objectif de cette tournée reste le même depuis son lancement : rapprocher les opportunités de coopération canadienne des entreprises situées en dehors de la capitale, qui n’ont pas toujours l’occasion de se déplacer jusqu’à Antananarivo pour ce type de rencontre.",
    commentaires: [],
  },
  {
    id: "n2",
    titre: "Retour sur le Gala des 10 ans et la restitution de la MECC 8",
    date: "2026-08-01",
    cat: "Événement passé",
    media: { type: "video", theme: "green", duration: "3:42" },
    extrait:
      "Plus de 200 personnes réunies au Radisson Blu pour célébrer une décennie de coopération Canada-Madagascar, dans un format de réseautage pensé pour créer de vraies rencontres d’affaires. Un moment fort de la vie de la chambre, immortalisé dans ce court récapitulatif vidéo.",
    corps:
      "Le 27 juillet, la chambre a réuni plus de 200 membres et partenaires pour un événement combiné : la célébration des 10 ans de CanCham et la restitution officielle de la MECC 8. La soirée reposait sur un format de réseautage volontairement structuré, avec placement par badge et carte, rotations de table à chaque service, présentations éclair de trois minutes par convive et un exercice de brainstorm entre voisins de table sur un défi d’affaires réel. Ce format, testé pour la première fois à cette échelle, a généré un nombre inhabituel de mises en relation concrètes le soir même. La restitution de la MECC 8 a permis de présenter les résultats obtenus par la délégation lors de sa mission au Canada, ainsi que les prochaines étapes pour les entreprises impliquées.",
    commentaires: [
      {
        id: "c2",
        auteur: "Fanomezantsoa Randria",
        entreprise: "Highlands Artisanat",
        texte: "Belle soirée, merci à l’équipe pour l’organisation !",
        date: "2026-08-02",
      },
    ],
  },
  {
    id: "n4",
    titre: "Nouveau bureau CanCham : un espace pensé pour nos membres",
    date: "2026-07-10",
    cat: "Vie de la chambre",
    media: { type: "image", theme: "navy" },
    extrait:
      "La chambre inaugure de nouveaux locaux à Antananarivo, avec un programme d’accueil renforcé pour les entreprises membres. Un espace pensé dès le départ pour favoriser les rencontres entre membres, partenaires et délégations de passage.",
    corps:
      "CanCham Madagascar a emménagé dans de nouveaux locaux à Antananarivo, conçus dès le départ pour faciliter les rencontres entre membres, partenaires institutionnels et délégations de passage. L’espace comprend une zone d’accueil, une salle de réunion modulable et un coin dédié aux rendez-vous individuels avec l’équipe. Un programme de formation et d’accompagnement pour les entreprises membres y sera déployé progressivement au cours des prochains mois, en complément des activités déjà proposées. Les membres qui souhaitent utiliser l’espace pour une rencontre avec un partenaire ou un client peuvent en faire la demande directement auprès de l’équipe.",
    commentaires: [],
  },
  {
    id: "n5",
    titre: "Mission Pilote 2026 : des investisseurs canadiens à la rencontre de Madagascar",
    date: "2026-06-15",
    cat: "Programmation",
    media: { type: "video", theme: "navy", duration: "5:18" },
    extrait:
      "Une première mission inverse a permis à des investisseurs canadiens de rencontrer l’écosystème malgache sur le terrain, du 20 au 31 juillet. Un programme entièrement sur mesure, construit autour des secteurs d’intérêt confirmés par chaque investisseur.",
    corps:
      "Du 20 au 31 juillet, une délégation d’investisseurs et d’experts en développement de marché canadiens a séjourné à Madagascar dans le cadre de la Mission Pilote 2026, une première pour la chambre : jusqu’ici, les missions organisées par CanCham allaient dans le sens inverse, de Madagascar vers le Canada. Le programme, entièrement bespoke, a été construit autour des secteurs confirmés par chaque investisseur, avec un volet institutionnel (rencontres ministérielles), un volet privé (mises en relation avec des entreprises malgaches) et un volet logistique pris en charge par CanCham. Les investisseurs ont également participé au Gala du 27 juillet, où ils ont pu échanger directement avec l’ensemble de nos membres. Cette première édition ouvre la voie à une formule qui pourrait être reconduite dans les prochains cycles.",
    commentaires: [],
  },
  {
    id: "n6",
    titre: "Replay : atelier en ligne sur la mobilité francophone vers le Canada",
    date: "2026-05-22",
    cat: "Formation",
    media: { type: "video", theme: "green", duration: "52:00" },
    extrait:
      "L’enregistrement complet de notre atelier en ligne sur les programmes de mobilité francophone est maintenant disponible dans l’espace Ressources. Une séance pratique, animée avec nos partenaires institutionnels, pour comprendre les différentes voies d’entrée au Canada.",
    corps:
      "Pour les membres qui n’ont pas pu assister à la séance en direct, l’enregistrement complet de notre atelier en ligne sur la mobilité francophone vers le Canada est désormais disponible dans l’espace Ressources. Animée avec nos partenaires institutionnels, cette séance pratique couvre les principaux programmes de mobilité accessibles aux entrepreneurs et professionnels malgaches, les critères d’admissibilité les plus fréquemment mal compris, et un temps de questions-réponses avec les participants. Une nouvelle édition de cet atelier, mise à jour, est prévue le 15 octobre pour tenir compte des derniers ajustements réglementaires du côté canadien.",
    commentaires: [],
  },
  {
    id: "n8",
    titre: "Femmes Malagasy en Agribusiness : où en est le partenariat avec TFO Canada",
    date: "2026-04-18",
    cat: "Programmation",
    media: { type: "image", theme: "green" },
    extrait:
      "Lancé lors de la MECC 8 et du salon SIAL 2024, l’accord de mise en œuvre entre TFO Canada et CanCham autour du projet WEF avance selon le calendrier prévu. Un point d’étape sur les prochaines actions destinées aux entreprises dirigées par des femmes.",
    corps:
      "Le projet « Femmes Malagasy en Agribusiness à la conquête du Canada », né d’un accord de mise en œuvre entre TFO Canada et CanCham signé en marge de la MECC 8 et du salon SIAL 2024, poursuit son déploiement. Ce partenariat vise à accompagner des entreprises malgaches du secteur agroalimentaire dirigées par des femmes dans leur démarche d’accès au marché canadien, avec un accompagnement technique et des mises en relation ciblées. Les entreprises membres actives dans l’agroalimentaire et intéressées par ce volet sont invitées à contacter l’équipe CanCham pour connaître les critères d’éligibilité et les prochaines échéances.",
    commentaires: [],
  },
];

export function findNews(id: string): NewsItem | undefined {
  return NEWS.find((n) => n.id === id);
}
