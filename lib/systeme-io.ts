import "server-only";

/**
 * La liste de diffusion de la chambre, tenue chez systeme.io.
 *
 * C'est de là que partent ses envois : une inscription faite sur la
 * plateforme doit y arriver, sinon la personne ne recevrait jamais rien. La
 * plateforme garde sa propre trace (table `abonnes`) ; systeme.io reste la
 * liste qui sert.
 *
 * Sans clé (`SYSTEME_IO_API_KEY`), rien ne part : l'inscription est tout de
 * même enregistrée chez nous, et le journal du serveur le dit.
 */

const BASE = "https://api.systeme.io/api";

/**
 * L'étiquette « NEWSLETTER » du compte de la chambre — celle que pose sa
 * propre page d'inscription. Sans elle, le contact existerait sans jamais
 * entrer dans les envois.
 */
const ETIQUETTE_NEWSLETTER = 2093797;

export function systemeIoActif(): boolean {
  return !!process.env.SYSTEME_IO_API_KEY;
}

function entetes(cle: string): HeadersInit {
  return { "X-API-Key": cle, "Content-Type": "application/json" };
}

/** L'identifiant d'un contact déjà connu de la liste, s'il y est. */
async function contactExistant(
  cle: string,
  email: string,
): Promise<number | null> {
  const r = await fetch(
    `${BASE}/contacts?email=${encodeURIComponent(email)}&limit=10`,
    { headers: entetes(cle), cache: "no-store" },
  );
  if (!r.ok) return null;
  const { items } = (await r.json()) as { items?: { id: number }[] };
  return items?.[0]?.id ?? null;
}

/**
 * Inscrit — ou réinscrit — quelqu'un à la lettre d'information de la chambre.
 *
 * Une adresse déjà présente n'est pas une erreur : on récupère le contact et
 * on lui repose l'étiquette. Rend vrai quand la liste a bien été mise à jour.
 */
export async function inscrireContact(v: {
  prenom: string;
  email: string;
}): Promise<boolean> {
  const cle = process.env.SYSTEME_IO_API_KEY;
  if (!cle) {
    console.info(
      `[systeme.io] non transmis (SYSTEME_IO_API_KEY absente) — ${v.email}`,
    );
    return false;
  }

  try {
    const creation = await fetch(`${BASE}/contacts`, {
      method: "POST",
      headers: entetes(cle),
      body: JSON.stringify({
        email: v.email,
        locale: "fr",
        fields: [{ slug: "first_name", value: v.prenom }],
      }),
    });

    let id: number | null = null;
    if (creation.ok) {
      id = ((await creation.json()) as { id?: number }).id ?? null;
    } else if (creation.status === 422) {
      // Adresse déjà dans la liste : on la retrouve plutôt que d'échouer.
      id = await contactExistant(cle, v.email);
    } else {
      console.error(
        `[systeme.io] création refusée (${creation.status}) — ${v.email} : ${await creation.text()}`,
      );
      return false;
    }
    if (!id) {
      console.error(
        `[systeme.io] contact introuvable après création — ${v.email}`,
      );
      return false;
    }

    const etiquette = await fetch(`${BASE}/contacts/${id}/tags`, {
      method: "POST",
      headers: entetes(cle),
      body: JSON.stringify({ tagId: ETIQUETTE_NEWSLETTER }),
    });
    if (!etiquette.ok && etiquette.status !== 422) {
      console.error(
        `[systeme.io] étiquette refusée (${etiquette.status}) — ${v.email}`,
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[systeme.io] échec réseau — ${v.email}`, e);
    return false;
  }
}
