import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Heart,
  MessageCircle,
  Newspaper,
  Pencil,
  Plus,
  Tag,
} from "lucide-react";
import { EnTeteAdmin, Onglets, Vide } from "@/components/admin/ui";
import { LogoMark } from "@/components/domain";
import {
  OffreButton,
  SupprimerActualiteButton,
  SupprimerOffreButton,
} from "@/components/forms/AdminContenuForms";
import { Card, Pill, Saillant } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { getMembers, getNews, getOffers } from "@/lib/queries";

export default async function AdminActualites({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const { vue: demande } = await searchParams;
  const vue = demande === "offres" ? "offres" : "publications";

  const [actualites, offres, membres] = await Promise.all([
    getNews(),
    getOffers(),
    getMembers(),
  ]);
  const actifs = membres.filter((m) => m.statut !== "candidature");
  const parId = new Map(membres.map((m) => [m.id, m]));

  return (
    <>
      <EnTeteAdmin
        surtitre="Programme"
        titre={
          <>
            Actualités &amp; <Saillant ton="vert">offres</Saillant>
          </>
        }
        actions={
          vue === "offres" ? (
            <OffreButton
              membres={actifs.map((m) => ({ id: m.id, nom: m.nom }))}
            />
          ) : (
            <Link
              href="/admin/actualites/nouvelle"
              className="btn-action btn-action-sm no-underline"
            >
              <Plus size={15} /> Nouvelle actualité
            </Link>
          )
        }
      >
        Le fil de la chambre et les avantages que les membres se réservent entre
        eux. Tout ce qui est publié ici apparaît aussitôt dans l’espace membre.
      </EnTeteAdmin>

      <Onglets
        actif={vue}
        onglets={[
          {
            cle: "publications",
            libelle: "Publications",
            href: "/admin/actualites",
            compte: actualites.length,
          },
          {
            cle: "offres",
            libelle: "Offres des membres",
            href: "/admin/actualites?vue=offres",
            compte: offres.length,
          },
        ]}
      />

      {vue === "publications" ? (
        actualites.length ? (
          <ul className="list-none m-0 p-0 flex flex-col gap-3">
            {actualites.map((n) => (
              <li key={n.id}>
                <Card className="p-4 flex gap-4 items-center flex-wrap sm:flex-nowrap">
                  <Link
                    href={`/admin/actualites/${n.id}`}
                    className="relative w-full sm:w-[150px] aspect-[16/9] rounded-lg overflow-hidden shrink-0 block"
                    style={
                      n.image
                        ? undefined
                        : {
                            background:
                              n.media.theme === "green"
                                ? "linear-gradient(135deg, var(--accent-strong), var(--accent))"
                                : "linear-gradient(135deg, var(--navy), var(--navy-2))",
                          }
                    }
                  >
                    {n.image ? (
                      <Image
                        src={n.image}
                        alt=""
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-white/80">
                        <Newspaper size={22} />
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-[12px] text-muted">
                      <Pill>{n.cat}</Pill>
                      <span>{fmtDate(n.date)}</span>
                    </div>
                    <Link
                      href={`/admin/actualites/${n.id}`}
                      className="block mt-1.5 text-[15px] font-semibold text-ink no-underline hover:text-accent"
                    >
                      {n.titre}
                    </Link>
                    <p className="m-0 mt-1 text-[13px] text-muted line-clamp-2">
                      {n.extrait}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-3 text-[12.5px] text-muted tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Heart size={14} /> {n.jaimes}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle size={14} /> {n.commentaires.length}
                      </span>
                    </span>
                    <span className="flex gap-1.5">
                      <Link
                        href={`/admin/actualites/${n.id}/modifier`}
                        aria-label={`Modifier « ${n.titre} »`}
                        title="Modifier"
                        className="w-9 h-9 rounded-[var(--radius-s)] border border-line bg-surface flex items-center justify-center text-muted hover:text-ink hover:border-faint"
                      >
                        <Pencil size={15} />
                      </Link>
                      <SupprimerActualiteButton
                        newsId={n.id}
                        titre={n.titre}
                        commentaires={n.commentaires.length}
                      />
                    </span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card>
            <Vide icone={<Newspaper size={26} />}>
              Aucune actualité publiée.
            </Vide>
          </Card>
        )
      ) : offres.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {offres.map((o) => {
            const m = parId.get(o.membreId);
            return (
              <Card key={o.id} className="p-4 flex gap-4 items-start">
                {m ? (
                  <LogoMark member={m} size={40} />
                ) : (
                  <span className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center text-faint">
                    <Tag size={16} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold text-ink">
                    {o.titre}
                  </div>
                  <Link
                    href={`/admin/membres/${o.membreId}`}
                    className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent no-underline hover:underline"
                  >
                    {o.membre} <ExternalLink size={11} />
                  </Link>
                  <p className="m-0 mt-1.5 text-[13px] text-muted">{o.desc}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <OffreButton
                    offre={o}
                    membres={actifs.map((x) => ({ id: x.id, nom: x.nom }))}
                  />
                  <SupprimerOffreButton offerId={o.id} titre={o.titre} />
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Vide icone={<Tag size={26} />}>Aucune offre publiée.</Vide>
        </Card>
      )}
    </>
  );
}
