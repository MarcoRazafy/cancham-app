import { notFound } from "next/navigation";
import { ArrowLeft, Building2, User as UserIcon } from "lucide-react";
import { LogoMark, NeedsAndInterests, PhotoPlaceholder } from "@/components/domain";
import { BtnLink, Card, Pill, SectionTitle, StatusPill } from "@/components/ui";
import {
  ApproveButton,
  DeleteMemberButton,
  RegisterPaymentButton,
  RejectButton,
  ReminderButton,
} from "@/components/forms/MemberForms";
import { COTISATION_ANNUELLE } from "@/lib/membership";
import { getMember } from "@/lib/queries";
import { fmtDate } from "@/lib/format";
import { joursDeRetard, retardBloque, RETARD_BLOCAGE_JOURS } from "@/lib/membership";

export default async function AdminMembreDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await getMember(id);
  if (!m) notFound();

  return (
    <>
      <div className="mb-4">
        <BtnLink href="/admin/membres" variant="ghost" sm>
          <ArrowLeft size={14} /> Retour à la liste
        </BtnLink>
      </div>

      <div className="grid gap-4 items-start lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden p-0">
          <PhotoPlaceholder
            seed={m.id}
            className="h-[150px] w-full"
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
                    <Pill icon={<UserIcon size={10} />}>Personne physique</Pill>
                  ) : null}
                  <Pill>Membre depuis {fmtDate(m.adhesion, { year: "numeric" })}</Pill>
                </div>
              </div>
            </div>

            <p className="mt-5 font-semibold text-[14.5px]">{m.activite}</p>
            <p className="mt-1.5 text-muted text-[14px] leading-relaxed max-w-[70ch]">
              {m.desc}
            </p>

            {m.motivation ? (
              <>
                <div className="flex items-center gap-2.5 mt-[22px] mb-3.5">
                  <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
                  <h2 className="text-[17px] font-semibold m-0">
                    Dossier de candidature
                  </h2>
                </div>
                <div className="grid gap-4 mb-3.5 md:grid-cols-3">
                  <Field label="Statut juridique" value={m.statutJuridique} />
                  <Field label="Pays d’implantation" value={m.pays} />
                  <Field label="Site web" value={m.siteweb} />
                </div>
                <div>
                  <div className="text-[12.3px] font-semibold text-muted mb-1.5">
                    Motivation à rejoindre CanCham
                  </div>
                  <div className="text-[13.4px] text-muted leading-relaxed">
                    {m.motivation}
                  </div>
                </div>
              </>
            ) : null}

            <NeedsAndInterests member={m} />
          </div>
        </Card>

        <Card className="p-[22px]">
          <SectionTitle>Adhésion &amp; cotisation</SectionTitle>
          <div className="mb-4">
            <StatusPill status={m.statut} />
          </div>

          {m.statut === "en_retard" ? (
            <p className="text-[12.8px] text-muted mb-4">
              {joursDeRetard(m)} jours de retard.{" "}
              {retardBloque(m)
                ? `Accès restreint automatiquement au-delà de ${RETARD_BLOCAGE_JOURS} jours.`
                : `Blocage automatique dans ${RETARD_BLOCAGE_JOURS - joursDeRetard(m)} jours.`}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            {m.statut === "candidature" ? (
              <>
                <ApproveButton memberId={m.id} />
                <RejectButton memberId={m.id} nom={m.nom} />
              </>
            ) : (
              <RegisterPaymentButton
                memberId={m.id}
                premier={!m.paiementNote}
                nom={m.nom}
                montantParDefaut={COTISATION_ANNUELLE}
              />
            )}
            <ReminderButton memberId={m.id} />
            <DeleteMemberButton memberId={m.id} nom={m.nom} />
          </div>

          {m.paiementNote ? (
            <p className="text-[11.5px] text-faint mt-4">{m.paiementNote}</p>
          ) : null}
        </Card>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[12.3px] font-semibold text-muted mb-1.5">{label}</div>
      <div className="text-[13.6px]">{value ?? "—"}</div>
    </div>
  );
}
