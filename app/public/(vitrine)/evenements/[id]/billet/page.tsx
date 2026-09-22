import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin } from "lucide-react";
import { CodeAccueil } from "@/components/CodeAccueil";
import { plageHoraire } from "@/lib/agenda";
import { fmtDate, fmtMoney } from "@/lib/format";
import { matriceQr } from "@/lib/qr";
import { getBilletsPublics, getEvent } from "@/lib/queries";

// Des noms et une adresse derrière une clé : rien à indexer.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Les billets d'une inscription faite depuis la vitrine : un QR code par
 * participant, à présenter à l'accueil ou à télécharger. On y arrive juste
 * après l'inscription, puis par le lien de l'e-mail de confirmation.
 */
export default async function BilletsPublics({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const [{ id }, { code = "" }] = await Promise.all([params, searchParams]);
  const [e, billets] = await Promise.all([
    getEvent(id),
    getBilletsPublics(id, code),
  ]);
  if (!e || !billets.length) notFound();

  const quand = [fmtDate(e.date), plageHoraire(e.debut, e.fin)]
    .filter(Boolean)
    .join(" · ");
  const plusieurs = billets.length > 1;

  return (
    <main className="max-w-[760px] mx-auto px-5 py-10 w-full">
      <Link
        href={`/public/evenements/${e.id}`}
        className="inline-flex items-center gap-2 text-[13.5px] text-muted hover:text-ink no-underline mb-6"
      >
        <ArrowLeft size={15} /> L’événement
      </Link>

      <div className="rounded-2xl border border-line bg-surface shadow-[var(--shadow)] p-6 md:p-8">
        <span className="inline-flex items-center gap-2 surtitre text-marque-vert">
          <CheckCircle2 size={15} /> Inscription confirmée
        </span>
        <h1 className="titre text-[clamp(24px,3.4vw,32px)] m-0 mt-2.5">
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
          {plusieurs
            ? `${billets.length} participants pour ${billets[0].entreprise}. Chacun présente son QR code à l’accueil.`
            : `Présentez ce QR code à l’accueil : il vous pointe présent.`}{" "}
          Un e-mail de confirmation est parti à{" "}
          <b className="text-ink">{billets[0].email}</b>, avec le lien de cette
          page.
        </p>
        {e.payant ? (
          <p className="m-0 mt-4 text-[13.5px] text-warn bg-warn-soft rounded-[var(--radius-s)] px-3.5 py-3">
            <b>
              Événement payant · {fmtMoney(e.prix * billets.length)} à régler
            </b>
            <br />
            Le règlement se fait auprès de l’équipe CanCham, avant l’événement.
          </p>
        ) : null}

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
      </div>
    </main>
  );
}
