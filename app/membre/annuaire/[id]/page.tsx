import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Globe, User as UserIcon } from "lucide-react";
import {
  ListeContacts,
  LogoMark,
  NeedsAndInterests,
  Visuel,
} from "@/components/domain";
import { Agrandir } from "@/components/Agrandir";
import { TexteLie } from "@/components/TexteLie";
import { CarrouselSection } from "@/components/CarrouselSection";
import { CarteService } from "@/components/CarteService";
import { BoutonMessage } from "@/components/forms/MessageMembre";
import { BtnLink, Card, Pill, StatusPill } from "@/components/ui";
import { getContacts, getMember } from "@/lib/queries";
import { fmtDate } from "@/lib/format";
import { affichageSite } from "@/lib/liens";

export default async function FicheMembrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await getMember(id);
  if (!m || m.statut === "candidature") notFound();
  const contacts = await getContacts(m.id);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <BtnLink href="/membre/annuaire" variant="ghost" sm>
          <ArrowLeft size={14} /> Retour à l’annuaire
        </BtnLink>
        <BoutonMessage memberId={m.id} />
      </div>

      <Card className="overflow-hidden p-0">
        <Agrandir src={m.cover} alt={`Couverture de ${m.nom}`} legende={m.nom}>
          <Visuel
            src={m.cover}
            alt=""
            seed={m.id}
            className="h-[190px] w-full"
            sizes="(max-width: 1024px) 100vw, 900px"
            icon={
              m.type === "physique" ? (
                <UserIcon size={26} />
              ) : (
                <Building2 size={26} />
              )
            }
          />
        </Agrandir>
        <div className="p-[22px]">
          <div className="flex gap-4 flex-wrap justify-between">
            <div className="flex gap-4">
              <LogoMark member={m} size={64} />
              <div>
                <h1 className="m-0 mb-1 text-[22px]">{m.nom}</h1>
                <div className="text-muted text-[13.6px]">
                  {m.secteur} · {m.ville}
                </div>
                {m.siteweb ? (
                  <a
                    href={m.siteweb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1 text-[13.2px] font-semibold text-accent no-underline hover:underline"
                  >
                    <Globe size={14} className="shrink-0" />
                    {affichageSite(m.siteweb)}
                  </a>
                ) : null}
                <div className="flex gap-1.5 flex-wrap pt-2.5">
                  <StatusPill status={m.statut} />
                  {m.type === "physique" ? (
                    <Pill icon={<UserIcon size={10} />}>
                      Indépendant · personne physique
                    </Pill>
                  ) : null}
                  <Pill>
                    Membre depuis {fmtDate(m.adhesion, { year: "numeric" })}
                  </Pill>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 font-semibold text-[14.5px]">
            <TexteLie texte={m.activite} />
          </p>
          <p className="mt-1.5 text-muted text-[14px] leading-relaxed max-w-[70ch] whitespace-pre-line">
            <TexteLie texte={m.desc} />
          </p>

          <NeedsAndInterests member={m} />

          <div className="flex items-center gap-2.5 mt-[22px] mb-3.5 flex-wrap">
            <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
            <h2 className="text-[17px] font-semibold m-0">
              Produits &amp; services
            </h2>
          </div>
          {/*
            Une carte par offre, trois par page ; un clic ouvre sa fiche de
            détail, avec toutes ses photos et sa description.
          */}
          {m.produits.length ? (
            <CarrouselSection libelle={`Produits et services de ${m.nom}`}>
              {m.produits.map((p, i) => (
                <CarteService
                  key={p.id ?? i}
                  produit={p}
                  seed={m.id + p.label}
                />
              ))}
            </CarrouselSection>
          ) : (
            <p className="m-0 text-[13.4px] text-muted border border-dashed border-line rounded-[var(--radius-m)] px-4 py-6 text-center">
              Cette entreprise n’a pas encore présenté ses produits et services.
            </p>
          )}

          <ListeContacts
            contacts={contacts}
            titre={m.type === "physique" ? "Contact" : "Contacts"}
            intro="Écrivez directement à la bonne personne plutôt qu’à une adresse générique."
          />
        </div>
      </Card>
    </>
  );
}
