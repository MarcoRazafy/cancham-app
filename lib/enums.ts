/**
 * Traduction entre les valeurs d'énumération Prisma et les libellés affichés.
 *
 * En base, les libellés français avec accents sont conservés (`@map`), mais le
 * client Prisma expose les noms d'identifiants (`presentiel`, `evenement_passe`).
 * Ces tables font le pont dans les deux sens.
 */
import type {
  EventFormat as DbEventFormat,
  NewsCategory as DbNewsCategory,
  ResourceCategory as DbResourceCategory,
  ResourceFormat as DbResourceFormat,
} from "@/lib/generated/prisma/enums";
import type {
  EventFormat,
  NewsCategory,
  Resource,
  ResourceCategory,
} from "@/lib/types";

export const EVENT_FORMAT_LABEL: Record<DbEventFormat, EventFormat> = {
  presentiel: "Présentiel",
  webinaire: "Webinaire",
  hybride: "Hybride",
};

export const EVENT_FORMAT_DB: Record<EventFormat, DbEventFormat> = {
  "Présentiel": "presentiel",
  Webinaire: "webinaire",
  Hybride: "hybride",
};

export const NEWS_CAT_LABEL: Record<DbNewsCategory, NewsCategory> = {
  programmation: "Programmation",
  evenement_passe: "Événement passé",
  vie_de_la_chambre: "Vie de la chambre",
  formation: "Formation",
};

export const RESOURCE_CAT_LABEL: Record<DbResourceCategory, ResourceCategory> = {
  guide: "Guide",
  modele: "Modèle",
  formation: "Formation",
  rapport: "Rapport",
};

export const RESOURCE_CAT_DB: Record<ResourceCategory, DbResourceCategory> = {
  Guide: "guide",
  "Modèle": "modele",
  Formation: "formation",
  Rapport: "rapport",
};

export const RESOURCE_FMT_LABEL: Record<DbResourceFormat, Resource["fmt"]> = {
  pdf: "PDF",
  docx: "DOCX",
  video: "Vidéo",
};

/** Les dates du modèle de vue sont des ISO courtes (YYYY-MM-DD). */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Horodatage d'un message, rendu tel qu'on l'affiche dans un fil : l'heure pour
 * aujourd'hui, « Hier », le jour de la semaine en deçà d'une semaine, la date
 * au-delà.
 */
export function heureRelative(d: Date, maintenant = new Date()): string {
  const jour = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ecart = Math.round((jour(maintenant) - jour(d)) / 86_400_000);

  if (ecart <= 0)
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (ecart === 1) return "Hier";
  if (ecart < 7)
    return d.toLocaleDateString("fr-FR", { weekday: "long" }).replace(/^./, (c) => c.toUpperCase());
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
