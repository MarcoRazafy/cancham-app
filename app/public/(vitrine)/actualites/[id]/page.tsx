import Image from "next/image";
import { CONTENEUR, TITRE_GRAS } from "@/components/public/CadreVitrine";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Agrandir } from "@/components/Agrandir";
import { CarteActualite } from "@/components/public/CarteActualite";
import { CarteOffre } from "@/components/public/CarteOffre";
import { TexteLie } from "@/components/TexteLie";
import { fmtDate } from "@/lib/format";
import {
  getActualitePublique,
  getActualitesPubliques,
  getDernieresOffres,
} from "@/lib/queries";

/**
 * Une actualité diffusée sur la page publique, lisible sans compte. Celles
 * réservées aux membres n'existent pas ici : elles vivent sur la plateforme,
 * avec leurs commentaires et leurs « j'aime ».
 */
export default async function ActualitePubliquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [a, recentes, offres] = await Promise.all([
    getActualitePublique(id),
    getActualitesPubliques(4),
    // Quatre suffisent : le rail accompagne l'article, il ne le concurrence pas.
    getDernieresOffres(4),
  ]);
  if (!a) notFound();
  const autres = recentes.filter((r) => r.id !== a.id).slice(0, 3);
  const [couverture, ...galerie] = a.images;

  return (
    // Un article se lit sur du papier : cette page quitte le bleu nuit de la
    // vitrine (voir `.vitrine-claire` dans vitrine.css).
    <main className="vitrine-claire w-full flex-1">
      <div className={`${CONTENEUR} py-10`}>
        <Link
          href="/public#actualites"
          className="inline-flex items-center gap-2 text-[13.5px] text-muted hover:text-ink no-underline mb-6"
        >
          <ArrowLeft size={15} /> Toutes les actualités
        </Link>

        {/*
          Même composition que la plateforme : l'article à gauche, les offres
          dans un rail qui le suit au défilement. Seul, l'article laissait un
          grand vide à droite sur un écran large.
        */}
        <div className="flex gap-10 items-start flex-col xl:flex-row">
          <article className="w-full min-w-0 xl:w-[760px] xl:shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="surtitre text-marque-vert">{a.cat}</span>
              <span className="text-[13px] text-faint">
                · {fmtDate(a.date)}
              </span>
            </div>
            <h1
              className={`${TITRE_GRAS} text-[clamp(28px,4vw,42px)] m-0 mt-2.5`}
            >
              {a.titre}
            </h1>
            <p className="m-0 mt-4 text-[17px] leading-relaxed text-ink">
              {a.extrait}
            </p>

            {couverture ? (
              <Agrandir
                src={couverture}
                alt={a.titre}
                legende={a.titre}
                className="mt-7"
              >
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-line bg-surface-3">
                  <Image
                    src={couverture}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 800px) 100vw, 760px"
                    className="object-cover"
                  />
                </div>
              </Agrandir>
            ) : null}

            <div className="mt-7 flex flex-col gap-4">
              {a.corps.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="m-0 text-[16px] leading-[1.75] text-muted whitespace-pre-line"
                >
                  <TexteLie
                    texte={para}
                    classeLien="text-marque-vert underline underline-offset-2 decoration-marque-vert/40 hover:decoration-marque-vert [overflow-wrap:anywhere]"
                  />
                </p>
              ))}
            </div>

            {galerie.length ? (
              <div className="grid gap-3 mt-8 grid-cols-2 sm:grid-cols-3">
                {galerie.map((src) => (
                  <Agrandir key={src} src={src} alt={a.titre} legende={a.titre}>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-line bg-surface-3">
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, 250px"
                        className="object-cover"
                      />
                    </div>
                  </Agrandir>
                ))}
              </div>
            ) : null}

            <div className="mt-10 rounded-xl border border-line bg-surface p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="m-0 text-[15px] text-ink max-w-[42ch]">
                Rejoignez le réseau des entreprises du Canada et de Madagascar.
              </p>
              <Link href="/auth/inscription" className="btn-action shrink-0">
                Devenir membre <ArrowRight size={16} />
              </Link>
            </div>
          </article>

          {/*
            Le rail suit l'article au défilement. Borné en hauteur : plus haut
            que l'écran, un bloc collant garderait son bas hors d'atteinte.
          */}
          {offres.length ? (
            <aside className="w-full min-w-0 xl:flex-1 xl:sticky xl:top-[124px] xl:max-h-[calc(100dvh-140px)] xl:overflow-y-auto">
              <span className="surtitre text-marque-vert">Entre membres</span>
              <h2 className={`${TITRE_GRAS} text-[20px] m-0 mt-2`}>
                Offres &amp; promotions
              </h2>
              <p className="m-0 mt-2 text-[14px] leading-relaxed text-muted">
                Les avantages que les adhérents de la chambre se réservent entre
                eux.
              </p>
              <div className="grid gap-4 mt-5 sm:grid-cols-2">
                {offres.map((o) => (
                  <CarteOffre key={o.id} offre={o} />
                ))}
              </div>
              <Link
                href="/auth/inscription"
                className="inline-flex items-center gap-1.5 mt-4 text-[13.5px] font-semibold text-marque-vert no-underline hover:underline"
              >
                En profiter à votre tour <ArrowRight size={15} />
              </Link>
            </aside>
          ) : null}
        </div>

        {autres.length ? (
          <section className="mt-14">
            <h2 className={`${TITRE_GRAS} text-[24px] m-0`}>À lire aussi</h2>
            <div className="grid gap-5 mt-6 md:grid-cols-2 lg:grid-cols-3">
              {autres.map((r) => (
                <CarteActualite key={r.id} actualite={r} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
