import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Globe,
  User as UserIcon,
} from "lucide-react";
import { Jauge, LienFleche, Panneau, Vide } from "@/components/admin/ui";
import { LigneJournal } from "@/components/admin/LigneJournal";
import { Agrandir } from "@/components/Agrandir";
import { CarrouselSection } from "@/components/CarrouselSection";
import { CarteService } from "@/components/CarteService";
import {
  ListeContacts,
  LogoMark,
  NeedsAndInterests,
  Visuel,
} from "@/components/domain";
import {
  ApproveButton,
  DeleteMemberButton,
  RegisterPaymentButton,
  RejectButton,
  ReminderButton,
} from "@/components/forms/MemberForms";
import { BoutonMessage } from "@/components/forms/MessageMembre";
import { TexteLie } from "@/components/TexteLie";
import { Card, Pill, Saillant, StatusPill } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { affichageSite } from "@/lib/liens";
import {
  RETARD_BLOCAGE_JOURS,
  fmtCotisation,
  fmtMontant,
  joursDeRetard,
  libelleFormule,
} from "@/lib/membership";
import { getContacts, getInvoices, getMember } from "@/lib/queries";
import { getHistoriqueMembre } from "@/lib/queries-admin";
import { situation } from "@/lib/situation";

export default async function AdminMembreDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await getMember(id);
  if (!m) notFound();

  const [contacts, factures, historique] = await Promise.all([
    getContacts(m.id),
    getInvoices(m.id),
    getHistoriqueMembre(m.id),
  ]);

  const s = situation(m);
  const dansAnnuaire = m.statut === "a_jour" || m.statut === "en_retard";
  const jours = joursDeRetard(m);
  const dossier = m.motivation || m.statutJuridique || m.pays;

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/membres"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent"
        >
          <ArrowLeft size={14} /> Tous les membres
        </Link>
      </div>

      {/* ==================== Identité ==================== */}
      <Card className="overflow-hidden p-0 mb-4">
        <Agrandir src={m.cover} alt={`Couverture de ${m.nom}`} legende={m.nom}>
          <Visuel
            src={m.cover}
            alt=""
            seed={m.id}
            className="h-[170px] w-full"
            sizes="(max-width: 1240px) 100vw, 1200px"
            icon={
              m.type === "physique" ? (
                <UserIcon size={26} />
              ) : (
                <Building2 size={26} />
              )
            }
          />
        </Agrandir>
        <div className="px-6 py-5 flex gap-5 flex-wrap items-start justify-between">
          <div className="flex gap-4 min-w-0">
            <LogoMark member={m} size={64} />
            <div className="min-w-0">
              <h1 className="m-0 text-[clamp(22px,2.6vw,28px)]">{m.nom}</h1>
              <div className="text-muted text-[13.8px] mt-0.5">
                {m.secteur} · {m.ville}
                {m.pays ? ` · ${m.pays}` : ""}
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
                <Pill>{libelleFormule(m.formule)}</Pill>
                {m.type === "physique" ? (
                  <Pill icon={<UserIcon size={10} />}>Indépendant</Pill>
                ) : null}
                <Pill>
                  Membre depuis{" "}
                  {fmtDate(m.adhesion, { month: "long", year: "numeric" })}
                </Pill>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 flex-wrap">
            <BoutonMessage memberId={m.id} space="admin" />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 items-start lg:grid-cols-[1fr_360px]">
        {/* ==================== Colonne principale ==================== */}
        <div className="flex flex-col gap-4 min-w-0">
          <Panneau titre="Présentation" teinte="degrade">
            <p className="m-0 font-semibold text-[14.5px]">
              <TexteLie texte={m.activite} />
            </p>
            <p className="m-0 mt-1.5 text-muted text-[14px] leading-relaxed max-w-[75ch] whitespace-pre-line">
              <TexteLie texte={m.desc} />
            </p>
            <NeedsAndInterests member={m} />
            {dansAnnuaire ? (
              <div className="mt-5">
                <LienFleche href={`/membre/annuaire/${m.id}`}>
                  Voir la fiche telle que la voient les membres
                </LienFleche>
              </div>
            ) : null}
          </Panneau>

          {dossier ? (
            <Panneau
              titre={
                <>
                  Dossier de <Saillant ton="vert">candidature</Saillant>
                </>
              }
              sousTitre="Les réponses données à l’inscription"
              teinte="vert"
            >
              <div className="grid gap-4 mb-4 sm:grid-cols-3">
                <Donnee libelle="Statut juridique" valeur={m.statutJuridique} />
                <Donnee libelle="Pays d’implantation" valeur={m.pays} />
                <Donnee
                  libelle="Formule demandée"
                  valeur={`${libelleFormule(m.formule)} · ${fmtCotisation(m.formule)}`}
                />
              </div>
              {m.motivation ? (
                <>
                  <div className="text-[12.3px] font-semibold text-muted mb-1.5">
                    Motivation à rejoindre CanCham
                  </div>
                  <p className="m-0 text-[13.6px] text-ink leading-relaxed whitespace-pre-line">
                    <TexteLie texte={m.motivation} />
                  </p>
                </>
              ) : null}
            </Panneau>
          ) : null}

          {/* La fiche appartient au membre : l'équipe la consulte, elle ne la
              modifie pas. Présentation, contacts et offres se tiennent depuis
              « Mon entreprise ». */}
          <Card className="carte-filet filet-fixe filet-bleu px-6 pb-6">
            {contacts.length ? (
              <ListeContacts
                contacts={contacts}
                titre={m.type === "physique" ? "Contact" : "Contacts"}
                intro="Les personnes déclarées par le membre. Le contact principal est joint en premier."
              />
            ) : (
              <div className="pt-5">
                <h2 className="text-[18px] m-0">Contacts</h2>
                <p className="m-0 mt-2 text-[13.4px] text-muted">
                  Aucun contact déclaré par ce membre.
                </p>
              </div>
            )}
          </Card>

          <Panneau
            titre="Produits & services"
            sousTitre={`${m.produits.length} offre${m.produits.length > 1 ? "s" : ""} au catalogue du membre`}
            teinte="rouge"
          >
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
              <p className="m-0 text-[13.4px] text-muted">
                Le membre n’a encore publié aucune offre.
              </p>
            )}
          </Panneau>
        </div>

        {/* ==================== Colonne latérale ==================== */}
        <div className="flex flex-col gap-4">
          <Panneau
            titre="Adhésion & cotisation"
            teinte={s.urgent ? "rouge" : "vert"}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill status={m.statut} />
            </div>
            <p
              className={`m-0 mt-2 text-[13px] ${s.urgent ? "text-accent font-semibold" : "text-muted"}`}
            >
              {s.detail}
            </p>

            {m.statut === "en_retard" ? (
              <div className="mt-3">
                <Jauge
                  valeur={Math.min(jours, RETARD_BLOCAGE_JOURS)}
                  max={RETARD_BLOCAGE_JOURS}
                  teinte="rouge"
                />
                <p className="m-0 mt-1.5 text-[11.5px] text-faint">
                  L’accès se restreint seul après {RETARD_BLOCAGE_JOURS} jours
                  de retard.
                </p>
              </div>
            ) : null}

            <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
              <dt className="text-muted">Formule</dt>
              <dd className="m-0 text-ink text-right">
                {libelleFormule(m.formule)}
              </dd>
              <dt className="text-muted">Cotisation</dt>
              <dd className="m-0 text-ink text-right font-semibold tabular-nums">
                {fmtCotisation(m.formule)} / an
              </dd>
              {m.paiementNote ? (
                <>
                  <dt className="text-muted">Dernier règlement</dt>
                  <dd className="m-0 text-ink text-right">
                    {m.paiementNote.replace(/^Payé par /, "")}
                  </dd>
                </>
              ) : null}
            </dl>

            <div className="flex flex-col gap-2 mt-5">
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
                  formule={m.formule}
                />
              )}
              {m.statut === "en_retard" || m.statut === "en_attente" ? (
                <ReminderButton memberId={m.id} />
              ) : null}
            </div>
          </Panneau>

          <Panneau
            titre="Factures"
            teinte="bleu"
            lien={
              factures.length
                ? {
                    href: `/admin/paiements?q=${encodeURIComponent(m.nom)}`,
                    libelle: "Toutes",
                  }
                : undefined
            }
            corpsClassName="px-6 pb-4"
          >
            {factures.length ? (
              <ul className="list-none m-0 p-0">
                {factures.slice(0, 5).map((f) => (
                  <li key={f.id} className="border-t border-line">
                    <Link
                      href={`/admin/paiements/${f.id}`}
                      className="flex items-center gap-3 py-2.5 no-underline group"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-ink truncate group-hover:text-accent">
                          {f.objet}
                        </span>
                        <span className="block text-[11.5px] text-muted font-[family-name:var(--font-mono)]">
                          {f.numero} ·{" "}
                          {fmtDate(f.date, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="block text-[13px] font-semibold tabular-nums text-ink">
                          {fmtMontant(f.montant, f.devise)}
                        </span>
                        <StatusPill status={f.statut} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[13px] text-muted">
                Aucune facture émise pour ce membre.
              </p>
            )}
          </Panneau>

          <Panneau
            titre="Historique"
            teinte="degrade"
            corpsClassName="px-6 pb-3"
          >
            {historique.length ? (
              historique
                .slice(0, 8)
                .map((e) => <LigneJournal key={e.id} entree={e} compacte />)
            ) : (
              <Vide>Aucune opération enregistrée.</Vide>
            )}
          </Panneau>

          <Card className="p-5 border-dashed">
            <div className="surtitre text-faint mb-2">Zone sensible</div>
            <p className="m-0 mb-3 text-[12.5px] text-muted">
              La suppression retire le membre, ses contacts et ses inscriptions.
              Elle est refusée tant qu’il a des factures.
            </p>
            <DeleteMemberButton memberId={m.id} nom={m.nom} />
          </Card>

          {dansAnnuaire ? (
            <Link
              href={`/membre/annuaire/${m.id}`}
              className="inline-flex items-center justify-center gap-1.5 text-[12.8px] font-semibold text-muted no-underline hover:text-accent"
            >
              Fiche publique dans l’annuaire <ExternalLink size={13} />
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Donnee({ libelle, valeur }: { libelle: string; valeur?: string }) {
  return (
    <div>
      <div className="text-[12.3px] font-semibold text-muted mb-1">
        {libelle}
      </div>
      <div className="text-[13.6px] text-ink">{valeur || "—"}</div>
    </div>
  );
}
