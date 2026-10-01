import { notFound } from "next/navigation";
import { FlaskConical, Smartphone } from "lucide-react";
import { simulerIssue } from "@/lib/actions/bac-a-sable";
import { prisma } from "@/lib/db";
import { fmtMontant } from "@/lib/membership";
import { MODES } from "@/lib/modes-reglement";
import { simulateurActif } from "@/lib/vanillapay";

/**
 * Simulateur Vanilla Pay — l'écran de paiement.
 *
 * Tient lieu, en local, de la page du prestataire et de l'écran du
 * téléphone : on y voit la demande de confirmation telle que l'opérateur la
 * présente, et l'on confirme ou l'on refuse. Aucun argent ne change de main,
 * et la page le dit en toutes lettres. En production, elle n'existe pas.
 */
export default async function PageSimulateur({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; retour?: string }>;
}) {
  if (!simulateurActif()) notFound();
  // Comme chez le prestataire, le lien de paiement porte un `id`.
  const { id = "", retour = "" } = await searchParams;
  const p = await prisma.paiement.findUnique({
    where: { reference: id },
    select: {
      reference: true,
      montant: true,
      devise: true,
      mode: true,
      statut: true,
      detail: true,
      invoice: { select: { objet: true, numero: true } },
    },
  });
  if (!p) notFound();

  const detail = (
    p.detail && typeof p.detail === "object" && !Array.isArray(p.detail)
      ? p.detail
      : {}
  ) as Record<string, unknown>;
  const telephone =
    typeof detail.telephone === "string" ? detail.telephone : null;
  const carte = p.mode === "carte";
  const operateur = MODES[p.mode].titre;
  const somme = fmtMontant(p.montant, p.devise);

  return (
    <main className="marque min-h-screen bg-[#e9edf2] px-4 py-10 text-[#0f1d2c]">
      <div className="mx-auto max-w-[440px]">
        <p className="m-0 mb-4 flex items-center justify-center gap-2 rounded-full bg-[#fff3cd] px-4 py-2 text-center text-[13px] font-semibold text-[#7a4b00]">
          <FlaskConical size={15} aria-hidden />
          Simulateur de paiement — aucun argent réel
        </p>

        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_-18px_rgba(15,29,44,0.4)]">
          <div className="bg-[#1e2d6b] px-6 py-5 text-white">
            <div className="text-[12px] uppercase tracking-[0.12em] text-white/70">
              Paiement pour
            </div>
            <div className="mt-1 text-[17px] font-bold">CanCham Madagascar</div>
            <div className="mt-3 text-[30px] font-bold leading-none tabular-nums">
              {somme}
            </div>
            <div className="mt-1.5 text-[13px] text-white/80">
              {p.invoice
                ? `${p.invoice.objet} · facture ${p.invoice.numero}`
                : "Règlement"}
            </div>
          </div>

          <div className="px-6 py-6">
            {p.statut !== "en_cours" ? (
              <p className="m-0 text-[14.5px]">
                Ce paiement est déjà {p.statut === "reussie" ? "confirmé" : "clos"}.
              </p>
            ) : (
              <>
                <div className="flex items-start gap-3 rounded-xl bg-[#f4f6f9] p-4">
                  <Smartphone size={22} className="mt-0.5 shrink-0" aria-hidden />
                  <div className="text-[14px] leading-relaxed">
                    {carte ? (
                      <>
                        <b>Page de saisie de la carte.</b> En production,
                        Vanilla Pay demande ici le numéro, l’expiration et le
                        code de sécurité.
                      </>
                    ) : (
                      <>
                        <b>Écran de votre téléphone.</b> {operateur} vous
                        demande de confirmer un paiement de <b>{somme}</b> à
                        CanCham Madagascar
                        {telephone ? ` depuis le ${telephone}` : ""}. En
                        production, vous saisissez votre code secret sur le
                        téléphone — jamais sur une page web.
                      </>
                    )}
                  </div>
                </div>

                <form action={simulerIssue} className="mt-5">
                  <input type="hidden" name="reference" value={p.reference} />
                  <input type="hidden" name="retour" value={retour} />
                  {carte ? null : (
                    <label className="block text-[13px] font-semibold">
                      Code secret {operateur} (simulation, non vérifié)
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        autoComplete="off"
                        className="mt-1.5 block w-full rounded-lg border border-[#c9d2dc] px-3 py-2.5 text-[18px] tracking-[0.4em]"
                        placeholder="••••"
                      />
                    </label>
                  )}
                  <div className="mt-5 flex flex-col gap-2.5">
                    <button
                      type="submit"
                      name="issue"
                      value="reussi"
                      className="h-12 cursor-pointer rounded-lg border-0 bg-[#007140] text-[15px] font-bold text-white hover:bg-[#005c34]"
                    >
                      Confirmer le paiement de {somme}
                    </button>
                    <button
                      type="submit"
                      name="issue"
                      value="echoue"
                      className="h-12 cursor-pointer rounded-lg border border-[#c9d2dc] bg-white text-[15px] font-semibold text-[#0f1d2c] hover:bg-[#f4f6f9]"
                    >
                      Refuser
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <p className="m-0 mt-4 text-center text-[12.5px] text-[#4f6072]">
          Référence {p.reference}. Ce simulateur remplace le prestataire tant
          que la chambre n’a pas ses accès Vanilla Pay ; il n’existe pas en
          production.
        </p>
      </div>
    </main>
  );
}
