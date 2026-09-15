import { notFound } from "next/navigation";
import { Building2, Clock, CreditCard, Lock, User as UserIcon } from "lucide-react";
import {
  AvatarRond,
  LogoMark,
  NeedsAndInterests,
  Visuel,
} from "@/components/domain";
import { EditProfileButton } from "@/components/forms/MemberForms";
import {
  Banner,
  BtnLink,
  Card,
  Pill,
  SectionTitle,
  Stat,
  StatusPill,
  Td,
  Th,
  TableWrap,
  ViewHead,
} from "@/components/ui";
import { getInvoices, getMember } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { fmtDate, fmtDateShort, fmtMoney } from "@/lib/format";
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
  const myInvoices = await getInvoices(m.id);

  const pending = ADHESION_PENDING.includes(m.statut);
  const blocked = retardBloque(m);
  const overdue = isOverdueWarning(m);

  return (
    <>
      <ViewHead
        title="Profil & adhésion"
        action={
          <div className="flex gap-2 flex-wrap">
            <EditProfileButton
              memberId={m.id}
              activite={m.activite}
              desc={m.desc}
              besoins={m.besoins}
              interets={m.interets}
              produits={m.produits.map((p) => p.label)}
            />
            {!pending ? (
              <BtnLink href="/membre/profil/certificat" variant="primary">
                Mon certificat
              </BtnLink>
            ) : null}
          </div>
        }
      >
        La fiche de votre organisation telle qu’elle apparaît dans l’annuaire, votre
        statut d’adhésion et l’historique de facturation.
      </ViewHead>

      {pending ? (
        <div className="mb-5">
          <Banner tone="warn" icon={<Clock size={18} />} title="Adhésion en attente de validation">
            Votre profil est enregistré et vous pouvez le compléter dès maintenant.
            L’accès aux autres sections sera activé dès le paiement de la cotisation —
            en ligne, ou validé manuellement par notre équipe si vous avez réglé en
            espèces ou par virement.
          </Banner>
        </div>
      ) : blocked ? (
        <div className="mb-5">
          <Banner
            tone="bad"
            icon={<Lock size={18} />}
            title={`Accès restreint — ${joursDeRetard(m)} jours de retard de cotisation`}
          >
            Passé {RETARD_BLOCAGE_JOURS} jours de retard, l’accès aux autres sections de
            l’espace membre est automatiquement restreint.
          </Banner>
        </div>
      ) : overdue ? (
        <div className="mb-5">
          <Banner tone="bad" icon={<Clock size={18} />} title="Cotisation en retard">
            Régularisez avant {RETARD_BLOCAGE_JOURS} jours de retard (
            {joursDeRetard(m)}/{RETARD_BLOCAGE_JOURS} jours écoulés).
          </Banner>
        </div>
      ) : null}

      <Card className="overflow-hidden mb-[22px] p-0">
        <Visuel
          src={m.cover}
          alt=""
          seed={m.id}
          className="h-[190px] w-full"
          sizes="(max-width: 1024px) 100vw, 900px"
          icon={m.type === "physique" ? <UserIcon size={26} /> : <Building2 size={26} />}
        />
        <div className="p-[22px]">
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
                  <Pill icon={<UserIcon size={10} />}>Indépendant · personne physique</Pill>
                ) : null}
                <Pill>Membre depuis {fmtDate(m.adhesion, { year: "numeric" })}</Pill>
              </div>
            </div>
          </div>

          <p className="mt-[18px] font-semibold text-[14.5px]">{m.activite}</p>
          <p className="mt-1.5 text-muted text-[14px] leading-relaxed max-w-[70ch]">
            {m.desc}
          </p>

          <NeedsAndInterests member={m} />

          <div className="flex items-center gap-2.5 mt-[22px] mb-3.5">
            <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
            <h2 className="text-[17px] font-semibold m-0">Produits &amp; services</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {m.produits.map((p) => (
              <Card key={p.label} className="p-4 text-center">
                <Visuel
                  src={p.photo}
                  alt={p.label}
                  seed={m.id + p.label}
                  className="aspect-[4/3] mb-2 rounded-[var(--radius-m)] w-full"
                  sizes="(max-width: 768px) 100vw, 260px"
                  iconSize={18}
                />
                <div className="font-semibold text-[13px]">{p.label}</div>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-2.5 mt-[22px] mb-3.5">
            <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
            <h2 className="text-[17px] font-semibold m-0">Contact</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-[12.3px] font-semibold text-muted mb-1.5">
                {m.type === "physique" ? "Contact" : "Représentant"}
              </div>
              <div className="flex items-center gap-2.5">
                <AvatarRond
                  src={user.photo}
                  alt={user.nom}
                  initiales={user.initiales}
                  taille={40}
                  className="bg-accent-soft text-accent-strong"
                />
                <div className="text-[13.6px] font-semibold min-w-0">
                  {user.nom}
                  <br />
                  <span className="font-normal text-muted text-[12.5px]">
                    {user.fonction}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-[12.3px] font-semibold text-muted mb-1.5">Courriel</div>
              <div className="text-[13.6px]">{user.email}</div>
            </div>
            <div>
              <div className="text-[12.3px] font-semibold text-muted mb-1.5">Téléphone</div>
              <div className="text-[13.6px] font-[family-name:var(--font-mono)]">
                {user.tel}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <SectionTitle>Statut d’adhésion</SectionTitle>
      <div className="grid gap-4 mb-[22px] md:grid-cols-3">
        <Stat k="Adhésion" v={<span className="text-[19px]"><StatusPill status={m.statut} /></span>} />
        <Stat
          k="Membre depuis"
          v={<span className="text-[19px]">{fmtDateShort(m.adhesion)}</span>}
        />
        <Stat
          k={m.paiementNote ? "Dernier paiement" : "Prochain renouvellement"}
          v={
            <span className="text-[14px] font-semibold leading-snug">
              {m.paiementNote ?? "10 janvier 2027"}
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
                <Td className="font-[family-name:var(--font-mono)]">{f.numero}</Td>
                <Td className="text-muted">{fmtDateShort(f.date)}</Td>
                <Td>{f.objet}</Td>
                <Td className="font-[family-name:var(--font-mono)]">
                  {fmtMoney(f.montant)}
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
