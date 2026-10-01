"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { unstable_rethrow } from "next/navigation";
import {
  Globe,
  Images,
  LoaderCircle,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { JetonsEnvoyes, useEnvois } from "@/components/EnvoisSuivis";
import {
  CancelButton,
  ModalBody,
  ModalFooter,
  SubmitButton,
  VoileEnvoi,
} from "@/components/form-bits";
import {
  modifierPublication,
  publierPublication,
  supprimerMaPublication,
} from "@/lib/actions/content";
import { PLAFOND_FICHIER, PLAFOND_FICHIER_MO } from "@/lib/plafonds";
import {
  LONGUEUR_PUBLICATION,
  PHOTOS_PAR_PUBLICATION,
  PUBLICATION_VIERGE,
  type EtatPublication,
} from "@/lib/publications";

type Photo =
  | { cle: string; type: "existante"; url: string }
  | { cle: string; type: "nouvelle"; fichier: File; apercu: string };
type PhotoNouvelle = Extract<Photo, { type: "nouvelle" }>;

/** Ce que la barre et la fenêtre proposent d'écrire. */
const INVITE =
  "Partagez vos besoins ou ce que vous souhaitez partager à la communauté";

/** On ne dit combien de caractères il reste qu'à l'approche de la limite. */
const RESTE_ANNONCE = 500;

const BTN_ICONE =
  "w-9 h-9 rounded-[var(--radius-s)] border border-line bg-surface flex items-center justify-center cursor-pointer text-muted";

/** Une publication déjà parue, que son auteur reprend. */
export interface PublicationAModifier {
  id: string;
  texte: string;
  images: string[];
  publique: boolean;
}

/**
 * Publier dans le fil, comme on le fait partout : une barre d'invite en
 * tête du fil, qui ouvre une fenêtre. Un texte, des photos, à qui on la
 * montre, un bouton — rien d'autre à remplir.
 *
 * Avec `publication`, la même fenêtre sert à reprendre ce qu'on a publié :
 * le déclencheur est alors un crayon, posé sur la publication.
 *
 * Le brouillon vit ici, au-dessus de la fenêtre : la refermer par mégarde ne
 * perd ni le texte ni les photos, qui continuent de partir. Une erreur du
 * serveur s'affiche dans la fenêtre, sans rien effacer ; une publication
 * réussie la referme, et le fil se met à jour dessous.
 */
export function ComposeurPublication({
  avatar,
  entreprise,
  publication,
}: {
  /** Le logo de l'entreprise, rendu côté serveur : il signe la publication. */
  avatar: ReactNode;
  entreprise: string;
  publication?: PublicationAModifier;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState(publication?.texte ?? "");
  const [publique, setPublique] = useState(publication?.publique ?? false);
  const [photos, setPhotos] = useState<Photo[]>(() =>
    (publication?.images ?? []).map((url) => ({
      cle: `e:${url}`,
      type: "existante",
      url,
    })),
  );
  const [avis, setAvis] = useState<string | null>(null);
  const zone = useRef<HTMLTextAreaElement>(null);
  const choix = useRef<HTMLInputElement>(null);
  /** La barre a demandé d'ouvrir directement le choix des photos. */
  const versPhotos = useRef(false);
  /** Numérote les photos : deux fois le même fichier restent deux photos. */
  const rang = useRef(0);
  /** L'erreur du serveur que la saisie a rendue caduque. */
  const [caduque, setCaduque] = useState<EtatPublication | null>(null);

  // Mémorisées : chaque nouvelle photo part dès qu'elle entre dans la liste,
  // et s'interrompt si elle en sort.
  const nouvelles = useMemo(
    () => photos.filter((p): p is PhotoNouvelle => p.type === "nouvelle"),
    [photos],
  );
  const fichiers = useMemo(() => nouvelles.map((p) => p.fichier), [nouvelles]);
  const { etats, jetons } = useEnvois(fichiers);
  const poids = fichiers.reduce((n, f) => n + f.size, 0);
  // Où ranger chaque photo : celles qu'on garde par leur adresse, les
  // nouvelles par leur rang dans le champ fichier.
  const ordre = photos.map((p) =>
    p.type === "existante" ? `e:${p.url}` : `n:${nouvelles.indexOf(p)}`,
  );

  /** Retire les photos qui attendaient l'envoi ; celles déjà parues restent. */
  const viderNouvelles = () => {
    nouvelles.forEach((p) => URL.revokeObjectURL(p.apercu));
    setPhotos((l) => l.filter((p) => p.type === "existante"));
  };

  const [etat, publier, envoi] = useActionState(
    async (
      avant: EtatPublication,
      formData: FormData,
    ): Promise<EtatPublication> => {
      setAvis(null);
      // Tant que tous les envois d'avance ne sont pas arrivés, les photos
      // partent avec le formulaire — prises ici, dans l'état, et non dans le
      // champ caché : React le vide après chaque tentative, et un second
      // essai aurait publié le texte sans elles.
      if (!jetons) {
        formData.delete("images");
        fichiers.forEach((f) => formData.append("images", f));
      }
      let r: EtatPublication;
      try {
        r = await (publication ? modifierPublication : publierPublication)(
          avant,
          formData,
        );
      } catch (e) {
        // Une redirection de Next — session expirée, par exemple — suit son
        // cours ; le reste est une panne de réseau.
        unstable_rethrow(e);
        return {
          etape: "erreur",
          erreur:
            "La publication n’est pas partie. Vérifiez votre connexion, puis réessayez.",
          photosPerdues: false,
        };
      }
      if (r.etape === "publiee") {
        setAvis(null);
        setOuvert(false);
        if (publication) {
          // La page se recharge avec la publication modifiée : la fenêtre
          // repartira de là à sa prochaine ouverture.
          annoncer("Publication modifiée");
        } else {
          setTexte("");
          setPublique(false);
          viderNouvelles();
          annoncer("Publication partagée dans le fil");
        }
      } else if (r.etape === "erreur" && r.photosPerdues) {
        // Les envois faits d'avance ont été consommés par la tentative.
        viderNouvelles();
      }
      return r;
    },
    PUBLICATION_VIERGE,
  );

  // À l'ouverture : la zone prend la hauteur du brouillon et le curseur —
  // après `showModal`, qui donnerait sinon le focus à la croix.
  useEffect(() => {
    if (!ouvert) return;
    ajuster(zone.current);
    if (versPhotos.current) {
      versPhotos.current = false;
      choix.current?.click();
    } else {
      zone.current?.focus();
    }
  }, [ouvert]);

  const ajouter = (liste: FileList | null) => {
    if (!liste?.length) return;
    const images = Array.from(liste).filter((f) => f.type.startsWith("image/"));
    const place = PHOTOS_PAR_PUBLICATION - photos.length;
    setAvis(
      images.length > place
        ? `${PHOTOS_PAR_PUBLICATION} photos au plus par publication.`
        : images.length < liste.length
          ? "Seules les images sont acceptées."
          : null,
    );
    const ajoutees = images
      .slice(0, Math.max(0, place))
      .map((fichier): Photo => ({
        cle: `photo-${rang.current++}`,
        type: "nouvelle",
        fichier,
        apercu: URL.createObjectURL(fichier),
      }));
    if (ajoutees.length) setPhotos((l) => [...l, ...ajoutees]);
    setCaduque(etat);
  };

  const retirer = (photo: Photo) => {
    setAvis(null);
    if (photo.type === "nouvelle") URL.revokeObjectURL(photo.apercu);
    setPhotos((l) => l.filter((x) => x.cle !== photo.cle));
  };

  const tropLourd = poids > PLAFOND_FICHIER;
  const vide = !texte.trim() && !photos.length;
  const bloque = vide || tropLourd || envoi;
  const erreur =
    etat.etape === "erreur" && etat !== caduque
      ? etat.photosPerdues
        ? `${etat.erreur} Ajoutez vos photos à nouveau.`
        : etat.erreur
      : null;
  const message = tropLourd
    ? `Les photos dépassent ${PLAFOND_FICHIER_MO} Mo à elles toutes : envoyez-en moins à la fois.`
    : (erreur ?? avis);
  const reste = LONGUEUR_PUBLICATION - texte.length;

  return (
    <>
      {publication ? (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setOuvert(true)}
          aria-label="Modifier ma publication"
          title="Modifier"
          className={`${BTN_ICONE} hover:border-faint hover:text-ink`}
        >
          <Pencil size={15} />
        </button>
      ) : (
        <div className="mb-3 flex items-center gap-2.5 rounded-[var(--radius-m)] border border-line bg-surface p-3">
          {avatar}
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setOuvert(true)}
            // L'invite tient sur deux lignes au besoin : dans une colonne
            // étroite, une seule la tronquait au milieu de la phrase.
            className={`min-h-11 min-w-0 flex-1 cursor-pointer rounded-[22px] border-0 bg-surface-2 px-4 py-2 text-left text-[14px] leading-snug transition-colors hover:bg-surface-3 ${
              texte.trim() ? "text-ink" : "text-muted"
            }`}
          >
            <span className="line-clamp-2">{texte.trim() || INVITE}</span>
          </button>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label="Publier des photos"
            title="Publier des photos"
            onClick={() => {
              versPhotos.current = true;
              setOuvert(true);
            }}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent px-3 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Images size={19} className="text-success-strong" aria-hidden />
            <span className="hidden sm:inline">Photo</span>
          </button>
        </div>
      )}

      <Modal
        title={
          publication ? "Modifier la publication" : "Créer une publication"
        }
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
      >
        {() => (
          <form
            action={publier}
            className="flex flex-col gap-3.5 px-5 pb-5 pt-4"
          >
            {publication ? (
              <input type="hidden" name="newsId" value={publication.id} />
            ) : null}
            <input
              type="hidden"
              name="diffusion"
              value={publique ? "public" : "membres"}
            />

            <div className="flex items-center gap-2.5">
              {avatar}
              <div className="min-w-0">
                <div className="truncate text-[14.2px] font-semibold">
                  {entreprise}
                </div>
                {/* À qui la publication se montre : le membre en décide. */}
                <div
                  role="radiogroup"
                  aria-label="Qui peut voir cette publication"
                  className="mt-1 inline-flex rounded-full bg-surface-2 p-0.5"
                >
                  <ChoixDiffusion
                    actif={!publique}
                    onClick={() => setPublique(false)}
                    icone={<Users size={12} aria-hidden />}
                  >
                    Membres
                  </ChoixDiffusion>
                  <ChoixDiffusion
                    actif={publique}
                    onClick={() => setPublique(true)}
                    icone={<Globe size={12} aria-hidden />}
                  >
                    Public
                  </ChoixDiffusion>
                </div>
              </div>
            </div>
            <p className="-mt-1.5 m-0 text-[12px] text-faint">
              {publique
                ? "Visible par tout le monde, aussi sur le site public de la chambre."
                : "Visible par les membres seulement, sur la plateforme."}
            </p>

            <textarea
              ref={zone}
              name="texte"
              value={texte}
              onChange={(e) => {
                setTexte(e.target.value);
                setCaduque(etat);
                ajuster(e.target);
              }}
              maxLength={LONGUEUR_PUBLICATION}
              rows={3}
              placeholder={INVITE}
              aria-label="Votre publication"
              // Un mot court s'écrit en grand, comme une annonce ; un texte
              // long ou des photos ramènent la taille de lecture.
              className={`block min-h-[96px] w-full resize-none border-0 bg-transparent p-0 leading-snug text-ink outline-none placeholder:text-faint ${
                texte.length > 110 || photos.length
                  ? "text-[15px]"
                  : "text-[19px]"
              }`}
            />
            {reste <= RESTE_ANNONCE ? (
              <span className="-mt-2 self-end text-[11.5px] tabular-nums text-faint">
                {reste} caractère{reste > 1 ? "s" : ""} restant
                {reste > 1 ? "s" : ""}
              </span>
            ) : null}

            {photos.length ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => {
                  const envoiPhoto =
                    p.type === "nouvelle" ? etats[nouvelles.indexOf(p)] : null;
                  return (
                    <div
                      key={p.cle}
                      className="relative aspect-square overflow-hidden rounded-[var(--radius-s)] border border-line bg-surface-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.type === "existante" ? p.url : p.apercu}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {envoiPhoto && !envoiPhoto.masque ? (
                        <VoileEnvoi envoi={envoiPhoto} />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => retirer(p)}
                        aria-label={`Retirer la photo ${i + 1}`}
                        title="Retirer la photo"
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-[#0f1d2c]/75 text-white hover:bg-[#0f1d2c]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <ChampsPhotos ordre={ordre} fichiers={fichiers} jetons={jetons} />

            <div className="flex items-center justify-between gap-3 rounded-[var(--radius-m)] border border-line px-3.5 py-1.5">
              <span className="text-[13.2px] font-semibold">
                Ajouter à votre publication
              </span>
              {photos.length < PHOTOS_PAR_PUBLICATION ? (
                <label
                  title="Ajouter des photos"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-success-strong transition-colors hover:bg-surface-2 focus-within:ring-2 focus-within:ring-accent"
                >
                  <Images size={21} aria-hidden />
                  <span className="sr-only">Ajouter des photos</span>
                  <input
                    ref={choix}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      ajouter(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              ) : (
                <span className="text-[12px] tabular-nums text-faint">
                  {photos.length} / {PHOTOS_PAR_PUBLICATION} photos
                </span>
              )}
            </div>

            {message ? (
              <p
                role="alert"
                className="m-0 text-[12.8px] font-semibold text-bad"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={bloque}
              // La charte donne un sablier à tout bouton désactivé : ici,
              // il l'est aussi quand il n'y a simplement rien à publier.
              style={bloque && !envoi ? { cursor: "not-allowed" } : undefined}
              className="btn-action w-full"
            >
              {envoi ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />{" "}
                  {publication ? "Enregistrement…" : "Publication…"}
                </>
              ) : publication ? (
                "Enregistrer"
              ) : (
                "Publier"
              )}
            </button>
            <p className="m-0 text-center text-[11.8px] text-faint">
              Publiée au nom de votre entreprise. L’équipe CanCham peut la
              modifier ou la retirer.
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}

/** Une des deux options de diffusion, en pastille. */
function ChoixDiffusion({
  actif,
  onClick,
  icone,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={actif}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1 rounded-full border-0 px-2.5 py-1 text-[11.8px] font-semibold transition-colors ${
        actif
          ? "bg-surface text-ink shadow-[0_1px_3px_rgba(15,29,44,0.18)]"
          : "bg-transparent text-muted hover:text-ink"
      }`}
    >
      {icone} {children}
    </button>
  );
}

/**
 * Ce que le formulaire envoie pour les photos : leurs jetons une fois
 * toutes arrivées, sinon les fichiers eux-mêmes — une publication validée
 * avant la fin des envois part quand même, les photos dans le formulaire.
 * `ordre` dit au serveur où ranger chacune, gardée ou nouvelle.
 */
function ChampsPhotos({
  ordre,
  fichiers,
  jetons,
}: {
  ordre: string[];
  fichiers: File[];
  jetons: string[] | null;
}) {
  const champ = useRef<HTMLInputElement>(null);

  // Un `FileList` ne se modifie pas : on le reconstruit à chaque changement.
  useEffect(() => {
    if (!champ.current) return;
    const dt = new DataTransfer();
    fichiers.forEach((f) => dt.items.add(f));
    champ.current.files = dt.files;
  }, [fichiers]);

  return (
    <>
      <input type="hidden" name="ordre" value={JSON.stringify(ordre)} />
      <input
        ref={champ}
        type="file"
        name={jetons ? undefined : "images"}
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <JetonsEnvoyes name="images" jetons={jetons} />
    </>
  );
}

/** Le membre retire sa propre publication, après confirmation. */
export function SupprimerMaPublication({
  newsId,
  commentaires,
}: {
  newsId: string;
  commentaires: number;
}) {
  return (
    <Modal
      title="Supprimer ma publication"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          aria-label="Supprimer ma publication"
          title="Supprimer"
          className={`${BTN_ICONE} hover:border-accent hover:text-accent`}
        >
          <Trash2 size={15} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={supprimerMaPublication}>
          <input type="hidden" name="newsId" value={newsId} />
          <ModalBody>
            <p className="m-0 text-[13.6px] text-muted">
              Votre publication disparaîtra du fil
              {commentaires
                ? `, avec ses ${commentaires} commentaire${commentaires > 1 ? "s" : ""}`
                : ""}
              . Cette suppression est définitive.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Suppression…">
              <Trash2 size={14} /> Supprimer
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** La zone de texte grandit avec ce qu'on y écrit. */
function ajuster(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/**
 * Confirme par le message de la page, celui de toutes les actions : il se
 * lit dans l'adresse. `replaceState` la réécrit sans navigation, et Next
 * suit.
 */
function annoncer(message: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("msg", message);
  url.searchParams.delete("ton");
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}
