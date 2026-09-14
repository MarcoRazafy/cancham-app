import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCheck, CreditCard, MapPin, Users } from "lucide-react";
import { PhotoPlaceholder } from "@/components/domain";
import { Banner, BtnLink, Card, Kicker, Stat } from "@/components/ui";
import {
  CancelRegistrationButton,
  RegisterButton,
} from "@/components/forms/EventForms";
import { getEvent, getRegistration } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { fmtDate, fmtMoney, isPast } from "@/lib/format";

export default async function EvenementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await getEvent(id);
  if (!e) notFound();

  const user = await getCurrentUser("membre");
  const reg = await getRegistration(e.id, user.memberId);
  const past = isPast(e.date);

  return (
    <>
      <div className="mb-4">
        <BtnLink href="/membre/evenements" variant="ghost" sm>
          <ArrowLeft size={14} /> Retour aux événements
        </BtnLink>
      </div>

      <PhotoPlaceholder
        seed={e.id}
        className="h-[220px] w-full rounded-[var(--radius-l)] mb-4"
        icon={<CalendarDays size={34} />}
      />

      <div className="grid gap-4 items-start lg:grid-cols-3">
        <Card className="p-[22px] lg:col-span-2">
          <Kicker>{e.format}</Kicker>
          <h1 className="mt-1.5 mb-2.5 text-[24px]">{e.titre}</h1>
          <div className="flex gap-3 flex-wrap text-[13.4px] text-muted mb-4">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} /> {fmtDate(e.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} /> {e.lieu}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} /> {e.inscrits}/{e.cap} inscrits
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CreditCard size={15} /> {e.payant ? fmtMoney(e.prix) : "Gratuit"}
            </span>
          </div>
          <p className="text-muted text-[14px] leading-relaxed">{e.desc}</p>
        </Card>

        <Card className="p-[22px]">
          <div className="flex flex-col gap-1.5 mb-3.5">
            <div className="text-[11.5px] uppercase tracking-[0.08em] text-faint font-semibold">
              Tarif
            </div>
            <div className="font-[family-name:var(--font-display)] text-[22px] font-semibold">
              {e.payant ? fmtMoney(e.prix) : "Gratuit"}
            </div>
            <div className="text-xs text-muted">
              {e.payant ? "Réglable sur place" : "Ouvert à tous les membres"}
            </div>
          </div>

          {past ? (
            <div className="text-xs text-muted">
              Cet événement a déjà eu lieu le {fmtDate(e.date)}.
            </div>
          ) : reg ? (
            <>
              <Banner tone="ok" icon={<CheckCheck size={18} />} title="Inscription confirmée">
                Code {reg.code}
              </Banner>
              <div className="mt-3.5">
                <CancelRegistrationButton eventId={e.id} />
              </div>
              <div className="mt-3.5 p-4 bg-surface-2 rounded-[var(--radius-m)] flex flex-col items-center gap-2.5">
                <div className="bg-white p-2.5 rounded-lg border border-line">
                  <QrPlaceholder code={reg.code} />
                </div>
                <div className="font-[family-name:var(--font-mono)] text-[13px] font-bold tracking-wide">
                  {reg.code}
                </div>
                <div className="text-[11.5px] text-faint text-center">
                  Présentez ce code à l’accueil pour l’enregistrement
                </div>
              </div>
            </>
          ) : (
            <>
              <Stat k="Places restantes" v={e.cap - e.inscrits} />
              <div className="mt-3.5">
                {e.cap - e.inscrits > 0 ? (
                  <RegisterButton
                    event={e}
                    libelle="S’inscrire"
                    nom={user.nom}
                    email={user.email}
                    tel={user.tel}
                  />
                ) : (
                  <p className="text-[13px] text-muted m-0 text-center">
                    Événement complet.
                  </p>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}

/**
 * Aperçu de QR non fonctionnel.
 *
 * Le prototype dessinait un motif aléatoire en canvas, qui n'encodait rien. On
 * garde ici la même honnêteté visuelle : c'est un placeholder, pas un vrai code.
 * Le passage à `qrcode.react` viendra avec le check-in réel.
 */
function QrPlaceholder({ code }: { code: string }) {
  const size = 21;
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  const next = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 4294967295;
  };
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    const finder =
      (x < 7 && y < 7) || (x > size - 8 && y < 7) || (x < 7 && y > size - 8);
    cells.push(finder ? false : next() > 0.56);
  }
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${size}, 6px)`, width: size * 6 }}
      aria-label={`Aperçu du code ${code}`}
    >
      {cells.map((on, i) => (
        <div key={i} style={{ width: 6, height: 6, background: on ? "#0F1D2C" : "#fff" }} />
      ))}
    </div>
  );
}
