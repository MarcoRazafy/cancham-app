import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Lock,
} from "lucide-react";
import { AdresseFacturation } from "@/components/paiement/AdresseFacturation";
import { BoutonMarque } from "@/components/paiement/BoutonMarque";
import { payerParCarte } from "@/lib/actions/paiements";
import { fmtMontant, type Devise } from "@/lib/membership";

/**
 * Le paiement par carte, d'après la maquette : à gauche, en bleu nuit, ce
 * qui est réglé et combien ; à droite, sur blanc, ce qu'il faut remplir.
 *
 * La carte elle-même ne se saisit jamais ici. Le membre donne le titulaire
 * et l'adresse de facturation, puis part sur la page sécurisée du
 * prestataire — la CanCham ne voit ni ne garde aucun numéro. L'écran le dit
 * avant qu'on ne clique, pas après.
 *
 * Les couleurs sont celles de la CanCham et non d'une marque tierce : la
 * carte n'a pas d'opérateur, c'est la chambre qui encaisse.
 */
export function TunnelCarte({
  reglementId,
  montant,
  devise,
  objet,
  numeroFacture,
  email,
  titulaire,
  adresse,
  statut,
  raccorde,
  retour,
}: {
  reglementId: string;
  montant: number;
  devise: Devise;
  objet: string;
  numeroFacture: string | null;
  email: string;
  /** Proposé d'office : le nom de qui règle, ou celui déjà saisi. */
  titulaire: string;
  /** Proposée d'office : la ville et le pays de l'entreprise. */
  adresse: string;
  statut: string;
  /** Vanilla Pay est-il branché ? Sans lui, rien ne part. */
  raccorde: boolean;
  retour: string;
}) {
  const somme = fmtMontant(montant, devise);
  const chiffre = montant.toLocaleString("fr-FR");
  const code = devise === "CAD" ? "CAD" : "MGA";
  const encaisse = statut === "reussie";

  return (
    <div
      style={
        {
          "--pf-bouton": "var(--accent)",
          "--pf-sur-bouton": "#ffffff",
          "--pf-bouton-survol": "var(--accent-strong)",
        } as CSSProperties
      }
      className="grid overflow-hidden rounded-[var(--radius-l)] border border-line bg-surface lg:grid-cols-2"
    >
      {/* ---------- Ce qui est réglé ---------- */}
      <aside className="relative bg-[var(--marque-nuit)] px-6 py-9 text-white sm:px-10 lg:py-14">
        {/* Un halo rouge, en haut à gauche : la couleur de la chambre. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(200,16,46,0.30),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-[340px]">
          <div className="flex items-center gap-3">
            <Link
              href={retour}
              aria-label="Choisir un autre moyen de paiement"
              className="-ml-2.5 flex h-11 w-11 items-center justify-center rounded-full text-white/80 no-underline transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft size={20} />
            </Link>
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white">
              <Image
                src="/marque/logo-vertical.png"
                alt=""
                width={760}
                height={547}
                className="h-7 w-auto object-contain"
              />
            </span>
            <span className="text-[15px] font-bold">CanCham Madagascar</span>
          </div>

          <p className="m-0 mt-10 text-[16px] text-white/75">
            Régler votre facture
          </p>
          <p className="m-0 mt-1 flex items-end gap-2.5">
            <span className="text-[40px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">
              {chiffre} {code}
            </span>
            <span className="pb-1 text-[12px] leading-tight text-white/70">
              une
              <br />
              fois
            </span>
          </p>

          {/*
            Une seule devise : Vanilla Pay n'encaisse que l'Ariary. Une carte
            étrangère passe quand même — c'est sa banque qui convertit.
          */}
          <span className="mt-7 inline-flex items-center gap-2.5 rounded-[var(--radius-m)] border border-white px-3.5 py-2 text-[14px] font-bold">
            <span className="rounded-[4px] bg-[#f5d27a] px-1.5 text-[12px] font-extrabold text-[var(--marque-nuit)]">
              Ar
            </span>
            {code}
          </span>
          <p className="m-0 mt-3 text-[13px] leading-snug text-white/70">
            Le règlement est prélevé en Ariary. Une carte étrangère est acceptée
            ; votre banque peut appliquer des frais de change.
          </p>

          <dl className="m-0 mt-9 text-[14px]">
            <div className="flex items-start justify-between gap-4 border-b border-white/12 pb-3.5">
              <dt className="min-w-0">
                <span className="block font-bold">{objet}</span>
                {numeroFacture ? (
                  <span className="mt-0.5 block text-[12.5px] text-white/65">
                    Facture {numeroFacture}
                  </span>
                ) : null}
              </dt>
              <dd className="m-0 shrink-0 font-bold tabular-nums">{somme}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/12 py-3.5">
              <dt className="font-bold">Sous-total</dt>
              <dd className="m-0 font-bold tabular-nums">{somme}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/12 py-3.5 text-white/70">
              <dt>Frais prélevés par la CanCham</dt>
              <dd className="m-0 tabular-nums">0 Ar</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-3.5">
              <dt className="text-[16px] font-bold">Total à régler</dt>
              <dd className="m-0 text-[18px] font-extrabold text-[#f5d27a] tabular-nums">
                {somme}
              </dd>
            </div>
          </dl>
        </div>
      </aside>

      {/* ---------- Ce qu'il faut remplir ---------- */}
      <section className="px-6 py-9 sm:px-10 lg:py-14">
        <div className="mx-auto max-w-[380px]">
          {encaisse ? (
            <div className="text-center lg:pt-16">
              <CheckCircle2
                size={44}
                aria-hidden
                className="mx-auto text-success"
              />
              <h1 className="m-0 mt-4 text-[24px] font-bold">
                Règlement encaissé
              </h1>
              <p className="m-0 mt-2 text-[15px] leading-relaxed text-muted">
                Le prestataire a confirmé votre paiement de {somme}. Il n’y a
                plus rien à faire.
              </p>
              <Link
                href="/membre/cotisations"
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-m)] bg-accent px-6 text-[15px] font-bold text-white no-underline hover:bg-accent-strong"
              >
                Revenir aux factures <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <form action={payerParCarte}>
              <input type="hidden" name="reglementId" value={reglementId} />
              <h1 className="sr-only">Payer par carte bancaire</h1>

              <p className="m-0 mb-2 text-[15px] font-bold text-ink">
                Montant à régler
              </p>
              {/* Le montant de la facture : lisible, pas modifiable. */}
              <div className="flex min-h-14 items-center justify-between rounded-[var(--radius-m)] border border-line bg-surface px-4">
                <output className="text-[22px] font-bold text-ink tabular-nums">
                  {chiffre}
                </output>
                <span className="text-[15px] font-semibold text-muted">
                  {code}
                </span>
              </div>

              <p className="m-0 mb-2 mt-7 text-[15px] font-bold text-ink">
                Coordonnées
              </p>
              <div className="flex min-h-12 items-center gap-4 rounded-[var(--radius-m)] border border-line bg-surface-2 px-4 text-[15px]">
                <span className="text-muted">E-mail</span>
                <span className="min-w-0 truncate text-ink">{email}</span>
              </div>

              <p className="m-0 mb-2 mt-7 text-[15px] font-bold text-ink">
                Moyen de paiement
              </p>
              <div className="rounded-[var(--radius-m)] border border-line p-4">
                <div className="flex items-center gap-2.5">
                  <CreditCard size={19} aria-hidden className="text-ink" />
                  <span className="flex-1 text-[16px] font-semibold text-ink">
                    Carte
                  </span>
                  <Image
                    src="/paiement/carte.jpeg"
                    alt="CB, Mastercard et Visa"
                    width={738}
                    height={363}
                    className="h-7 w-auto object-contain"
                  />
                </div>

                <p className="m-0 mt-3.5 flex gap-2.5 rounded-[var(--radius-m)] bg-[#eef2f7] px-3.5 py-3 text-[13.5px] leading-snug text-[#33414f]">
                  <Lock size={15} aria-hidden className="mt-0.5 shrink-0" />
                  <span>
                    Vous serez conduit vers la page sécurisée de notre
                    prestataire : c’est là que vous saisissez votre carte. La
                    CanCham ne voit ni ne conserve jamais son numéro.
                  </span>
                </p>

                <div className="mt-4">
                  <label
                    htmlFor="titulaire-carte"
                    className="mb-1.5 block text-[14px] font-semibold text-ink"
                  >
                    Nom du titulaire de la carte
                  </label>
                  <input
                    id="titulaire-carte"
                    name="titulaire"
                    required
                    maxLength={80}
                    autoComplete="cc-name"
                    defaultValue={titulaire}
                    placeholder="Tel qu’il figure sur la carte"
                    className="min-h-12 w-full rounded-[var(--radius-m)] border border-line bg-surface px-4 text-[16px] text-ink placeholder:text-faint focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="mt-4">
                  <AdresseFacturation initiale={adresse} />
                </div>
              </div>

              <BoutonMarque
                enCours="Redirection…"
                className="mt-6 min-h-[52px] w-full rounded-[var(--radius-m)] shadow-[0_10px_24px_-12px_rgba(200,16,46,0.6)]"
              >
                <Lock size={17} aria-hidden /> Payer {somme}
              </BoutonMarque>
              <div className="mt-4 text-center">
                <Link
                  href="/membre/cotisations"
                  className="text-[14px] font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  Payer plus tard
                </Link>
              </div>
              {raccorde ? null : (
                <p className="m-0 mt-5 text-center text-[12.5px] leading-snug text-muted">
                  Le raccordement au prestataire est en cours de mise en place.
                </p>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
