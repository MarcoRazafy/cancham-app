import { notFound } from "next/navigation";
import {
  Building2,
  Globe,
  Clock,
  CreditCard,
  Lock,
  User as UserIcon,
  MapPin,
} from "lucide-react";
import {
  ListeContacts,
  LogoMark,
  NeedsAndInterests,
  Visuel,
  PuceSecteur,
} from "@/components/domain";
import { Agrandir } from "@/components/Agrandir";
import { TexteLie } from "@/components/TexteLie";
import { CarrouselSection } from "@/components/CarrouselSection";
import { CarteService } from "@/components/CarteService";
import {
  AddContactButton,
  AjouterServiceButton,
  ModifierServiceButton,
  SupprimerServiceButton,
  EditContactButton,
  EditProfileButton,
  RemoveContactButton,
} from "@/components/forms/MemberForms";
import {
  Banner,
  BtnLink,
  Card,
  Pill,
  Saillant,
  SectionTitle,
  Stat,
  StatusPill,
  TableWrap,
  Td,
  Th,
  ViewHead,
} from "@/components/ui";
import { getContacts, getInvoices, getMember } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { affichageSite } from "@/lib/liens";
import {
  anneesCotisationReglees,
  fmtJour,
  prochaineEcheanceCotisation,
} from "@/lib/agenda";
import { aujourdhuiISO, fmtDate, fmtDateShort } from "@/lib/format";
import { fmtCotisation, fmtMontant, libelleFormule } from "@/lib/membership";
import {
  ADHESION_PENDING,
  isOverdueWarning,
  joursDeRetard,
  retardBloque,
  RETARD_BLOCAGE_JOURS,
} from "@/lib/membership";

export default async function ProfilPage() {
  const user = await getCurrentUser("membre");
  const m = await getMember(user.memberId!);
  if (!m) notFound();
  const [myInvoices, contacts] = await Promise.all([
    getInvoices(m.id),
    getContacts(m.id),
  ]);

  const pending = ADHESION_PENDING.includes(m.statut);
  const blocked = retardBloque(m);
  const overdue = isOverdueWarning(m);

  return (
    <>
      <ViewHead
        title={<>Profil &amp; {<Saillant>adhésion</Saillant>}</>}
        action={
          <div className="flex gap-2 flex-wrap">
            <EditProfileButton
              memberId={m.id}
              activite={m.activite}
              desc={m.desc}
              besoins={m.besoins}
              interets={m.interets}
              siteweb={m.siteweb}
              cover={m.cover}
              logo={m.logo}
            />
            {!pending ? (
              <BtnLink href="/membre/profil/certificat" variant="primary">
                Mon certificat
              </BtnLink>
            ) : null}
          </div>
        }
      >
        La fiche de votre organisation telle qu’elle apparaît dans l’annuaire,
        votre statut d’adhésion et l’historique de facturation.
      </ViewHead>

      {pending ? (
        <div className="mb-5">
          <Banner
            tone="warn"
            icon={<Clock size={18} />}
            title="Adhésion en attente de validation"
          >
            Votre profil est enregistré et vous pouvez le compléter dès
            maintenant. L’accès aux autres sections sera activé dès le paiement
            de la cotisation — en ligne, ou validé manuellement par notre équipe
            si vous avez réglé en espèces ou par virement.
          </Banner>
        </div>
      ) : blocked ? (
        <div className="mb-5">
          <Banner
            tone="bad"
            icon={<Lock size={18} />}
            title={`Accès restreint — ${joursDeRetard(m)} jours de retard de cotisation`}
          >
            Passé {RETARD_BLOCAGE_JOURS} jours de retard, l’accès aux autres
            sections de l’espace membre est automatiquement restreint.
          </Banner>
        </div>
      ) : overdue ? (
        <div className="mb-5">
          <Banner
            tone="bad"
            icon={<Clock size={18} />}
            title="Cotisation en retard"
          >
            Régularisez avant {RETARD_BLOCAGE_JOURS} jours de retard (
            {joursDeRetard(m)}/{RETARD_BLOCAGE_JOURS} jours écoulés).
          </Banner>
        </div>
      ) : null}

      <Card className="overflow-hidden mb-[22px] p-0">
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
          <div className="flex gap-4">
            <LogoMark member={m} size={64} />
            <div>
              <h1 className="m-0 mb-2 text-[22px]">{m.nom}</h1>
              <div className="flex gap-1.5 flex-wrap items-center">
                <PuceSecteur secteur={m.secteur} grand />
                <span className="inline-flex items-center gap-1 text-muted text-[13.4px]">
                  <MapPin size={13} /> {m.ville}
                  {m.pays ? ` · ${m.pays}` : ""}
                </span>
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

          <p className="mt-[18px] font-semibold text-[14.5px]">
            <TexteLie texte={m.activite} />
          </p>
          <p className="mt-1.5 text-muted text-[14px] leading-relaxed max-w-[70ch] whitespace-pre-line">
            <TexteLie texte={m.desc} />
          </p>

          <NeedsAndInterests member={m} />

          {m.motivation ? (
            <>
              <div className="flex items-center gap-2.5 mt-[22px] mb-2">
                <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
                <h2 className="text-[17px] font-semibold m-0">
                  Vos <Saillant>motivations</Saillant>
                </h2>
              </div>
              {/* Réponse donnée à l'inscription, telle quelle : c'est une
                  déclaration d'intention, pas une fiche à retoucher. */}
              <p className="m-0 text-[14px] text-muted leading-relaxed max-w-[70ch] whitespace-pre-line">
                <TexteLie texte={m.motivation} />
              </p>
            </>
          ) : null}

          <div className="flex items-center gap-2.5 mt-[22px] mb-3.5 flex-wrap">
            <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
            <h2 className="text-[17px] font-semibold m-0">
              Produits &amp; services
            </h2>
            <span className="flex-1" />
            <AjouterServiceButton memberId={m.id} />
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
                  actions={
                    <>
                      <ModifierServiceButton produit={p} />
                      <SupprimerServiceButton
                        produitId={p.id!}
                        label={p.label}
                      />
                    </>
                  }
                />
              ))}
            </CarrouselSection>
          ) : (
            <p className="m-0 text-[13.4px] text-muted border border-dashed border-line rounded-[var(--radius-m)] px-4 py-6 text-center">
              Aucune offre pour le moment. Ajoutez votre premier produit ou
              service : il apparaîtra sur votre fiche et dans l’annuaire.
            </p>
          )}

          <ListeContacts
            contacts={contacts}
            titre={m.type === "physique" ? "Contact" : "Contacts"}
            intro="Les personnes que la chambre peut joindre chez vous. Le contact principal est celui qu’elle appelle en premier."
            action={<AddContactButton memberId={m.id} />}
            actionContact={(c) => (
              <div className="flex flex-col gap-1.5 shrink-0">
                <EditContactButton contact={c} seul={contacts.length === 1} />
                {/* Le dernier contact n'est pas retirable : l'action le refuse
                    aussi côté serveur, le bouton absent n'est qu'un confort. */}
                {contacts.length > 1 ? (
                  <RemoveContactButton contactId={c.id} nom={c.nom} />
                ) : null}
              </div>
            )}
          />
        </div>
      </Card>

      <SectionTitle>Statut d’adhésion</SectionTitle>
      <div className="grid gap-4 mb-[22px] md:grid-cols-2 xl:grid-cols-4">
        <Stat
          k="Formule"
          v={
            <span className="flex flex-col gap-0.5">
              <span className="text-[14px] font-semibold leading-snug">
                {libelleFormule(m.formule)}
              </span>
              <span className="text-[13px] text-accent-strong font-semibold">
                {fmtCotisation(m.formule)}{" "}
                <span className="text-muted font-normal">/ par an</span>
              </span>
            </span>
          }
        />
        <Stat
          k="Adhésion"
          v={
            <span className="text-[19px]">
              <StatusPill status={m.statut} />
            </span>
          }
        />
        <Stat
          k="Membre depuis"
          v={<span className="text-[19px]">{fmtDateShort(m.adhesion)}</span>}
        />
        <Stat
          k={m.paiementNote ? "Dernier paiement" : "Prochain renouvellement"}
          v={
            <span className="text-[14px] font-semibold leading-snug">
              {m.paiementNote ??
                (pending
                  ? "Au premier règlement"
                  : fmtJour(
                      prochaineEcheanceCotisation({
                        aujourdhui: aujourdhuiISO(),
                        adhesion: m.adhesion,
                        anneesReglees: anneesCotisationReglees(myInvoices),
                        aJour: m.statut === "a_jour",
                      }),
                    ))}
            </span>
          }
        />
      </div>

      <SectionTitle>Historique des paiements</SectionTitle>
      <TableWrap>
        <thead>
          <tr>
            <Th>Facture</Th>
            <Th>Date</Th>
            <Th>Objet</Th>
            <Th>Montant</Th>
            <Th>Statut</Th>
          </tr>
        </thead>
        <tbody>
          {myInvoices.length ? (
            myInvoices.map((f) => (
              <tr key={f.id} className="hover:bg-surface-2">
                <Td className="font-[family-name:var(--font-mono)]">
                  {f.numero}
                </Td>
                <Td className="text-muted">{fmtDateShort(f.date)}</Td>
                <Td>{f.objet}</Td>
                <Td className="font-[family-name:var(--font-mono)]">
                  {fmtMontant(f.montant, f.devise)}
                </Td>
                <Td>
                  <StatusPill status={f.statut} />
                </Td>
              </tr>
            ))
          ) : (
            <tr>
              <Td className="text-muted text-center py-5">
                Aucune facture pour le moment.
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <p className="text-[11.5px] text-faint mt-4 flex items-center gap-1.5">
        <CreditCard size={12} />
        Paiement en ligne non branché : en V1 l’équipe CanCham enregistre les
        règlements depuis le back-office.
      </p>
    </>
  );
}
