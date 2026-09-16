import { notFound } from "next/navigation";
import { ArrowLeft, Building2, User as UserIcon } from "lucide-react";
import {
  ListeContacts,
  LogoMark,
  NeedsAndInterests,
  Visuel,
} from "@/components/domain";
import { Agrandir } from "@/components/Agrandir";
import { CarrouselSection } from "@/components/CarrouselSection";
import { BoutonMessage } from "@/components/forms/MessageMembre";
import { BtnLink, Card, Pill, StatusPill } from "@/components/ui";
import { getContacts, getMember } from "@/lib/queries";
import { fmtDate } from "@/lib/format";

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

          <p className="mt-5 font-semibold text-[14.5px]">{m.activite}</p>
          <p className="mt-1.5 text-muted text-[14px] leading-relaxed max-w-[70ch]">
            {m.desc}
          </p>

          <NeedsAndInterests member={m} />

          <div className="flex items-center gap-2.5 mt-[22px] mb-3.5">
            <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
            <h2 className="text-[17px] font-semibold m-0">
              Produits &amp; services
            </h2>
          </div>
          {/*
            Toute la section défile, pas chaque produit : une carte par photo,
            trois par page. Un produit sans photo garde une carte, avec son
            dégradé, pour ne pas disparaître du catalogue.
          */}
          <CarrouselSection libelle={`Produits et services de ${m.nom}`}>
            {m.produits.flatMap((p) =>
              (p.photos.length ? p.photos : [null]).map((src, i) => (
                <Card
                  key={`${p.label}-${i}`}
                  className="p-4 text-center w-full"
                >
                  {src ? (
                    <Agrandir src={src} alt={p.label} legende={p.label}>
                      <Visuel
                        src={src}
                        alt={p.label}
                        seed={m.id + p.label}
                        className="aspect-[4/3] mb-2 rounded-[var(--radius-m)] w-full"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    </Agrandir>
                  ) : (
                    <Visuel
                      src={null}
                      alt={p.label}
                      seed={m.id + p.label}
                      className="aspect-[4/3] mb-2 rounded-[var(--radius-m)] w-full"
                      iconSize={18}
                    />
                  )}
                  <div className="font-semibold text-[13px]">{p.label}</div>
                </Card>
              )),
            )}
          </CarrouselSection>

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
