import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { CONTENEUR, TITRE_GRAS } from "@/components/public/CadreVitrine";
import { TexteLie } from "@/components/TexteLie";
import { affichageSite } from "@/lib/liens";
import { getOffre } from "@/lib/queries";

/** Ce qu'un partage affiche : l'avantage, l'entreprise qui l'offre, son visuel. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const o = await getOffre(id);
  if (!o) return { title: "Offre introuvable" };

  return {
    title: `${o.titre} — ${o.membre.nom}`,
    description: o.desc.slice(0, 200),
    alternates: { canonical: `/offres/${o.id}` },
    openGraph: {
      title: o.titre,
      description: o.desc.slice(0, 200),
      type: "article",
      images: o.visuel ? [o.visuel] : undefined,
    },
  };
}

/**
 * Une offre entre membres, lisible sans compte.
 *
 * Elle dit l'avantage, qui le propose, et comment joindre cette entreprise —
 * une offre sans coordonnées ne mène nulle part. Seul le référent de
 * l'entreprise y paraît : l'annuaire complet reste réservé aux adhérents.
 */
export default async function OffrePubliquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const o = await getOffre(id);
  if (!o) notFound();

  const contact = o.contacts.find((c) => c.principal) ?? o.contacts[0];
  const site = o.membre.siteweb;

  return (
    // Une fiche se lit sur du papier : cette page quitte le bleu nuit de la
    // vitrine (voir `.vitrine-claire` dans vitrine.css).
    <main className="vitrine-claire w-full flex-1">
      <div className={`${CONTENEUR} py-10`}>
        <Link
          href="/#actualites"
          className="inline-flex items-center gap-2 text-[13.5px] text-muted hover:text-ink no-underline mb-6"
        >
          <ArrowLeft size={15} /> Retour aux actualités
        </Link>

        <div className="flex gap-10 items-start flex-col xl:flex-row">
          <article className="w-full min-w-0 xl:w-[720px] xl:shrink-0">
            <span className="surtitre text-marque-vert">
              Offre entre membres
            </span>
            <h1
              className={`${TITRE_GRAS} text-[clamp(26px,3.6vw,38px)] m-0 mt-2.5`}
            >
              {o.titre}
            </h1>
            <p className="m-0 mt-2 text-[15px] text-muted">
              Proposée par <strong className="text-ink">{o.membre.nom}</strong>
            </p>

            {o.visuel ? (
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-line bg-surface-3 mt-7">
                <Image
                  src={o.visuel}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 800px) 100vw, 720px"
                  className="object-cover"
                />
              </div>
            ) : null}

            <p className="m-0 mt-7 text-[16px] leading-[1.75] text-muted whitespace-pre-line">
              <TexteLie texte={o.desc} />
            </p>

            <div className="mt-10 rounded-xl border border-line bg-surface p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="m-0 text-[15px] text-ink max-w-[44ch]">
                Ces avantages, les adhérents se les réservent entre eux.
              </p>
              <Link href="/auth/inscription" className="btn-action shrink-0">
                Devenir membre <ArrowRight size={16} />
              </Link>
            </div>
          </article>

          {/* ==================== L'entreprise ==================== */}
          <aside className="w-full min-w-0 xl:flex-1 rounded-xl border border-line bg-surface p-6">
            <div className="flex items-center gap-3.5">
              {o.membre.logo ? (
                <Image
                  src={o.membre.logo}
                  alt=""
                  width={56}
                  height={56}
                  sizes="56px"
                  className="w-14 h-14 rounded-lg object-contain bg-white border border-line shrink-0"
                />
              ) : null}
              <div className="min-w-0">
                <div className="text-[16px] font-semibold text-ink leading-snug">
                  {o.membre.nom}
                </div>
                <div className="text-[12.8px] text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>{o.membre.secteur}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12.5} /> {o.membre.ville}
                  </span>
                </div>
              </div>
            </div>

            <p className="m-0 mt-4 text-[14px] leading-relaxed text-muted">
              {o.membre.activite}
            </p>

            {contact ? (
              <div className="mt-5 pt-5 border-t border-line">
                <span className="surtitre text-marque-vert">Contact</span>
                <div className="text-[14.5px] font-semibold text-ink mt-2">
                  {contact.nom}
                </div>
                <div className="text-[12.8px] text-muted">
                  {contact.fonction}
                </div>
                <div className="mt-3 flex flex-col gap-2 text-[13.5px]">
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-2 text-ink no-underline hover:text-marque-vert [overflow-wrap:anywhere]"
                  >
                    <Mail size={14} className="shrink-0" /> {contact.email}
                  </a>
                  {contact.tel ? (
                    <a
                      href={`tel:${contact.tel}`}
                      className="inline-flex items-center gap-2 text-ink no-underline hover:text-marque-vert"
                    >
                      <Phone size={14} className="shrink-0" /> {contact.tel}
                    </a>
                  ) : null}
                  {site ? (
                    <a
                      href={site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-ink no-underline hover:text-marque-vert [overflow-wrap:anywhere]"
                    >
                      <Globe size={14} className="shrink-0" />{" "}
                      {affichageSite(site)}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
