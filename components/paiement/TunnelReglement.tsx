import { AlertTriangle, Banknote, Clock, Info, MapPin } from "lucide-react";
import { Copiable } from "@/components/paiement/Copiable";
import { SubmitButton } from "@/components/form-bits";
import { Banner, Card } from "@/components/ui";
import { annoncerReglement } from "@/lib/actions/reglements";
import { fmtMontant, type Devise } from "@/lib/membership";
import {
  enLettres,
  estPortefeuille,
  MODES,
  numeroPortefeuille,
  type Coordonnees,
  type ModeReglement,
} from "@/lib/reglements";

/**
 * Ce qu'on montre au membre une fois son moyen choisi.
 *
 * Trois choses, toujours dans le même ordre : où envoyer l'argent, la
 * référence à recopier, et le bouton qui dit « c'est parti ». La référence
 * est mise en avant parce que c'est elle, et elle seule, qui permettra de
 * rattacher l'argent arrivé à qui l'a envoyé — un virement sans motif est un
 * virement que l'équipe cherchera pendant une semaine.
 *
 * Annoncer n'est pas payer : l'écran le dit, et la facture reste due jusqu'à
 * ce que l'équipe constate l'arrivée.
 */
export function TunnelReglement({
  mode,
  reference,
  montant,
  devise,
  coordonnees: c,
  objet,
  payeur,
}: {
  mode: ModeReglement;
  reference: string;
  montant: number;
  devise: Devise;
  coordonnees: Coordonnees;
  objet: string;
  payeur: string;
}) {
  const somme = fmtMontant(montant, devise);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
      <Card className="p-6">
        <h2 className="m-0 text-[17px] font-semibold">
          {MODES[mode].titre} · {somme}
        </h2>
        <p className="m-0 mt-1.5 text-[13.4px] text-muted">{objet}</p>

        <div className="mt-5 grid gap-2.5">
          {mode === "virement" ? (
            <>
              <Copiable
                libelle="Titulaire du compte"
                valeur={c.titulaire}
                mono={false}
              />
              {c.rib ? <Copiable libelle="RIB" valeur={c.rib} /> : null}
              {c.iban ? <Copiable libelle="IBAN" valeur={c.iban} /> : null}
              {c.banque ? (
                <Copiable
                  libelle="Banque"
                  valeur={[c.banque, c.agence].filter(Boolean).join(" · ")}
                  mono={false}
                />
              ) : null}
            </>
          ) : null}

          {mode === "international" ? (
            <>
              <Copiable
                libelle="Bénéficiaire"
                valeur={c.titulaire}
                mono={false}
              />
              <Copiable libelle="IBAN" valeur={c.iban} />
              <Copiable libelle="BIC / SWIFT" valeur={c.bic} />
              {c.banque ? (
                <Copiable libelle="Banque" valeur={c.banque} mono={false} />
              ) : null}
            </>
          ) : null}

          {mode === "depot" ? (
            <>
              <Copiable libelle="Banque" valeur={c.banque} mono={false} />
              {c.agence ? (
                <Copiable libelle="Agence" valeur={c.agence} mono={false} />
              ) : null}
              <Copiable libelle="Compte à créditer" valeur={c.rib} />
              <Copiable libelle="Au nom de" valeur={c.titulaire} mono={false} />
              <Copiable
                libelle="Montant en lettres"
                valeur={`${enLettres(montant)} ariary`}
                mono={false}
              />
            </>
          ) : null}

          {mode === "especes" ? (
            <div className="rounded-[var(--radius-m)] border border-line bg-surface-2 px-4 py-3.5">
              <div className="flex items-start gap-2.5 text-[13.6px]">
                <MapPin size={15} className="mt-px shrink-0 text-accent" />
                <span className="whitespace-pre-line">{c.adresseBureau}</span>
              </div>
              {c.horaires ? (
                <div className="mt-2 flex items-start gap-2.5 text-[13.2px] text-muted">
                  <Clock size={15} className="mt-px shrink-0" />
                  <span>{c.horaires}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {mode === "plateforme" ? (
            <div className="rounded-[var(--radius-m)] border border-line bg-surface-2 px-4 py-3.5 text-[13.6px] whitespace-pre-line">
              {c.plateformes}
            </div>
          ) : null}

          {/*
            Le numéro du portefeuille choisi, et lui seul : afficher les trois
            opérateurs inviterait à envoyer l'argent sur le mauvais.
          */}
          {estPortefeuille(mode) ? (
            <>
              <Copiable
                libelle={`Numéro ${MODES[mode].titre}`}
                valeur={numeroPortefeuille(mode, c)}
              />
              {c.titulaire ? (
                <Copiable
                  libelle="Au nom de"
                  valeur={c.titulaire}
                  mono={false}
                />
              ) : null}
            </>
          ) : null}
        </div>

        {/*
          La référence, détachée du reste : c'est la seule chose que le membre
          doit absolument recopier, et la seule que sa banque ne remplira pas
          à sa place.
        */}
        <div className="mt-4">
          <Copiable
            libelle={
              mode === "especes"
                ? "Référence à donner à l’équipe"
                : estPortefeuille(mode)
                  ? "Référence à mettre en note du transfert"
                  : "Motif du virement, à recopier tel quel"
            }
            valeur={reference}
            accent
          />
          <p className="m-0 mt-2 text-[12.4px] text-muted">
            C’est elle qui permet à l’équipe de retrouver votre règlement.
            {payeur ? ` Il sera rattaché à ${payeur}.` : ""}
          </p>
        </div>

        {mode === "international" ? (
          <Banner tone="warn" icon={<Info size={17} />}>
            Si votre banque le propose, choisissez les frais «&nbsp;OUR&nbsp;» —
            à votre charge : la chambre reçoit alors le montant entier. Avec
            «&nbsp;SHA&nbsp;», des frais sont retenus en chemin et la somme
            arrive amputée.
          </Banner>
        ) : null}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2.5">
          <Banknote size={17} className="text-accent" />
          <h2 className="m-0 text-[15.5px] font-semibold">À régler</h2>
        </div>
        <div className="mt-3 font-[family-name:var(--font-mono)] text-[24px] font-bold text-ink">
          {somme}
        </div>
        <p className="m-0 mt-3 text-[12.8px] text-muted">
          Annoncer votre règlement ne le solde pas : la facture reste due
          jusqu’à ce que l’équipe constate l’arrivée de l’argent. Vous recevrez
          la confirmation dans votre espace.
        </p>
      </Card>
    </div>
  );
}

/** Le formulaire d'annonce, séparé pour rester au bas de la page. */
export function AnnonceReglement({
  reglementId,
  mode,
}: {
  reglementId: string;
  mode: ModeReglement;
}) {
  return (
    <Card className="mt-4 p-6">
      <h2 className="m-0 text-[15.5px] font-semibold">
        {mode === "especes"
          ? "Vous avez remis l’argent ?"
          : estPortefeuille(mode)
            ? "Vous avez envoyé l’argent ?"
            : "Vous avez fait le virement ?"}
      </h2>
      <p className="m-0 mt-1.5 text-[13.4px] text-muted">
        Prévenez l’équipe : elle confirmera dès réception. Si vous préférez le
        faire plus tard, revenez simplement sur cette page — votre référence est
        conservée.
      </p>

      <form
        action={annoncerReglement}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="reglementId" value={reglementId} />
        <label className="min-w-[240px] flex-1">
          <span className="mb-1.5 block text-[12.8px] font-semibold text-ink">
            Référence de l’opération{" "}
            <span className="font-normal text-faint">facultatif</span>
          </span>
          <input
            name="refBancaire"
            maxLength={60}
            placeholder={
              mode === "especes"
                ? "Nom de la personne qui remet"
                : estPortefeuille(mode)
                  ? "Référence du SMS de confirmation"
                  : "Donnée par votre banque après le virement"
            }
            className="w-full rounded-[var(--radius-s)] border border-line bg-surface px-3 py-2 text-[13.4px] text-ink placeholder:text-faint"
          />
        </label>
        <SubmitButton pendingLabel="Envoi…">
          <AlertTriangle size={15} /> J’ai réglé · prévenir l’équipe
        </SubmitButton>
      </form>
    </Card>
  );
}
