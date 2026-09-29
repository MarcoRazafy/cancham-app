import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Copiable } from "@/components/paiement/Copiable";
import { SubmitButton } from "@/components/form-bits";
import {
  annoncerReglement,
  enregistrerNumeroPortefeuille,
} from "@/lib/actions/reglements";
import { fmtMontant, type Devise } from "@/lib/membership";
import { MODES } from "@/lib/modes-reglement";
import {
  numeroLisible,
  PORTEFEUILLES,
  type Portefeuille,
} from "@/lib/portefeuilles";

/**
 * Le règlement par portefeuille mobile, aux couleurs de l'opérateur.
 *
 * Trois gestes, annoncés dès la première page : le montant et le numéro, puis
 * l'envoi depuis le téléphone, puis la confirmation de l'équipe. Le membre
 * sait donc où il en est et ce qui l'attend — un tunnel de paiement qui
 * n'annonce pas ses étapes se fait abandonner au milieu.
 *
 * La plateforme n'encaisse rien ici : l'argent part du téléphone du membre
 * vers le numéro de la chambre. Tant que Vanilla Pay n'est pas branché,
 * c'est l'équipe qui constate l'arrivée — l'écran le dit sans détour.
 */
export function TunnelPortefeuille({
  mode,
  reglementId,
  reference,
  montant,
  devise,
  objet,
  titulaire,
  numeroChambre,
  telephone,
  statut,
  modifier = false,
}: {
  mode: Portefeuille;
  reglementId: string;
  reference: string;
  montant: number;
  devise: Devise;
  /** Ce qui est réglé : l'objet de la facture. */
  objet: string;
  /** À quel nom le compte de la chambre est ouvert. */
  titulaire: string;
  /** Le numéro de la chambre, vide tant que l'équipe ne l'a pas publié. */
  numeroChambre: string;
  /** Le numéro du membre, une fois saisi. */
  telephone: string | null;
  statut: string;
  /** Revenir sur le numéro déjà saisi. */
  modifier?: boolean;
}) {
  const p = PORTEFEUILLES[mode];
  const titre = MODES[mode].titre;
  const somme = fmtMontant(montant, devise);
  const conclu = statut === "annonce" || statut === "reussie";
  const etape = conclu ? 3 : telephone && !modifier ? 2 : 1;

  const ETAPES = [
    {
      titre: "Montant",
      detail: "Ce que vous réglez, et depuis quel numéro.",
    },
    {
      titre: "Envoi",
      detail: `Depuis ${p.ussd}, vers le numéro de la chambre.`,
    },
    {
      titre: "Confirmation",
      detail: "L’équipe confirme dès réception.",
    },
  ];

  return (
    <div
      style={
        {
          "--pf-fond": p.palette.fond,
          "--pf-encre": p.palette.encre,
          "--pf-douce": p.palette.douce,
          "--pf-valeur": p.palette.valeur,
        } as React.CSSProperties
      }
      className="grid overflow-hidden rounded-[var(--radius-l)] border border-line bg-surface lg:grid-cols-[minmax(0,400px)_1fr]"
    >
      {/* ---------- Le panneau de l'opérateur ---------- */}
      <aside className="bg-[var(--pf-fond)] p-7 text-[var(--pf-encre)]">
        {/*
          Chaque logo dans sa pastille blanche : le fond change d'un
          opérateur à l'autre, et une marque posée dessus s'y perdrait.
        */}
        <div className="flex items-center gap-3">
          <span className="flex h-14 items-center rounded-[var(--radius-m)] bg-white px-4">
            <Image
              src="/marque/logo-vertical.png"
              alt="CanCham"
              width={760}
              height={547}
              className="h-10 w-auto object-contain"
            />
          </span>
          <span aria-hidden className="text-[15px] font-semibold opacity-60">
            ×
          </span>
          <span className="flex h-14 items-center rounded-[var(--radius-m)] bg-white px-4">
            <Image
              src={LOGOS[mode]}
              alt={titre}
              width={520}
              height={229}
              className="h-8 w-auto object-contain"
            />
          </span>
        </div>

        <h2 className="m-0 mt-6 text-[26px] font-bold leading-[1.15] tracking-[-0.01em]">
          Votre règlement, en trois gestes
        </h2>
        <p className="m-0 mt-3 text-[14px] leading-relaxed text-[var(--pf-douce)]">
          Le paiement se fait dans {titre}, depuis votre téléphone. La chambre
          reçoit votre règlement et vous le confirme.
        </p>

        <ol className="m-0 mt-6 list-none p-0">
          {ETAPES.map((e, i) => {
            const n = i + 1;
            const passee = n < etape;
            const courante = n === etape;
            return (
              <li key={e.titre} className="flex gap-3.5 py-2.5">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                    courante || passee
                      ? "bg-[var(--pf-encre)] text-[var(--pf-fond)]"
                      : "border border-[var(--pf-encre)]/25 text-[var(--pf-encre)]/55"
                  }`}
                >
                  {passee ? <Check size={15} /> : n}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-bold">
                    {e.titre}
                  </span>
                  <span className="block text-[13px] leading-snug text-[var(--pf-douce)]">
                    {e.detail}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        {/* Le récapitulatif, en sombre : ce qui part, et vers qui. */}
        <dl className="m-0 mt-6 rounded-[var(--radius-m)] bg-[#101418] px-5 py-4 text-white">
          <Ligne libelle="Montant">
            <span className="text-[17px] font-bold text-[var(--pf-valeur)]">
              {somme}
            </span>
          </Ligne>
          <Ligne libelle="Pour">{objet}</Ligne>
          <Ligne libelle="Vers">{titulaire || "CanCham Madagascar"}</Ligne>
          <Ligne libelle="Depuis" dernier>
            {telephone ? numeroLisible(telephone) : "—"}
          </Ligne>
        </dl>

        <p className="m-0 mt-5 flex items-start gap-2.5 text-[12.6px] leading-snug text-[var(--pf-douce)]">
          <ShieldCheck size={16} className="mt-px shrink-0" />
          La CanCham ne vous demandera jamais votre code secret {titre}.
        </p>
      </aside>

      {/* ---------- Ce qu'il y a à faire ---------- */}
      <section className="p-7">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/membre/cotisations"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink no-underline hover:bg-surface-3"
            aria-label="Revenir aux factures"
          >
            ←
          </Link>
          <span className="text-[12.6px] font-semibold text-muted">
            Étape {etape} sur 3
          </span>
        </div>

        {etape === 1 ? (
          <Numero
            mode={mode}
            reglementId={reglementId}
            somme={somme}
            objet={objet}
            titulaire={titulaire}
            telephone={telephone}
          />
        ) : etape === 2 ? (
          <Envoi
            mode={mode}
            reglementId={reglementId}
            somme={somme}
            reference={reference}
            numeroChambre={numeroChambre}
            titulaire={titulaire}
          />
        ) : (
          <Merci somme={somme} reference={reference} statut={statut} />
        )}
      </section>
    </div>
  );
}

const LOGOS: Record<Portefeuille, string> = {
  mvola: "/paiement/mvola.png",
  orange_money: "/paiement/orange-money.png",
  airtel_money: "/paiement/airtel-money.png",
};

function Ligne({
  libelle,
  children,
  dernier = false,
}: {
  libelle: string;
  children: React.ReactNode;
  dernier?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-2.5 ${
        dernier ? "" : "border-b border-dashed border-white/15"
      }`}
    >
      <dt className="shrink-0 text-[12.6px] text-white/55">{libelle}</dt>
      <dd className="m-0 min-w-0 truncate text-right text-[13.6px] font-semibold">
        {children}
      </dd>
    </div>
  );
}

/* ---------------------- Étape 1 : le numéro ---------------------- */

function Numero({
  mode,
  reglementId,
  somme,
  objet,
  titulaire,
  telephone,
}: {
  mode: Portefeuille;
  reglementId: string;
  somme: string;
  objet: string;
  titulaire: string;
  telephone: string | null;
}) {
  const titre = MODES[mode].titre;
  const { prefixes } = PORTEFEUILLES[mode];

  return (
    <>
      <h1 className="m-0 mt-5 text-[27px] font-bold leading-[1.15] tracking-[-0.015em]">
        Depuis quel numéro payez-vous&nbsp;?
      </h1>

      <div className="mt-5 overflow-hidden rounded-[var(--radius-m)]">
        <div className="bg-[var(--pf-fond)] px-6 py-5 text-[var(--pf-encre)]">
          <div className="text-[13px] font-semibold">Montant à régler</div>
          <div className="mt-1 text-[34px] font-bold leading-none tracking-[-0.02em]">
            {somme}
          </div>
        </div>
        <div className="grid grid-cols-2 bg-[#101418] text-white">
          <div className="px-6 py-3.5">
            <div className="text-[12px] text-white/55">Pour</div>
            <div className="truncate text-[13.4px] font-semibold">{objet}</div>
          </div>
          <div className="border-l border-white/12 px-6 py-3.5">
            <div className="text-[12px] text-white/55">Vers</div>
            <div className="truncate text-[13.4px] font-semibold">
              {titulaire || "CanCham Madagascar"}
            </div>
          </div>
        </div>
      </div>

      <form action={enregistrerNumeroPortefeuille} className="mt-6">
        <input type="hidden" name="reglementId" value={reglementId} />
        <label
          htmlFor="telephone-portefeuille"
          className="mb-1.5 block text-[13px] font-semibold text-ink"
        >
          Votre numéro {titre}
        </label>
        <div className="flex overflow-hidden rounded-[var(--radius-m)] border-2 border-[var(--pf-fond)]">
          <span className="flex items-center bg-[var(--pf-fond)] px-4 text-[14px] font-bold text-[var(--pf-encre)]">
            +261
          </span>
          <input
            id="telephone-portefeuille"
            name="telephone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required
            defaultValue={telephone ?? ""}
            placeholder={`${prefixes[0]} 12 345 67`}
            className="w-full border-0 bg-surface px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-faint"
          />
        </div>
        <p className="m-0 mt-1.5 text-[12.4px] text-muted">
          La ligne {PORTEFEUILLES[mode].operateur} depuis laquelle vous payez —
          elle commence par {prefixes.join(" ou ")}.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <SubmitButton pendingLabel="Un instant…">
            Continuer vers {titre} <ArrowRight size={16} />
          </SubmitButton>
          <Link
            href="/membre/cotisations"
            className="text-[13.4px] font-semibold text-muted no-underline underline-offset-4 hover:text-ink hover:underline"
          >
            Payer plus tard
          </Link>
        </div>
      </form>
    </>
  );
}

/* ---------------------- Étape 2 : l'envoi ---------------------- */

function Envoi({
  mode,
  reglementId,
  somme,
  reference,
  numeroChambre,
  titulaire,
}: {
  mode: Portefeuille;
  reglementId: string;
  somme: string;
  reference: string;
  numeroChambre: string;
  titulaire: string;
}) {
  const titre = MODES[mode].titre;
  const { ussd } = PORTEFEUILLES[mode];

  return (
    <>
      <h1 className="m-0 mt-5 text-[27px] font-bold leading-[1.15] tracking-[-0.015em]">
        Envoyez {somme} depuis votre téléphone
      </h1>
      <p className="m-0 mt-2 text-[13.8px] text-muted">
        Composez <b className="text-ink">{ussd}</b>, choisissez le transfert
        d’argent, et suivez les indications ci-dessous.
      </p>

      <div className="mt-5 grid gap-2.5">
        {numeroChambre ? (
          <Copiable
            libelle={`Numéro ${titre} de la chambre`}
            valeur={numeroLisible(numeroChambre)}
          />
        ) : (
          <p className="m-0 rounded-[var(--radius-m)] border border-warn/40 bg-warn-soft px-4 py-3 text-[13.4px] text-warn">
            Le numéro {titre} de la chambre n’est pas encore publié. Écrivez à
            l’équipe : elle vous l’indiquera.
          </p>
        )}
        {titulaire ? (
          <Copiable libelle="Au nom de" valeur={titulaire} mono={false} />
        ) : null}
        <Copiable
          libelle="Référence à mettre en note du transfert"
          valeur={reference}
          accent
        />
      </div>
      <p className="m-0 mt-2 text-[12.4px] text-muted">
        C’est la référence qui permet à l’équipe de retrouver votre règlement.
      </p>

      {/* L'annonce : le membre dit qu'il a envoyé, l'équipe constatera. */}
      <form action={annoncerReglement} className="mt-6">
        <input type="hidden" name="reglementId" value={reglementId} />
        <label
          htmlFor="ref-sms"
          className="mb-1.5 block text-[13px] font-semibold text-ink"
        >
          Référence du SMS de confirmation{" "}
          <span className="font-normal text-faint">facultatif</span>
        </label>
        <input
          id="ref-sms"
          name="refBancaire"
          maxLength={60}
          placeholder="Celle que votre opérateur vous envoie"
          className="w-full rounded-[var(--radius-m)] border border-line bg-surface px-4 py-3 text-[14px] text-ink placeholder:text-faint"
        />
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <SubmitButton pendingLabel="Envoi…">
            <Check size={16} /> J’ai payé · prévenir l’équipe
          </SubmitButton>
          <Link
            href={`/membre/cotisations/payer/${reglementId}?numero=modifier`}
            className="text-[13.4px] font-semibold text-muted no-underline underline-offset-4 hover:text-ink hover:underline"
          >
            Changer de numéro
          </Link>
        </div>
      </form>
    </>
  );
}

/* ---------------------- Étape 3 : c'est dit ---------------------- */

function Merci({
  somme,
  reference,
  statut,
}: {
  somme: string;
  reference: string;
  statut: string;
}) {
  const encaisse = statut === "reussie";
  return (
    <>
      <h1 className="m-0 mt-5 text-[27px] font-bold leading-[1.15] tracking-[-0.015em]">
        {encaisse ? "Règlement encaissé" : "Merci — c’est noté"}
      </h1>
      <p className="m-0 mt-3 text-[14px] leading-relaxed text-muted">
        {encaisse
          ? `L’équipe a constaté l’arrivée de ${somme}. Il n’y a plus rien à faire.`
          : `Vous avez annoncé un règlement de ${somme}. L’équipe le confirmera dès qu’elle aura constaté l’arrivée de l’argent, et vous le verrez dans votre espace.`}
      </p>
      <div className="mt-5 max-w-[420px]">
        <Copiable libelle="Référence du règlement" valeur={reference} accent />
      </div>
      <div className="mt-6">
        <Link
          href="/membre/cotisations"
          className="btn-action btn-action-sm no-underline"
        >
          Revenir aux factures <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}
