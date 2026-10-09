import type { Metadata } from "next";
import { TITRE_GRAS } from "@/components/public/CadreVitrine";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import { CodeAccueil } from "@/components/CodeAccueil";
import { PaiementPublic } from "@/components/public/PaiementPublic";
import {
  reglementPublicEcarte,
  reglementPublicOuvert,
  suivrePaiementPublic,
} from "@/lib/paiements";
import {
  COORDONNEES_VIDES,
  getCoordonneesPaiement,
  modesPublics,
} from "@/lib/reglements";
import { marchandAffiche } from "@/lib/vanillapay";
import { plageHoraire } from "@/lib/agenda";
import { fmtDate } from "@/lib/format";
import { matriceQr } from "@/lib/qr";
import { codeInscription, extraireCode } from "@/lib/codes-accueil";
import { getBilletsPublics, getEvent } from "@/lib/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function BilletsPublics({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string; ref?: string; moyen?: string }>;
}) {
  const [{ id }, { code = "", ref = "", moyen = "" }] = await Promise.all([
    params,
    searchParams,
  ]);
  const base = codeInscription(extraireCode(code));
  const paiement = ref ? await suivrePaiementPublic(ref, base) : null;
  const [e, billets] = await Promise.all([
    getEvent(id),
    getBilletsPublics(id, code),
  ]);
  if (!e || !billets.length) notFound();

  const quand = [fmtDate(e.date), plageHoraire(e.debut, e.fin)]
    .filter(Boolean)
    .join(" · ");
  const plusieurs = billets.length > 1;
  const enAttente = billets.some((b) => b.statut === "a_valider");
  const aRegler =
    e.prixPublic * billets.filter((b) => b.statut === "a_valider").length;
  const [modes, reglement, ecarte, coordonnees] =
    enAttente && e.prixPublic > 0
      ? await Promise.all([
          modesPublics(aRegler),
          reglementPublicOuvert(e.id, base),
          reglementPublicEcarte(e.id, base),
          getCoordonneesPaiement(),
        ])
      : [[], null, null, COORDONNEES_VIDES];

  return (
    <main className="max-w-[760px] mx-auto px-5 py-10 w-full">
      <Link
        href={`/evenements/${e.id}`}
        className="inline-flex items-center gap-2 text-[13.5px] text-muted hover:text-ink no-underline mb-6"
      >
        <ArrowLeft size={15} /> L’événement
      </Link>

      <div className="rounded-2xl border border-line bg-surface shadow-[var(--shadow)] p-6 md:p-8">
        {enAttente ? (
          <span className="inline-flex items-center gap-2 surtitre text-warn">
            <Clock size={15} /> Inscription en attente de validation
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 surtitre text-marque-vert">
            <CheckCircle2 size={15} /> Inscription confirmée
          </span>
        )}
        <h1
          className={`${TITRE_GRAS} text-[clamp(24px,3.4vw,32px)] m-0 mt-2.5`}
        >
          {e.titre}
        </h1>
        <div className="flex gap-x-5 gap-y-2 flex-wrap text-[14px] text-muted mt-3">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={15} /> {quand}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin size={15} /> {e.lieu}
          </span>
        </div>

        <p className="m-0 mt-5 text-[14.5px] text-muted leading-relaxed">
          {enAttente
            ? `${billets.length} inscription${plusieurs ? "s" : ""} enregistrée${plusieurs ? "s" : ""} pour ${billets[0].entreprise}. Vos QR codes partent par e-mail dès le règlement confirmé.`
            : plusieurs
              ? `${billets.length} participants pour ${billets[0].entreprise}. Chacun présente son QR code à l’accueil.`
              : `Présentez ce QR code à l’accueil : il vous pointe présent.`}{" "}
          Un e-mail est parti à <b className="text-ink">{billets[0].email}</b>,
          avec le lien de cette page.
        </p>
        {paiement === "en_cours" && enAttente ? (
          <p className="m-0 mt-4 rounded-[var(--radius-s)] bg-surface-2 px-3.5 py-3 text-[13.5px] text-muted">
            <b className="text-ink">Paiement en cours de confirmation.</b> Cela
            prend parfois quelques minutes : rechargez cette page. Si vous
            n’êtes pas allé au bout, vous pouvez recommencer ci-dessous.
          </p>
        ) : paiement === "echouee" && enAttente ? (
          <p className="m-0 mt-4 rounded-[var(--radius-s)] bg-warn-soft px-3.5 py-3 text-[13.5px] text-warn">
            <b>Paiement refusé.</b> Rien n’a été débité : vous pouvez
            recommencer, ou choisir un autre moyen ci-dessous.
          </p>
        ) : null}
        {e.prixPublic > 0 && enAttente ? (
          <PaiementPublic
            eventId={e.id}
            code={base}
            montant={aRegler}
            modes={modes}
            reglement={
              reglement &&
              reglement.mode !== "carte" &&
              (moyen !== "choix" || reglement.statut === "annonce")
                ? reglement
                : null
            }
            ecarte={reglement ? null : (ecarte?.reference ?? null)}
            coordonnees={coordonnees}
            marchand={marchandAffiche()}
            page={`/evenements/${e.id}/billet?${new URLSearchParams({ code: base })}`}
          />
        ) : null}

        {enAttente ? (
          <ul className="list-none m-0 mt-7 p-0 border-t border-line">
            {billets.map((b) => (
              <li
                key={b.code}
                className="flex items-center justify-between gap-3 py-3 border-b border-line text-[14px]"
              >
                <span className="text-ink font-semibold">{b.nom}</span>
                <span className="text-[12.5px] text-faint">Billet à venir</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-6 mt-7 sm:grid-cols-2">
            {billets.map((b) => (
              <div key={b.code}>
                <div className="mb-1 text-[14px] font-semibold text-ink">
                  {b.nom}
                </div>
                <CodeAccueil
                  code={b.code}
                  {...matriceQr(b.code)}
                  billet={{
                    titre: e.titre,
                    quand,
                    lieu: e.lieu,
                    participant: [b.nom, b.entreprise]
                      .filter(Boolean)
                      .join(" · "),
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
