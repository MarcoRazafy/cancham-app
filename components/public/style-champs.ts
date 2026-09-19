/**
 * Classes des champs des écrans d'identification.
 *
 * À part de `ChampsAuth.tsx` : ce module-là est un composant client, et une
 * constante importée d'un module client par une page serveur n'arrive pas en
 * chaîne — elle arrive en référence client, et la classe se perdait.
 */

// Le filet est une ombre intérieure, pas une bordure : il apparaît sans
// décaler le texte d'un pixel. Le contour de focus global est retiré avec
// `!` : sans lui, la règle de `.marque`, hors couche, l'emporterait.
export const CHAMP_AUTH =
  "w-full min-w-0 rounded-lg border border-line bg-white text-ink placeholder:text-faint py-3.5 text-[14.5px] outline-none transition-[border-color,background-color,box-shadow] focus:border-marque-vert/25 focus:bg-marque-vert/[0.06] focus:shadow-[inset_3px_0_0_var(--marque-vert)] focus-visible:outline-none!";
