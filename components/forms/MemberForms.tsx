"use client";

import {
  Bell,
  Check,
  CreditCard,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { OptionsSecteurs } from "@/components/OptionsSecteurs";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  Field,
  INPUT,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import {
  addContact,
  ajouterService,
  modifierService,
  supprimerService,
  approveCandidature,
  createMember,
  removeContact,
  updateContact,
  deleteMember,
  registerPayment,
  rejectCandidature,
  sendReminder,
  updateMemberProfile,
} from "@/lib/actions/members";
import {
  FORMULES,
  fmtMontant,
  libelleFormule,
  PHOTOS_PAR_PRODUIT,
  type FormuleId,
} from "@/lib/membership";
import type { Contact, Produit } from "@/lib/types";

const BTN_PRIMARY = "btn-action btn-action-sm";
const BTN_LINE =
  "inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-line bg-transparent text-ink hover:bg-surface-2";
const BTN_DANGER =
  "w-full justify-center inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-bad-soft bg-transparent text-bad hover:bg-surface-2 text-[12.4px] px-[11px] py-1.5";

/** Ajout manuel d'un membre, côté back-office. */
export function AddMemberButton() {
  return (
    <Modal
      title="Ajouter un membre"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className={`${BTN_PRIMARY} text-[13.4px] px-[15px] py-[9px]`}
        >
          <Plus size={15} /> Ajouter un membre
        </button>
      )}
    >
      {(fermer) => (
        <form action={createMember}>
          <ModalBody>
            <Field label="Type de membre">
              <select name="type" className={INPUT} defaultValue="morale">
                <option value="morale">Entreprise (personne morale)</option>
                <option value="physique">
                  Indépendant (personne physique)
                </option>
              </select>
            </Field>
            <Field
              label="Nom de l’entreprise"
              hint="Pour un indépendant, laissez vide pour reprendre le nom de la personne."
            >
              <input
                type="text"
                name="nom"
                placeholder="Ex. Zafy Design"
                className={INPUT}
              />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Secteur d’activité">
                <select name="secteur" defaultValue="" className={INPUT}>
                  <OptionsSecteurs />
                </select>
              </Field>
              <Field label="Ville">
                <input
                  type="text"
                  name="ville"
                  placeholder="Antananarivo"
                  className={INPUT}
                />
              </Field>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Représentant / contact clé">
                <input
                  type="text"
                  name="rep"
                  placeholder="Nom complet"
                  className={INPUT}
                />
              </Field>
              <Field label="Fonction">
                <input
                  type="text"
                  name="repTitre"
                  placeholder="Ex. Directrice Générale"
                  className={INPUT}
                />
              </Field>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Courriel">
                <input
                  type="email"
                  name="email"
                  placeholder="contact@entreprise.mg"
                  className={INPUT}
                />
              </Field>
              <Field label="Téléphone">
                <input
                  type="tel"
                  name="tel"
                  placeholder="+261 3…"
                  className={INPUT}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                name="desc"
                rows={3}
                placeholder="Courte description de l’activité…"
                className={INPUT}
              />
            </Field>
            <Field label="Statut à la création">
              <select name="statut" className={INPUT} defaultValue="en_attente">
                <option value="a_jour">À jour (adhésion payée)</option>
                <option value="en_attente">En attente de paiement</option>
              </select>
            </Field>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Ajout…">
              <Plus size={14} /> Ajouter le membre
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Règlement encaissé par l'équipe : met à jour le statut et crée la facture. */
export function RegisterPaymentButton({
  memberId,
  premier,
  nom,
  formule,
}: {
  memberId: string;
  premier: boolean;
  nom: string;
  /** La formule du membre fixe le montant attendu et sa devise. */
  formule: FormuleId;
}) {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const { montant, devise } = FORMULES[formule];
  return (
    <Modal
      title="Enregistrer le paiement"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className={`${BTN_PRIMARY} w-full justify-center text-[12.4px] px-[11px] py-1.5`}
        >
          <CreditCard size={14} />{" "}
          {premier ? "Enregistrer le paiement" : "Enregistrer un règlement"}
        </button>
      )}
    >
      {(fermer) => (
        <form action={registerPayment}>
          <input type="hidden" name="memberId" value={memberId} />
          <ModalBody>
            <p className="text-[13px] text-muted m-0">
              {premier
                ? `Confirmez le règlement de la cotisation pour activer l’accès complet de ${nom}.`
                : `Enregistrez un règlement pour ${nom}.`}
            </p>
            <Field label="Mode de paiement">
              <select name="mode" className={INPUT} defaultValue="Espèces">
                <option>Espèces</option>
                <option>Virement bancaire</option>
                <option>Mobile Money</option>
                <option>Chèque</option>
              </select>
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field
                label={`Montant (${devise === "CAD" ? "dollars canadiens" : "Ariary"})`}
                hint={`${libelleFormule(formule)} : ${fmtMontant(montant, devise)} par an`}
              >
                <input
                  type="number"
                  name="montant"
                  defaultValue={montant}
                  className={INPUT}
                />
                <input type="hidden" name="devise" value={devise} />
              </Field>
              <Field label="Date du paiement">
                <input
                  type="date"
                  name="date"
                  defaultValue={aujourdhui}
                  className={INPUT}
                />
              </Field>
            </div>
            <Field label="Note interne (optionnel)">
              <input
                type="text"
                name="note"
                placeholder="Ex. reçu remis en main propre"
                className={INPUT}
              />
            </Field>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={14} /> Confirmer le paiement
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function ApproveButton({ memberId }: { memberId: string }) {
  return (
    <form action={approveCandidature}>
      <input type="hidden" name="memberId" value={memberId} />
      <SubmitButton
        sm
        pendingLabel="Approbation…"
        className="w-full justify-center"
      >
        <Check size={14} /> Approuver la demande
      </SubmitButton>
    </form>
  );
}

export function RejectButton({
  memberId,
  nom,
}: {
  memberId: string;
  nom: string;
}) {
  return (
    <Modal
      title="Refuser la demande"
      trigger={(ouvrir) => (
        <button onClick={ouvrir} className={BTN_DANGER}>
          <X size={14} /> Refuser la demande
        </button>
      )}
    >
      {(fermer) => (
        <form action={rejectCandidature}>
          <input type="hidden" name="memberId" value={memberId} />
          <ModalBody>
            <p className="text-[13.6px] text-muted m-0">
              La candidature de <b className="text-ink">{nom}</b> sera
              supprimée. Le refus est consigné dans le journal, mais la fiche ne
              sera pas récupérable.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Refus…">
              <X size={14} /> Refuser définitivement
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function ReminderButton({ memberId }: { memberId: string }) {
  return (
    <form action={sendReminder}>
      <input type="hidden" name="memberId" value={memberId} />
      <SubmitButton
        sm
        variant="line"
        pendingLabel="Envoi…"
        className="w-full justify-center"
      >
        <Bell size={14} /> Envoyer une relance
      </SubmitButton>
    </form>
  );
}

export function DeleteMemberButton({
  memberId,
  nom,
}: {
  memberId: string;
  nom: string;
}) {
  return (
    <Modal
      title="Supprimer ce membre"
      trigger={(ouvrir) => (
        <button onClick={ouvrir} className={BTN_DANGER}>
          <Trash2 size={14} /> Supprimer ce membre
        </button>
      )}
    >
      {(fermer) => (
        <form action={deleteMember}>
          <input type="hidden" name="memberId" value={memberId} />
          <ModalBody>
            <p className="text-[13.6px] text-muted m-0">
              <b className="text-ink">{nom}</b> sera retiré de l’annuaire avec
              ses produits, ses inscriptions et ses accès. Ses factures étant
              des pièces comptables, la suppression échoue s’il en existe —
              c’est voulu.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Suppression…">
              <Trash2 size={14} /> Supprimer définitivement
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Édition de sa propre fiche par le membre. */
export function EditProfileButton({
  memberId,
  activite,
  desc,
  besoins,
  interets,
  secteur,
  siteweb = null,
  cover = null,
  logo = null,
}: {
  memberId: string;
  /** Secteur actuel ; « Secteur à préciser » compte comme vide. */
  secteur: string;
  activite: string;
  desc: string;
  besoins?: string;
  interets?: string;
  siteweb?: string | null;
  /** Visuels actuels, affichés en aperçu à côté du sélecteur de fichier. */
  cover?: string | null;
  logo?: string | null;
}) {
  return (
    <Modal
      wide
      title="Modifier ma fiche"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className={`${BTN_LINE} text-[12.4px] px-[11px] py-1.5`}
        >
          Modifier ma fiche
        </button>
      )}
    >
      {(fermer) => (
        <form action={updateMemberProfile}>
          <input type="hidden" name="memberId" value={memberId} />
          <ModalBody>
            <Field
              label="Site web"
              hint="Facultatif. Par exemple : monentreprise.mg"
            >
              <input
                type="text"
                name="siteweb"
                inputMode="url"
                autoComplete="url"
                defaultValue={siteweb ?? ""}
                placeholder="www.monentreprise.mg"
                className={INPUT}
              />
            </Field>
            <Field label="Secteur d’activité">
              <select name="secteur" defaultValue={secteur} className={INPUT}>
                <OptionsSecteurs actuel={secteur} />
              </select>
            </Field>
            <Field label="Activité (description courte)">
              <input
                type="text"
                name="activite"
                defaultValue={activite}
                className={INPUT}
              />
            </Field>
            <Field label="Description détaillée">
              <textarea
                name="desc"
                rows={4}
                defaultValue={desc}
                className={INPUT}
              />
            </Field>
            {/* Un seul champ : besoins et intérêts se lisent en une liste
                unique sur la fiche. Les intérêts déjà saisis y sont repris à la
                suite, pour que rien ne se perde à l'enregistrement. */}
            <Field
              label="Besoins actuels"
              hint="Ce que vous recherchez : partenaires, distributeurs, financement… Une ligne par besoin : chacune devient un tiret sur votre fiche."
            >
              <textarea
                name="besoins"
                rows={4}
                defaultValue={[besoins, interets].filter(Boolean).join("\n")}
                className={INPUT}
              />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <ChampImage
                name="cover"
                label="Photo de couverture"
                hint="Le bandeau en tête de votre fiche. Format paysage."
                apercu={cover}
                ratio="aspect-[16/6]"
              />
              <ChampImage
                name="logo"
                label="Logo"
                hint="Sur fond transparent de préférence (PNG)."
                apercu={logo}
                ratio="aspect-[16/6]"
                contain
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={14} /> Enregistrer
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Ajout d'une personne à joindre, depuis la fiche « Mon entreprise ». */
export function AddContactButton({
  memberId,
  retour = "/membre/profil",
}: {
  memberId: string;
  retour?: string;
}) {
  return (
    <Modal
      title="Ajouter un contact"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className={`${BTN_LINE} text-[12.4px] px-[11px] py-1.5`}
        >
          <Plus size={14} /> Ajouter un contact
        </button>
      )}
    >
      {(fermer) => (
        <form action={addContact}>
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="retour" value={retour} />
          <ModalBody>
            <Field label="Nom et prénom">
              <input type="text" name="nom" required className={INPUT} />
            </Field>
            <Field label="Fonction" hint="Par exemple : Responsable export.">
              <input
                type="text"
                name="fonction"
                placeholder="Contact"
                className={INPUT}
              />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field
                label="Courriel"
                hint="Il recevra un lien pour choisir son mot de passe."
              >
                <input type="email" name="email" required className={INPUT} />
              </Field>
              <Field label="Téléphone">
                <input
                  type="tel"
                  name="tel"
                  placeholder="+261 34 00 000 00"
                  className={INPUT}
                />
              </Field>
            </div>
            <div className="max-w-[180px]">
              <ChampImage
                name="photo"
                label="Portrait"
                hint="Facultatif. À défaut, les initiales font l’avatar."
                apercu={null}
                ratio="aspect-square"
                rond
              />
            </div>
            <label className="flex items-start gap-2.5 mt-1 cursor-pointer">
              <input
                type="checkbox"
                name="principal"
                className="mt-0.5 accent-[var(--accent)]"
              />
              <span className="text-[12.8px] text-muted">
                <b className="text-ink font-semibold">
                  Faire de cette personne le contact principal.
                </b>{" "}
                C’est elle que la chambre joindra en premier. L’ancien référent
                perd ce rôle, sans quitter la liste.
              </span>
            </label>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Ajout…">
              <Check size={14} /> Ajouter
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Retrait d'un contact, avec confirmation — c'est un accès que l'on supprime. */
export function RemoveContactButton({
  contactId,
  nom,
  retour = "/membre/profil",
}: {
  contactId: string;
  nom: string;
  retour?: string;
}) {
  return (
    <Modal
      title="Retirer ce contact"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          aria-label={`Retirer ${nom}`}
          className="w-7 h-7 rounded-md border border-line bg-transparent text-faint flex items-center justify-center cursor-pointer transition-colors hover:border-bad-soft hover:text-bad shrink-0"
        >
          <Trash2 size={13} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={removeContact}>
          <input type="hidden" name="contactId" value={contactId} />
          <input type="hidden" name="retour" value={retour} />
          <ModalBody>
            <p className="m-0 text-[13.6px] leading-relaxed">
              Retirer <b>{nom}</b> des contacts de l’entreprise ? La chambre ne
              pourra plus la joindre par cette fiche.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Retrait…" variant="danger">
              <Trash2 size={14} /> Retirer
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/**
 * Sélecteur d'image avec l'aperçu de ce qui est déjà en place.
 *
 * Sans l'aperçu, on ne sait pas si le champ vide veut dire « il n'y a pas
 * d'image » ou « il y en a une, je n'y touche pas ». Le nom du fichier choisi
 * remplace l'aperçu dès la sélection, pour confirmer que le clic a pris.
 */
function ChampImage({
  name,
  label,
  hint,
  apercu,
  ratio,
  contain = false,
  rond = false,
}: {
  name: string;
  label: string;
  hint?: string;
  apercu: string | null;
  ratio: string;
  contain?: boolean;
  /** Un portrait se juge dans le cadre où il sera vu : rond. */
  rond?: boolean;
}) {
  const [choisi, setChoisi] = useState<string | null>(null);

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-2">
        <div
          className={`${ratio} w-full border border-line bg-surface-2 overflow-hidden flex items-center justify-center ${
            rond ? "rounded-full" : "rounded-[var(--radius-s)]"
          }`}
        >
          {apercu ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={apercu}
              alt=""
              className={`w-full h-full ${contain ? "object-contain p-2" : "object-cover"}`}
            />
          ) : (
            <span className="text-[11.5px] text-faint">Aucune image</span>
          )}
        </div>

        <label
          className={`${BTN_LINE} text-[12.2px] px-[11px] py-1.5 justify-center`}
        >
          <ImagePlus size={14} />
          {choisi ? "Changer" : apercu ? "Remplacer" : "Choisir une image"}
          <input
            type="file"
            name={name}
            accept="image/*"
            className="sr-only"
            onChange={(e) => setChoisi(e.target.files?.[0]?.name ?? null)}
          />
        </label>

        {choisi ? (
          <span className="text-[11.5px] text-success-strong truncate">
            {choisi}
          </span>
        ) : null}
      </div>
    </Field>
  );
}

/** Modification d'un contact existant, portrait compris. */
export function EditContactButton({
  contact,
  seul,
  retour = "/membre/profil",
}: {
  contact: Contact;
  /** Unique contact de l'entreprise : il ne peut pas cesser d'être référent. */
  seul: boolean;
  retour?: string;
}) {
  return (
    <Modal
      title="Modifier le contact"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          aria-label={`Modifier ${contact.nom}`}
          className="w-7 h-7 rounded-md border border-line bg-transparent text-faint flex items-center justify-center cursor-pointer transition-colors hover:border-accent hover:text-accent shrink-0"
        >
          <Pencil size={13} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={updateContact}>
          <input type="hidden" name="contactId" value={contact.id} />
          <input type="hidden" name="retour" value={retour} />
          <ModalBody>
            <div className="flex gap-4 items-start">
              <div className="w-[120px] shrink-0">
                <ChampImage
                  name="photo"
                  label="Portrait"
                  apercu={contact.photo}
                  ratio="aspect-square"
                  rond
                />
              </div>
              <div className="flex-1 flex flex-col gap-3.5 min-w-0">
                <Field label="Nom et prénom">
                  <input
                    type="text"
                    name="nom"
                    defaultValue={contact.nom}
                    required
                    className={INPUT}
                  />
                </Field>
                <Field label="Fonction">
                  <input
                    type="text"
                    name="fonction"
                    defaultValue={contact.fonction}
                    className={INPUT}
                  />
                </Field>
              </div>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Courriel">
                <input
                  type="email"
                  name="email"
                  defaultValue={contact.email}
                  required
                  className={INPUT}
                />
              </Field>
              <Field label="Téléphone">
                <input
                  type="tel"
                  name="tel"
                  defaultValue={contact.tel ?? ""}
                  className={INPUT}
                />
              </Field>
            </div>
            <label className="flex items-start gap-2.5 mt-1 cursor-pointer">
              <input
                type="checkbox"
                name="principal"
                defaultChecked={contact.principal}
                disabled={seul}
                className="mt-0.5 accent-[var(--accent)]"
              />
              <span className="text-[12.8px] text-muted">
                <b className="text-ink font-semibold">Contact principal.</b>{" "}
                {seul
                  ? "Seul contact de l’entreprise, cette personne le reste tant qu’une autre n’a pas été ajoutée."
                  : "L’ancien référent perd ce rôle, sans quitter la liste."}
              </span>
            </label>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={14} /> Enregistrer
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/**
 * Galerie d'un produit dans le formulaire : garder, retirer, ajouter.
 *
 * Les photos en place s'affichent en vignettes. Un clic en marque une pour
 * retrait — elle pâlit et se barre, mais rien n'est supprimé avant
 * l'enregistrement : un clic de trop se rattrape d'un second clic. Les
 * nouvelles images s'ajoutent à la suite, dans la limite du plafond.
 */
function ChampGalerie({ actuelles }: { actuelles: string[] }) {
  const [retirees, setRetirees] = useState<Set<string>>(new Set());
  const [ajoutees, setAjoutees] = useState(0);

  const restantes = actuelles.length - retirees.size;
  const place = Math.max(0, PHOTOS_PAR_PRODUIT - restantes);

  const basculer = (url: string) =>
    setRetirees((avant) => {
      const apres = new Set(avant);
      if (apres.has(url)) apres.delete(url);
      else apres.add(url);
      return apres;
    });

  return (
    <Field
      label={`Photos (${restantes}/${PHOTOS_PAR_PRODUIT})`}
      hint={
        actuelles.length
          ? "Cliquez sur une photo pour la retirer. La première sert de vignette."
          : undefined
      }
    >
      <div className="flex flex-col gap-2">
        {actuelles.length ? (
          <div className="grid grid-cols-3 gap-1.5">
            {actuelles.map((url, n) => {
              const retiree = retirees.has(url);
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => basculer(url)}
                  aria-pressed={retiree}
                  aria-label={
                    retiree
                      ? `Garder la photo ${n + 1}`
                      : `Retirer la photo ${n + 1}`
                  }
                  className="relative aspect-square rounded-md overflow-hidden border border-line cursor-pointer p-0 bg-surface-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className={`w-full h-full object-cover transition-opacity ${
                      retiree ? "opacity-25 grayscale" : ""
                    }`}
                  />
                  {retiree ? (
                    <>
                      <span className="absolute inset-0 flex items-center justify-center text-bad">
                        <X size={22} strokeWidth={3} />
                      </span>
                      <input type="hidden" name="retirer" value={url} />
                    </>
                  ) : null}
                  {n === 0 && !retiree ? (
                    <span className="absolute bottom-0.5 left-0.5 text-[9px] font-bold uppercase tracking-wide bg-[#0f1d2c]/70 text-white rounded px-1">
                      Vignette
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="aspect-[4/3] rounded-[var(--radius-s)] border border-dashed border-line bg-surface-2 flex items-center justify-center text-[11.5px] text-faint">
            Aucune photo
          </div>
        )}

        {place > 0 ? (
          <label
            className={`${BTN_LINE} text-[12.2px] px-[11px] py-1.5 justify-center`}
          >
            <ImagePlus size={14} />
            {ajoutees
              ? `${ajoutees} photo${ajoutees > 1 ? "s" : ""} choisie${ajoutees > 1 ? "s" : ""}`
              : "Ajouter des photos"}
            <input
              type="file"
              name="photos"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => setAjoutees(e.target.files?.length ?? 0)}
            />
          </label>
        ) : (
          <span className="text-[11.5px] text-faint text-center">
            Galerie complète. Retirez une photo pour en ajouter.
          </span>
        )}

        {ajoutees > place ? (
          <span className="text-[11.5px] text-warn">
            Seules les {place} premières seront gardées.
          </span>
        ) : null}
      </div>
    </Field>
  );
}

/* ============================ Produits & services ============================ */

/**
 * Champs d'une offre du catalogue, communs à l'ajout et à la modification.
 *
 * Pas de formulaire d'offre dans « Modifier ma fiche » : chaque offre se gère
 * ici, une par une, avec tout ce que sa fiche de détail affiche.
 */
function ChampsService({ produit }: { produit?: Produit }) {
  return (
    <>
      <div className="grid gap-3.5 md:grid-cols-[1fr_180px]">
        <Field label="Titre">
          <input
            type="text"
            name="label"
            required
            defaultValue={produit?.label}
            placeholder="Ex. Huile essentielle de ravintsara"
            className={INPUT}
          />
        </Field>
        <Field label="Nature">
          <select
            name="type"
            defaultValue={produit?.type ?? "service"}
            className={INPUT}
          >
            <option value="service">Service</option>
            <option value="produit">Produit</option>
          </select>
        </Field>
      </div>
      <Field
        label="Prix indicatif"
        hint="Facultatif. En clair : « 25 000 Ar le flacon », « À partir de 300 $ », « Sur devis »."
      >
        <input
          type="text"
          name="prix"
          defaultValue={produit?.prix ?? ""}
          className={INPUT}
        />
      </Field>
      <Field
        label="Description"
        hint="Ce que l’offre comprend, pour qui, à quelles conditions, délais."
      >
        <textarea
          name="description"
          rows={5}
          defaultValue={produit?.description ?? ""}
          className={INPUT}
        />
      </Field>
      <ChampGalerie actuelles={produit?.photos ?? []} />
    </>
  );
}

export function AjouterServiceButton({ memberId }: { memberId: string }) {
  return (
    <Modal
      wide
      title="Ajouter une offre"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className={`${BTN_LINE} text-[12.4px] px-[11px] py-1.5`}
        >
          <Plus size={14} /> Ajouter
        </button>
      )}
    >
      {(fermer) => (
        <form action={ajouterService}>
          <input type="hidden" name="memberId" value={memberId} />
          <ModalBody>
            <ChampsService />
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Ajout…">
              <Check size={14} /> Ajouter
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function ModifierServiceButton({ produit }: { produit: Produit }) {
  return (
    <Modal
      wide
      title="Modifier l’offre"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className={`${BTN_LINE} text-[12.4px] px-[11px] py-1.5`}
        >
          <Pencil size={13} /> Modifier
        </button>
      )}
    >
      {(fermer) => (
        <form action={modifierService}>
          <input type="hidden" name="produitId" value={produit.id} />
          <ModalBody>
            <ChampsService produit={produit} />
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={14} /> Enregistrer
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function SupprimerServiceButton({
  produitId,
  label,
}: {
  produitId: string;
  label: string;
}) {
  return (
    <Modal
      title="Retirer cette offre"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className="inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-bad-soft bg-transparent text-bad hover:bg-surface-2 text-[12.4px] px-[11px] py-1.5"
        >
          <Trash2 size={13} /> Retirer
        </button>
      )}
    >
      {(fermer) => (
        <form action={supprimerService}>
          <input type="hidden" name="produitId" value={produitId} />
          <ModalBody>
            <p className="m-0 text-[13.6px] leading-relaxed">
              Retirer <b>{label}</b> de votre catalogue ? Elle disparaîtra de
              votre fiche et de l’annuaire.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Retrait…" variant="danger">
              <Trash2 size={14} /> Retirer
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
