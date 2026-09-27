import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { ListeContacts } from "@/components/domain";
import { TexteLie } from "@/components/TexteLie";
import { BtnLink, Card, Kicker, Pill } from "@/components/ui";
import { getOffre } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import type { Space } from "@/lib/types";

/**
 * Fiche d'une offre entre membres, dans la plateforme.
 *
 * L'avantage, l'entreprise qui le propose, et ses contacts : c'est par là
 * qu'on en profite. La même page sert aux deux espaces — l'équipe voit ce que
 * voient les membres, et rejoint la fiche du membre plutôt que l'annuaire.
 */
export async function OffrePage({ space, id }: { space: Space; id: string }) {
  await getCurrentUser(space);
  const o = await getOffre(id);
  if (!o) notFound();

  const ficheMembre =
    space === "admin"
      ? `/admin/membres/${o.membre.id}`
      : `/membre/annuaire/${o.membre.id}`;

  return (
    <>
      <div className="mb-4">
        <BtnLink href={`/${space}/actualites`} variant="ghost" sm>
          <ArrowLeft size={14} /> Retour aux actualités
        </BtnLink>
      </div>

      <div className="flex gap-6 items-start flex-col xl:flex-row">
        <Card className="p-[22px] w-full min-w-0 xl:w-[680px] xl:shrink-0">
          <Kicker>Offre entre membres</Kicker>
          <h1 className="mt-2 mb-1.5 text-[24px]">{o.titre}</h1>
          <div className="text-[13px] text-muted mb-4">
            Proposée par{" "}
            <span className="font-semibold text-ink">{o.membre.nom}</span>
          </div>

          {o.visuel ? (
            <div className="relative aspect-[16/9] rounded-[var(--radius-m)] overflow-hidden border border-line bg-surface-3">
              <Image
                src={o.visuel}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 680px"
                className="object-cover"
              />
            </div>
          ) : null}

          <p className="text-[14.6px] leading-[1.75] mt-[18px] whitespace-pre-line">
            <TexteLie texte={o.desc} />
          </p>
        </Card>

        {/* ==================== L'entreprise ==================== */}
        <aside className="w-full min-w-0 xl:flex-1 flex flex-col gap-4">
          <Card className="p-[22px]">
            <div className="flex items-center gap-3.5">
              {o.membre.logo ? (
                <Image
                  src={o.membre.logo}
                  alt=""
                  width={56}
                  height={56}
                  sizes="56px"
                  className="w-14 h-14 rounded-[var(--radius-s)] object-contain bg-white border border-line shrink-0"
                />
              ) : (
                <span className="w-14 h-14 rounded-[var(--radius-s)] border border-line bg-surface-2 text-faint flex items-center justify-center shrink-0">
                  <Building2 size={22} />
                </span>
              )}
              <div className="min-w-0">
                <div className="text-[15.5px] font-semibold text-ink leading-snug">
                  {o.membre.nom}
                </div>
                <div className="text-[12.5px] text-muted mt-1 flex items-center gap-2 flex-wrap">
                  <Pill>{o.membre.secteur}</Pill>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12.5} /> {o.membre.ville}
                  </span>
                </div>
              </div>
            </div>

            <p className="m-0 mt-4 text-[13.6px] leading-relaxed text-muted">
              {o.membre.activite}
            </p>

            <div className="mt-4">
              <BtnLink href={ficheMembre} sm>
                Voir la fiche de l’entreprise
              </BtnLink>
            </div>
          </Card>

          <Card className="p-[22px]">
            <ListeContacts
              contacts={o.contacts}
              intro="Écrivez directement à la bonne personne pour profiter de cette offre."
            />
          </Card>
        </aside>
      </div>
    </>
  );
}
