"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/form-bits";
import { VisuelMode } from "@/components/paiement/IconeMode";
import { ouvrirReglement } from "@/lib/actions/reglements";
import { MODES, ORDRE_MODES, type ModeReglement } from "@/lib/modes-reglement";

/**
 * « Comment payerez-vous ? », en fenêtre.
 *
 * Le choix du moyen s'ouvre par-dessus la page où l'on est — la liste des
 * factures, la fiche de l'événement auquel on vient de s'inscrire —, sans
 * l'emmener ailleurs. Un clic sur une tuile ouvre le règlement dans ce moyen
 * et mène à son écran.
 *
 * `ouverteAuDepart` sert au retour d'une action : l'inscription à un
 * événement payant revient sur sa fiche avec `?regler=…`, et la fenêtre s'y
 * ouvre d'elle-même. La refermer retire ce paramètre, pour qu'un
 * rafraîchissement ne la rouvre pas.
 */
export function FenetreMoyens({
  facture,
  modes,
  bientot = [],
  ouverteAuDepart = false,
  declencheur,
  classeDeclencheur = "",
}: {
  facture: { id: string; numero: string; objet: string; montant: string };
  modes: ModeReglement[];
  /**
   * Les moyens que la chambre offre mais qui ne marchent pas encore — la
   * carte, tant que Vanilla Pay n'est pas branché. Montrés grisés, avec leur
   * raison, plutôt que cachés : une tuile absente, personne ne sait
   * l'expliquer.
   */
  bientot?: ModeReglement[];
  ouverteAuDepart?: boolean;
  /**
   * Le contenu du bouton qui ouvre la fenêtre. Du contenu et non une
   * fonction : une page serveur ne peut pas passer de fonction à un
   * composant client — le bouton, avec son clic, est donc construit ici.
   */
  declencheur?: ReactNode;
  classeDeclencheur?: string;
}) {
  const [ouvert, setOuvert] = useState(ouverteAuDepart);
  const router = useRouter();
  const chemin = usePathname();

  const fermer = () => {
    setOuvert(false);
    if (ouverteAuDepart) router.replace(chemin, { scroll: false });
  };

  return (
    <>
      {declencheur ? (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className={classeDeclencheur}
        >
          {declencheur}
        </button>
      ) : null}
      <Modal
        title="Comment payerez-vous ?"
        largeur="max-w-[860px]"
        ouvert={ouvert}
        onFermer={fermer}
      >
        {() => (
          <div className="px-5 py-5">
            <p className="m-0 text-[14px] text-muted">
              Facture{" "}
              <span className="font-[family-name:var(--font-mono)] text-ink">
                {facture.numero}
              </span>{" "}
              · {facture.objet} · <b className="text-ink">{facture.montant}</b>
            </p>

            {modes.length ? (
              <form action={ouvrirReglement} className="mt-4">
                <input type="hidden" name="factureId" value={facture.id} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {/*
                    Le logo et le nom suffisent : une phrase de détail sous
                    chaque tuile débordait dès que la fenêtre se resserrait,
                    et n'apprenait rien que le logo ne dise déjà.
                  */}
                  {ORDRE_MODES.map((m) =>
                    modes.includes(m) ? (
                      <SubmitButton
                        key={m}
                        name="mode"
                        value={m}
                        variant="line"
                        pendingLabel="Ouverture…"
                        className="h-full min-h-[112px] w-full min-w-0 flex-col items-center justify-center gap-2.5 px-4 py-4 text-center whitespace-normal!"
                      >
                        <VisuelMode mode={m} />
                        <span className="text-[15px] font-semibold text-ink">
                          {MODES[m].titre}
                        </span>
                      </SubmitButton>
                    ) : bientot.includes(m) ? (
                      <div
                        key={m}
                        aria-disabled="true"
                        className="flex h-full min-h-[112px] min-w-0 cursor-not-allowed flex-col items-center justify-center gap-2.5 rounded-[var(--radius-s)] border border-dashed border-line bg-surface-2 px-4 py-4 text-center"
                      >
                        <span className="opacity-50 grayscale">
                          <VisuelMode mode={m} />
                        </span>
                        <span className="text-[15px] font-semibold text-muted">
                          {MODES[m].titre}
                        </span>
                        <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-[12px] font-semibold text-muted">
                          Bientôt disponible
                        </span>
                      </div>
                    ) : null,
                  )}
                </div>
              </form>
            ) : (
              <p className="m-0 mt-4 rounded-[var(--radius-m)] border border-line bg-surface-2 px-4 py-3.5 text-[14px] text-muted">
                Aucun moyen de paiement n’est encore configuré. Écrivez à
                l’équipe : elle vous indiquera comment régler.
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
