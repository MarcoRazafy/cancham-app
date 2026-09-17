import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  ShoppingBag,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  Compteur,
  EnTeteAdmin,
  Jauge,
  LienFleche,
  Panneau,
  Vide,
} from "@/components/admin/ui";
import { LigneJournal, ilYa } from "@/components/admin/LigneJournal";
import { LogoMark } from "@/components/domain";
import { AddMemberButton } from "@/components/forms/MemberForms";
import { Saillant, StatusPill } from "@/components/ui";
import { fmtDate, isPast, parseISO, today } from "@/lib/format";
import { FORMULES, fmtMontant, libelleFormule } from "@/lib/membership";
import {
  getEvents,
  getInvoices,
  getMemberStats,
  getMembresATraiter,
  getUnreadTotal,
} from "@/lib/queries";
import {
  getDemandesAchat,
  getFinancesAnnee,
  getJournal,
  getRepartitionFormules,
} from "@/lib/queries-admin";
import { getCurrentUser } from "@/lib/session";
import { situation } from "@/lib/situation";

/** Ordre de traitement : ce qui bloque un membre d'abord, les demandes ensuite. */
const PRIORITE = { en_retard: 0, en_attente: 1, candidature: 2, a_jour: 3 };

export default async function TableauDeBord() {
  const user = await getCurrentUser("admin");
  const annee = today().getFullYear();

  const [
    stats,
    aTraiter,
    events,
    factures,
    finances,
    formules,
    journal,
    nonLus,
    achats,
  ] = await Promise.all([
    getMemberStats(),
    getMembresATraiter(),
    getEvents(),
    getInvoices(),
    getFinancesAnnee(annee),
    getRepartitionFormules(),
    getJournal({ limite: 6 }),
    getUnreadTotal(user.id),
    getDemandesAchat(3),
  ]);

  const aVenir = events.filter((e) => !isPast(e.date)).slice(0, 4);
  const derniers = factures.slice(0, 5);
  const urgences = [...aTraiter].sort(
    (a, b) => PRIORITE[a.statut] - PRIORITE[b.statut],
  );
  const adherents = formules.reduce((n, f) => n + f.n, 0);

  const aujourdhui = today().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <EnTeteAdmin
        surtitre={`Back-office · ${aujourdhui}`}
        titre={
          <>
            Bonjour <Saillant>{user.nom.split(" ")[0]}</Saillant>,
          </>
        }
        actions={<AddMemberButton />}
      >
        L’état de la chambre aujourd’hui : adhésions, cotisations, programme et
        échanges.
      </EnTeteAdmin>

      {/* ==================== Compteurs ==================== */}
      <div className="grid gap-4 mb-5 sm:grid-cols-2 xl:grid-cols-4">
        <Compteur
          icone={<Users size={22} />}
          teinte="vert"
          libelle="Membres à jour"
          valeur={stats.aJour}
          detail={`sur ${stats.total} adhérents`}
          href="/admin/membres?statut=a_jour"
        />
        <Compteur
          icone={<UserPlus size={22} />}
          teinte="bleu"
          libelle="Demandes à examiner"
          valeur={stats.candidatures}
          detail={`${stats.enAttente} en attente de paiement`}
          href="/admin/membres?statut=candidature"
        />
        <Compteur
          icone={<Wallet size={22} />}
          teinte="rouge"
          libelle="Cotisations en retard"
          valeur={stats.enRetard}
          detail="à relancer"
          href="/admin/membres?statut=en_retard"
        />
        <Compteur
          icone={<CheckCircle2 size={22} />}
          teinte="vert"
          libelle={`Encaissé en ${annee}`}
          valeur={
            <span className="text-[22px]">
              {fmtMontant(finances.encaisse.MGA, "MGA")}
            </span>
          }
          detail={
            finances.encaisse.CAD
              ? `+ ${fmtMontant(finances.encaisse.CAD, "CAD")}`
              : `${finances.factures} facture${finances.factures > 1 ? "s" : ""} émise${finances.factures > 1 ? "s" : ""}`
          }
          href={`/admin/paiements?annee=${annee}`}
        />
      </div>

      {/* ==================== À traiter + répartition ==================== */}
      <div className="grid gap-4 mb-5 lg:grid-cols-[1fr_360px] items-start">
        <Panneau
          titre={
            <>
              À <Saillant>traiter</Saillant>
            </>
          }
          sousTitre="Les adhésions qui attendent une décision ou un règlement"
          lien={{ href: "/admin/membres", libelle: "Tous les membres" }}
          teinte="rouge"
          corpsClassName="px-6 pb-3"
        >
          {urgences.length ? (
            <ul className="list-none m-0 p-0">
              {urgences.slice(0, 6).map((m) => {
                const s = situation(m);
                return (
                  <li key={m.id} className="border-t border-line">
                    <Link
                      href={`/admin/membres/${m.id}`}
                      className="flex items-center gap-4 py-3.5 no-underline group"
                    >
                      <span className="hidden sm:block">
                        <LogoMark member={m} size={40} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14.5px] font-semibold text-ink">
                            {m.nom}
                          </span>
                          <StatusPill status={m.statut} />
                        </span>
                        <span
                          className={`block text-[12.8px] mt-0.5 ${s.urgent ? "text-accent font-semibold" : "text-muted"}`}
                        >
                          {s.detail}
                        </span>
                      </span>
                      {s.action ? (
                        <span className="hidden md:inline-flex items-center gap-1 text-[13px] font-semibold text-accent group-hover:underline">
                          {s.action} <ChevronRight size={15} />
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vide icone={<CheckCircle2 size={26} />}>
              Toutes les adhésions sont à jour.
            </Vide>
          )}
        </Panneau>

        <Panneau
          titre="Répartition des adhérents"
          sousTitre={`${adherents} adhésions, candidatures exclues`}
          teinte="degrade"
        >
          <div className="flex flex-col gap-3.5">
            {formules.map((f) => (
              <div key={f.formule}>
                <div className="flex items-baseline justify-between gap-3 text-[13px] mb-1.5">
                  <span className="text-ink">{libelleFormule(f.formule)}</span>
                  <span className="text-muted tabular-nums shrink-0">
                    {f.n}
                  </span>
                </div>
                <Jauge
                  valeur={f.n}
                  max={adherents}
                  teinte={
                    FORMULES[f.formule].devise === "CAD" ? "bleu" : "vert"
                  }
                />
              </div>
            ))}
          </div>
          <p className="text-[12px] text-faint m-0 mt-4">
            En vert les formules en Ariary, en bleu celles en dollars canadiens.
          </p>
        </Panneau>
      </div>

      {/* ==================== Programme + paiements ==================== */}
      <div className="grid gap-4 mb-5 lg:grid-cols-2 items-start">
        <Panneau
          titre="Prochains événements"
          sousTitre="Remplissage des inscriptions"
          lien={{ href: "/admin/evenements", libelle: "Gérer le programme" }}
          teinte="vert"
          corpsClassName="px-6 pb-3"
        >
          {aVenir.length ? (
            <ul className="list-none m-0 p-0">
              {aVenir.map((e) => {
                const d = parseISO(e.date);
                const complet = e.inscrits >= e.cap;
                return (
                  <li key={e.id} className="border-t border-line">
                    <Link
                      href={`/admin/evenements/${e.id}`}
                      className="flex items-center gap-4 py-3.5 no-underline"
                    >
                      <span className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface-2 shrink-0">
                        {e.photo ? (
                          <Image
                            src={e.photo}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : null}
                        <span className="absolute inset-0 bg-[#0f1d2c]/55 text-white flex flex-col items-center justify-center leading-none">
                          <span className="titre text-[18px]">
                            {d.getDate()}
                          </span>
                          <span className="text-[9.5px] font-bold uppercase tracking-wider mt-0.5">
                            {d
                              .toLocaleDateString("fr-FR", { month: "short" })
                              .replace(".", "")}
                          </span>
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-ink truncate">
                          {e.titre}
                        </span>
                        <span className="flex items-center justify-between gap-3 text-[12px] text-muted mt-0.5 mb-1.5">
                          <span className="truncate">
                            {e.lieu} · {e.format}
                          </span>
                          <span
                            className={`tabular-nums shrink-0 ${complet ? "text-accent font-semibold" : ""}`}
                          >
                            {e.inscrits}/{e.cap}
                            {complet ? " · complet" : ""}
                          </span>
                        </span>
                        <Jauge
                          valeur={e.inscrits}
                          max={e.cap}
                          teinte={complet ? "rouge" : "vert"}
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vide icone={<CalendarDays size={26} />}>
              Aucun événement programmé.
            </Vide>
          )}
        </Panneau>

        <Panneau
          titre="Derniers paiements"
          sousTitre={
            finances.enAttente
              ? `${finances.enAttente} facture${finances.enAttente > 1 ? "s" : ""} en attente de règlement en ${annee}`
              : `Aucune facture en attente en ${annee}`
          }
          lien={{ href: "/admin/paiements", libelle: "Toutes les factures" }}
          teinte="bleu"
          corpsClassName="px-6 pb-3"
        >
          {derniers.length ? (
            <ul className="list-none m-0 p-0">
              {derniers.map((f) => (
                <li
                  key={f.id}
                  className="border-t border-line flex items-center gap-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/admin/membres/${f.membreId}`}
                      className="block text-[14px] font-semibold text-ink no-underline hover:text-accent truncate"
                    >
                      {f.membre}
                    </Link>
                    <span className="block text-[12px] text-muted truncate">
                      <Link
                        href={`/admin/paiements/${f.id}`}
                        className="font-[family-name:var(--font-mono)] text-muted no-underline hover:text-accent"
                      >
                        {f.numero}
                      </Link>{" "}
                      · {fmtDate(f.date, { day: "numeric", month: "short" })}
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block text-[14px] font-semibold tabular-nums text-ink">
                      {fmtMontant(f.montant, f.devise)}
                    </span>
                    <StatusPill status={f.statut} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Vide icone={<Wallet size={26} />}>Aucune facture émise.</Vide>
          )}
        </Panneau>
      </div>

      {/* ==================== Activité + raccourcis ==================== */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] items-start">
        <Panneau
          titre={
            <>
              Activité <Saillant ton="vert">récente</Saillant>
            </>
          }
          sousTitre="Les dernières opérations de l’équipe et des membres"
          lien={{ href: "/admin/journal", libelle: "Tout le journal" }}
          teinte="degrade"
          corpsClassName="px-6 pb-3"
        >
          {journal.entrees.length ? (
            <div>
              {journal.entrees.map((e) => (
                <LigneJournal key={e.id} entree={e} compacte />
              ))}
            </div>
          ) : (
            <Vide>Aucune opération enregistrée pour l’instant.</Vide>
          )}
        </Panneau>

        <div className="flex flex-col gap-4">
          <Compteur
            icone={<MessageSquare size={22} />}
            teinte="bleu"
            libelle="Messagerie"
            valeur={nonLus}
            detail={
              nonLus
                ? `message${nonLus > 1 ? "s" : ""} non lu${nonLus > 1 ? "s" : ""}`
                : "Tout est lu"
            }
            href="/admin/messagerie"
          />

          <Panneau
            titre="Demandes d’achat"
            sousTitre="Ressources payantes demandées par les membres"
            teinte="rouge"
            corpsClassName="px-6 pb-5"
          >
            {achats.length ? (
              <ul className="list-none m-0 p-0 flex flex-col gap-3">
                {achats.map((a) => (
                  <li key={a.id} className="flex gap-3 items-start">
                    <span className="w-9 h-9 rounded-lg bg-[#14263a] text-white flex items-center justify-center shrink-0">
                      <ShoppingBag size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ink">
                        {a.detail}
                      </span>
                      <span className="block text-[11.5px] text-faint">
                        {a.acteur} · {ilYa(a.date)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted m-0">
                Aucune demande pour l’instant.
              </p>
            )}
            <div className="mt-4">
              <LienFleche href="/admin/ressources">
                Gérer les ressources
              </LienFleche>
            </div>
          </Panneau>

          <Link
            href="/membre"
            className="inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-muted no-underline hover:text-accent"
          >
            Voir l’espace comme un membre <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
