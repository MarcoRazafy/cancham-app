"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  Building2,
  ChevronLeft,
  Headset,
  Maximize2,
  MessageCircle,
  SendHorizontal,
  X,
} from "lucide-react";
import { Pastille } from "@/components/messagerie/outils";
import { PiecesJointes } from "@/components/messagerie/PiecesJointes";
import { TexteLie } from "@/components/TexteLie";
import { ecrireAuSupport, markThreadRead } from "@/lib/actions/messages";
import { LOGO_EQUIPE } from "@/lib/avatars";
import { heureExacte, heureRelative, jourLisible } from "@/lib/enums";
import type {
  ConversationSupport,
  MessageSupport,
  ResumeSupport,
} from "@/lib/support";

/**
 * Bulle de support flottante, à la manière des bulles de discussion de
 * Messenger.
 *
 * Côté membre, elle ouvre la conversation avec l'équipe CanCham : on écrit,
 * l'équipe répond, la réponse arrive dans la bulle sans recharger la page.
 * Côté back-office, elle rassemble les demandes des membres et permet d'y
 * répondre depuis n'importe quel écran.
 *
 * Ce n'est qu'une fenêtre sur le fil d'assistance de la messagerie : la même
 * conversation se retrouve, entière, pièces jointes comprises, dans
 * « Messagerie ».
 *
 * La bulle se glisse n'importe où, se range contre le bord le plus proche
 * quand on la lâche, et retient sa place d'une page et d'une visite à l'autre.
 */

const TAILLE = 56;
const MARGE = 16;
/** Sous la barre supérieure : la bulle ne doit pas masquer la recherche. */
const HAUT_MIN = 80;
/** En deçà, un déplacement est un clic un peu appuyé. */
const SEUIL_GLISSE = 6;

/** Rythme de relecture : vif quand la conversation est sous les yeux. */
const RELECTURE_OUVERTE = 4_000;
const RELECTURE_FERMEE = 30_000;

/** Premiers mots proposés au membre qui n'a encore jamais écrit. */
const SUGGESTIONS = [
  "Je souhaite régler ma cotisation.",
  "J’ai une question sur un événement.",
  "Je voudrais réserver un service CanCham.",
  "Je rencontre un problème sur la plateforme.",
];

type Espace = "membre" | "admin";

/* ============================ Position retenue ============================ */

interface Position {
  cote: "gauche" | "droite";
  /** Hauteur relative, de 0 (en haut) à 1 (en bas) : survit au redimensionnement. */
  haut: number;
}

const DEFAUT: Position = { cote: "droite", haut: 0.82 };
const CLE = "cancham:bulle-support";

const abonnes = new Set<() => void>();

function sAbonner(rappel: () => void) {
  abonnes.add(rappel);
  window.addEventListener("storage", rappel);
  window.addEventListener("resize", rappel);
  return () => {
    abonnes.delete(rappel);
    window.removeEventListener("storage", rappel);
    window.removeEventListener("resize", rappel);
  };
}

function lirePosition(): string {
  try {
    return localStorage.getItem(CLE) ?? "";
  } catch {
    return "";
  }
}

const lireFenetre = () => `${window.innerWidth}x${window.innerHeight}`;

function enregistrerPosition(p: Position) {
  try {
    localStorage.setItem(CLE, JSON.stringify(p));
  } catch {
    /* Stockage indisponible : la bulle revient à sa place par défaut. */
  }
  abonnes.forEach((rappel) => rappel());
}

function versPosition(brut: string): Position {
  try {
    const p = JSON.parse(brut);
    if ((p.cote === "gauche" || p.cote === "droite") && Number.isFinite(p.haut))
      return { cote: p.cote, haut: borne(p.haut, 0, 1) };
  } catch {
    /* Valeur absente ou abîmée. */
  }
  return DEFAUT;
}

const borne = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/* ============================ État du panneau ============================ */

/*
 * L'état du panneau vit hors du composant : ouvert ou fermé, la demande
 * suivie par l'équipe et les brouillons survivent à un nouveau rendu de la
 * coquille. Un message à moitié écrit ne se perd pas en refermant la bulle.
 */
interface EtatPanneau {
  ouvert: boolean;
  /** Demande ouverte par l'équipe ; `null` = la liste. */
  fil: string | null;
  /** Messages non lus, pour la pastille. */
  nonLus: number;
  /** Brouillon par conversation. */
  brouillons: Record<string, string>;
}

const ETAT_INITIAL: EtatPanneau = {
  ouvert: false,
  fil: null,
  nonLus: 0,
  brouillons: {},
};
let etatPanneau = ETAT_INITIAL;
const abonnesPanneau = new Set<() => void>();

function sAbonnerPanneau(rappel: () => void) {
  abonnesPanneau.add(rappel);
  return () => {
    abonnesPanneau.delete(rappel);
  };
}

function modifierPanneau(maj: Partial<EtatPanneau>) {
  etatPanneau = { ...etatPanneau, ...maj };
  abonnesPanneau.forEach((rappel) => rappel());
}

/* ============================ Données ============================ */

interface Donnees {
  /** Adresse interrogée : une réponse tardive d'une autre demande est ignorée. */
  cle: string;
  conversation: ConversationSupport | null;
  fils: ResumeSupport[];
}

/* ============================ Bulle ============================ */

export function BulleSupport({
  espace,
  prenom,
}: {
  espace: Espace;
  /** Prénom de la personne connectée, pour l'accueil. */
  prenom: string;
}) {
  const pathname = usePathname();

  const brut = useSyncExternalStore(sAbonner, lirePosition, () => "");
  const fenetre = useSyncExternalStore(sAbonner, lireFenetre, () => "");
  const position = useMemo(() => versPosition(brut), [brut]);

  const panneauEtat = useSyncExternalStore(
    sAbonnerPanneau,
    () => etatPanneau,
    () => ETAT_INITIAL,
  );
  const { ouvert, nonLus } = panneauEtat;
  const filActif = espace === "admin" ? panneauEtat.fil : null;
  const setOuvert = (o: boolean) => modifierPanneau({ ouvert: o });

  const [glisse, setGlisse] = useState<{ x: number; y: number } | null>(null);
  const depart = useRef<{ px: number; py: number; x: number; y: number }>(null);
  const aGlisse = useRef(false);
  const bulle = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);
  const saisie = useRef<HTMLTextAreaElement>(null);
  const defilement = useRef<HTMLDivElement>(null);

  // Sur la messagerie complète, la bulle ferait doublon.
  const masquee = pathname.startsWith(`/${espace}/messagerie`);

  /* ---------- Lecture ---------- */

  const url = `/api/support?espace=${espace}${
    filActif ? `&t=${encodeURIComponent(filActif)}` : ""
  }`;
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [erreur, setErreur] = useState(false);
  const derniereDemande = useRef(0);

  const charger = useCallback(async () => {
    const numero = ++derniereDemande.current;
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as {
        conversation: ConversationSupport | null;
        fils?: ResumeSupport[];
        nonLus: number;
      };
      if (numero !== derniereDemande.current) return;
      setDonnees({
        cle: url,
        conversation: d.conversation,
        fils: d.fils ?? [],
      });
      setErreur(false);
      modifierPanneau({ nonLus: d.nonLus });
    } catch {
      if (numero === derniereDemande.current) setErreur(true);
    }
  }, [url]);

  // Relecture régulière, plus vive bulle ouverte ; aucune quand l'onglet est
  // caché. Changer de page relit aussi : une réponse a pu arriver entre-temps.
  useEffect(() => {
    if (masquee) return;
    const lire = () => {
      if (!document.hidden) charger();
    };
    lire();
    const minuterie = setInterval(
      lire,
      ouvert ? RELECTURE_OUVERTE : RELECTURE_FERMEE,
    );
    document.addEventListener("visibilitychange", lire);
    return () => {
      clearInterval(minuterie);
      document.removeEventListener("visibilitychange", lire);
    };
  }, [charger, ouvert, masquee, pathname]);

  const conversation = donnees?.cle === url ? donnees.conversation : null;
  const fils = donnees?.fils ?? [];
  const chargement = !donnees || (filActif !== null && donnees.cle !== url);

  /* ---------- Lecture des messages reçus ---------- */

  const marque = useRef<string | null>(null);
  useEffect(() => {
    if (!ouvert || !conversation?.nonLus) return;
    const repere = `${conversation.id}:${conversation.messages.at(-1)?.id}`;
    if (marque.current === repere) return;
    marque.current = repere;
    markThreadRead(conversation.id, espace)
      .then(charger)
      .catch(() => {});
  }, [ouvert, conversation, espace, charger]);

  /* ---------- Envoi ---------- */

  const cleBrouillon = espace === "membre" ? "membre" : (filActif ?? "");
  const brouillon = panneauEtat.brouillons[cleBrouillon] ?? "";
  const setBrouillon = (texte: string) =>
    modifierPanneau({
      brouillons: { ...etatPanneau.brouillons, [cleBrouillon]: texte },
    });
  const [envoi, setEnvoi] = useState<string | null>(null);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);

  const envoyer = async () => {
    const texte = brouillon.trim();
    if (!texte || envoi) return;
    setEnvoi(texte);
    setErreurEnvoi(null);
    setBrouillon("");
    if (saisie.current) saisie.current.style.height = "auto";
    try {
      const r = await ecrireAuSupport(espace, conversation?.id ?? null, texte);
      if (!r.ok) {
        setErreurEnvoi(r.erreur);
        setBrouillon(texte);
      }
      await charger();
    } catch {
      setErreurEnvoi("Le message n’est pas parti. Réessayez dans un instant.");
      setBrouillon(texte);
    } finally {
      setEnvoi(null);
      saisie.current?.focus();
    }
  };

  /* ---------- Défilement : toujours sur le dernier message ---------- */

  const dernier = conversation?.messages.at(-1)?.id;
  useEffect(() => {
    const zone = defilement.current;
    if (zone) zone.scrollTop = zone.scrollHeight;
  }, [ouvert, conversation?.id, dernier, envoi]);

  /* ---------- Fermeture : clic à côté, touche Échap ---------- */

  useEffect(() => {
    if (!ouvert) return;
    // Une image agrandie depuis le panneau garde la main.
    const dialogueOuvert = () => !!document.querySelector("dialog[open]");
    const clic = (e: globalThis.PointerEvent) => {
      const cible = e.target as Node;
      if (
        dialogueOuvert() ||
        panneau.current?.contains(cible) ||
        bulle.current?.contains(cible)
      )
        return;
      setOuvert(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !dialogueOuvert()) setOuvert(false);
    };
    document.addEventListener("pointerdown", clic);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("pointerdown", clic);
      document.removeEventListener("keydown", touche);
    };
  }, [ouvert]);

  // Côté serveur, la fenêtre est inconnue.
  if (!fenetre || masquee) return null;

  /* ---------- Géométrie ---------- */

  const [L, H] = fenetre.split("x").map(Number);
  const yMax = Math.max(HAUT_MIN, H - TAILLE - MARGE);
  const repos = {
    x: position.cote === "droite" ? L - TAILLE - MARGE : MARGE,
    y: HAUT_MIN + position.haut * (yMax - HAUT_MIN),
  };
  const { x, y } = glisse ?? repos;

  const versPoint = (e: PointerEvent) => {
    const d = depart.current!;
    return {
      x: borne(d.x + e.clientX - d.px, 0, L - TAILLE),
      y: borne(d.y + e.clientY - d.py, 0, H - TAILLE),
    };
  };

  const auPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    depart.current = { px: e.clientX, py: e.clientY, x, y };
    aGlisse.current = false;
  };

  const auPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = depart.current;
    if (!d) return;
    if (
      !aGlisse.current &&
      Math.hypot(e.clientX - d.px, e.clientY - d.py) < SEUIL_GLISSE
    )
      return;
    if (!aGlisse.current) {
      aGlisse.current = true;
      setOuvert(false);
    }
    setGlisse(versPoint(e));
  };

  const telephone = L < 640;

  const basculer = () => {
    const ouvrir = !ouvert;
    setOuvert(ouvrir);
    // Sur ordinateur, on peut écrire aussitôt. Sur téléphone, le clavier
    // masquerait la conversation avant qu'on l'ait lue.
    if (ouvrir && !telephone) setTimeout(() => saisie.current?.focus(), 50);
  };

  /*
   * L'ouverture se décide au relâchement plutôt qu'au clic : avec la capture
   * du pointeur, un toucher sur téléphone ne produit pas toujours de clic.
   * Relâcher sans avoir glissé ouvre ou ferme ; relâcher après un glisser
   * range la bulle.
   */
  const auPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!depart.current) return;
    const fin = versPoint(e);
    depart.current = null;
    if (!aGlisse.current) {
      if (e.type === "pointerup") basculer();
      return;
    }
    // On la lâche : elle se range contre le bord le plus proche.
    enregistrerPosition({
      cote: fin.x + TAILLE / 2 < L / 2 ? "gauche" : "droite",
      haut: borne((fin.y - HAUT_MIN) / (yMax - HAUT_MIN || 1), 0, 1),
    });
    setGlisse(null);
  };

  /** Seul le clavier (Entrée, Espace) passe par le clic : `detail` vaut 0. */
  const auClic = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) basculer();
  };

  /* ---------- Panneau ---------- */

  // Sur ordinateur, le panneau s'ouvre à côté de la bulle, centré sur elle
  // sans sortir de l'écran.
  const hauteurPanneau = Math.min(620, H - 24);
  const stylePanneau: CSSProperties = telephone
    ? {
        left: 8,
        right: 8,
        bottom: 8,
        height: Math.min(Math.round(H * 0.85), 640),
      }
    : {
        width: Math.min(400, L - 2 * (MARGE + TAILLE + 12)),
        [position.cote === "droite" ? "right" : "left"]: MARGE + TAILLE + 12,
        top: borne(
          y + TAILLE / 2 - hauteurPanneau / 2,
          12,
          H - hauteurPanneau - 12,
        ),
        height: hauteurPanneau,
      };

  const fermer = () => setOuvert(false);
  const liste = espace === "admin" && !filActif;
  const demandesNonLues = fils.filter((f) => f.nonLus > 0).length;
  const Icone = espace === "admin" ? Headset : MessageCircle;
  const libelle =
    espace === "admin" ? "Support membres" : "Écrire à l’équipe CanCham";

  const versMessagerie = `/${espace}/messagerie${
    conversation ? `?t=${conversation.id}` : ""
  }`;

  return (
    <>
      <button
        ref={bulle}
        type="button"
        aria-label={`${libelle}${nonLus ? ` — ${nonLus} message${nonLus > 1 ? "s" : ""} non lu${nonLus > 1 ? "s" : ""}` : ""}`}
        aria-expanded={ouvert}
        title={`${libelle} · glissez la bulle pour la déplacer`}
        onPointerDown={auPointerDown}
        onPointerMove={auPointerMove}
        onPointerUp={auPointerUp}
        onPointerCancel={auPointerUp}
        onClick={auClic}
        className={`print:hidden fixed z-[60] rounded-full flex items-center justify-center text-white border-2 border-white/90 select-none touch-none shadow-[0_10px_28px_-6px_rgba(15,29,44,0.6)] ${
          glisse
            ? "cursor-grabbing scale-110"
            : "cursor-pointer transition-[left,top,transform] duration-200 hover:scale-105"
        }`}
        style={{
          left: x,
          top: y,
          width: TAILLE,
          height: TAILLE,
          background: "var(--laterale)",
        }}
      >
        {ouvert ? <X size={24} aria-hidden /> : <Icone size={25} aria-hidden />}
        {nonLus && !ouvert ? (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px]">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-accent opacity-60 motion-safe:animate-ping"
            />
            <span className="relative min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center border-2 border-white tabular-nums">
              {nonLus}
            </span>
          </span>
        ) : null}
      </button>

      {ouvert ? (
        <div
          ref={panneau}
          role="dialog"
          aria-label={libelle}
          className={`anim-echelle print:hidden fixed z-[61] flex flex-col bg-surface text-ink border border-line rounded-[var(--radius-l)] shadow-[0_22px_60px_-14px_rgba(15,29,44,0.5)] overflow-hidden ${
            telephone
              ? "origin-bottom"
              : position.cote === "droite"
                ? "origin-right"
                : "origin-left"
          }`}
          style={stylePanneau}
        >
          {/* ---------- En-tête ---------- */}
          <div
            className="flex items-center gap-3 px-3.5 py-3 text-white shrink-0"
            style={{ background: "var(--superieure)" }}
          >
            {espace === "admin" && filActif ? (
              <button
                type="button"
                onClick={() => modifierPanneau({ fil: null })}
                aria-label="Retour aux demandes"
                className="w-8 h-8 -mr-1 rounded-md bg-transparent hover:bg-white/10 text-white flex items-center justify-center cursor-pointer border-0 shrink-0"
              >
                <ChevronLeft size={19} />
              </button>
            ) : null}

            {liste ? (
              <span className="w-10 h-10 rounded-full bg-white/12 flex items-center justify-center shrink-0">
                <Headset size={19} aria-hidden />
              </span>
            ) : (
              <span className="relative shrink-0">
                <Pastille
                  src={
                    espace === "membre"
                      ? LOGO_EQUIPE
                      : (conversation?.avatar ?? null)
                  }
                  alt=""
                  initiales={conversation?.init ?? "…"}
                  taille={40}
                  className="bg-white/15 text-white"
                />
                {espace === "membre" ? (
                  <span
                    aria-hidden
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#2fbf71] border-2 border-[#12243a]"
                  />
                ) : null}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold leading-tight truncate">
                {liste
                  ? "Support membres"
                  : espace === "membre"
                    ? (conversation?.nom ?? "Équipe CanCham")
                    : (conversation?.nom ?? "Chargement…")}
              </div>
              <div className="text-[12px] text-white/65 truncate">
                {liste
                  ? demandesNonLues
                    ? `${demandesNonLues} demande${demandesNonLues > 1 ? "s" : ""} en attente de lecture`
                    : "Toutes les demandes sont lues"
                  : espace === "membre"
                    ? "Support membres · réponse ici même"
                    : conversation?.sousTitre || "Assistance"}
              </div>
            </div>

            {espace === "admin" && conversation?.membreId ? (
              <Link
                href={`/admin/membres/${conversation.membreId}`}
                onClick={fermer}
                aria-label="Ouvrir la fiche du membre"
                title="Fiche du membre"
                className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
              >
                <Building2 size={15} />
              </Link>
            ) : null}
            <Link
              href={versMessagerie}
              onClick={fermer}
              aria-label="Ouvrir dans la messagerie"
              title="Ouvrir dans la messagerie"
              className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
            >
              <Maximize2 size={15} />
            </Link>
            <button
              type="button"
              onClick={fermer}
              aria-label="Fermer"
              className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border-0 shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* ---------- Corps ---------- */}
          {liste ? (
            <ListeDemandes
              fils={fils}
              chargement={chargement}
              erreur={erreur}
              ouvrir={(id) => modifierPanneau({ fil: id })}
            />
          ) : (
            <>
              <div
                ref={defilement}
                aria-live="polite"
                className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 flex flex-col gap-1.5 bg-[#f7f9fc]"
              >
                {erreur && !conversation ? (
                  <p className="m-auto text-[13px] text-bad text-center">
                    Le support ne répond pas pour le moment.
                  </p>
                ) : chargement ? (
                  <p className="m-auto text-[13px] text-faint">Chargement…</p>
                ) : conversation?.messages.length ? (
                  <FilMessages
                    messages={conversation.messages}
                    espace={espace}
                  />
                ) : espace === "membre" ? (
                  <Accueil
                    prenom={prenom}
                    choisir={(texte) => {
                      setBrouillon(texte);
                      saisie.current?.focus();
                    }}
                  />
                ) : (
                  <p className="m-auto text-[13px] text-faint text-center">
                    Aucun message dans cette conversation.
                  </p>
                )}

                {envoi ? (
                  <div className="self-end max-w-[82%] px-3 py-2 text-[13.3px] leading-relaxed whitespace-pre-line bg-accent text-white rounded-[14px] rounded-br-[4px] opacity-60">
                    {envoi}
                    <span className="block text-right text-[10.5px] mt-1 text-white/80">
                      Envoi…
                    </span>
                  </div>
                ) : null}
              </div>

              {/* ---------- Saisie ---------- */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  envoyer();
                }}
                className="shrink-0 border-t border-line bg-surface px-3 pt-2.5 pb-3"
              >
                {erreurEnvoi ? (
                  <p role="alert" className="m-0 mb-2 text-[12.5px] text-bad">
                    {erreurEnvoi}
                  </p>
                ) : null}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={saisie}
                    value={brouillon}
                    onChange={(e) => {
                      setBrouillon(e.target.value);
                      const t = e.currentTarget;
                      t.style.height = "auto";
                      t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      // Entrée envoie, Maj + Entrée passe à la ligne.
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        envoyer();
                      }
                    }}
                    rows={1}
                    aria-label="Votre message"
                    placeholder={
                      espace === "membre"
                        ? "Écrivez votre message…"
                        : "Répondre au membre…"
                    }
                    disabled={espace === "admin" && !conversation}
                    className="flex-1 min-w-0 resize-none rounded-[20px] border border-line bg-surface-2 text-ink px-3.5 py-2.5 text-[13.5px] leading-[1.4] outline-none focus:border-navy focus:bg-surface max-h-[120px]"
                  />
                  <button
                    type="submit"
                    disabled={!brouillon.trim() || envoi !== null}
                    aria-label="Envoyer"
                    className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0 border-0 cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-default"
                  >
                    <SendHorizontal size={17} />
                  </button>
                </div>
                {/* Sur écran tactile, pas de touche Maj : l'aide n'y a pas de sens. */}
                <p className="m-0 mt-1.5 text-[11px] text-faint pointer-coarse:hidden">
                  Entrée pour envoyer · Maj + Entrée pour aller à la ligne
                </p>
              </form>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

/* ============================ Messages ============================ */

function FilMessages({
  messages,
  espace,
}: {
  messages: MessageSupport[];
  espace: Espace;
}) {
  return (
    <>
      {messages.map((m, i) => {
        const precedent = messages[i - 1];
        // Un séparateur dès que l'on change de jour, et devant le premier.
        const jour = jourLisible(m.envoyeLe);
        const nouveauJour =
          !precedent || jourLisible(precedent.envoyeLe) !== jour;
        // Qui, dans l'équipe, a répondu : le nom en tête de chaque suite.
        const signe =
          m.equipe &&
          !m.supprime &&
          (nouveauJour || precedent?.de !== m.de || precedent?.moi);

        const cote = m.moi ? "self-end" : "self-start";
        return (
          <Fragment key={m.id}>
            {nouveauJour ? (
              <div className="self-center my-1.5 text-[11px] font-semibold text-muted bg-surface border border-line rounded-full px-3 py-1">
                {jour}
              </div>
            ) : null}
            {signe ? (
              <div className="self-start mt-1 -mb-0.5 ml-1 text-[11px] font-semibold text-muted">
                {m.de}
                {espace === "membre" ? " · Équipe CanCham" : " · équipe"}
              </div>
            ) : null}
            {m.supprime ? (
              <div
                className={`${cote} max-w-[82%] px-3 py-2 rounded-[14px] border border-dashed border-line text-[12.5px] italic text-faint`}
              >
                {m.moi
                  ? "Vous avez supprimé ce message"
                  : "Ce message a été supprimé"}
              </div>
            ) : (
              <div
                className={`${cote} max-w-[82%] min-w-0 px-3 py-2 text-[13.3px] leading-relaxed whitespace-pre-line [overflow-wrap:anywhere] ${
                  m.moi
                    ? "bg-accent text-white rounded-[14px] rounded-br-[4px]"
                    : "bg-surface border border-line rounded-[14px] rounded-bl-[4px]"
                } ${m.pieces.length ? "min-w-[200px]" : ""}`}
              >
                <PiecesJointes pieces={m.pieces} moi={m.moi} space={espace} />
                <TexteLie
                  texte={m.texte}
                  classeLien={
                    m.moi
                      ? "text-white underline underline-offset-2 decoration-white/60 hover:decoration-white [overflow-wrap:anywhere]"
                      : undefined
                  }
                />
                <span
                  className={`block text-right text-[10.5px] mt-1 tabular-nums ${
                    m.moi ? "text-white/70" : "text-faint"
                  }`}
                >
                  {heureExacte(m.envoyeLe)}
                </span>
              </div>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

/* ============================ Accueil du membre ============================ */

function Accueil({
  prenom,
  choisir,
}: {
  prenom: string;
  choisir: (texte: string) => void;
}) {
  return (
    <div className="my-auto flex flex-col gap-3">
      <div className="self-start max-w-[88%] px-3.5 py-3 bg-surface border border-line rounded-[14px] rounded-bl-[4px] text-[13.5px] leading-relaxed">
        <strong className="block mb-1">Bonjour {prenom},</strong>
        Une question sur votre adhésion, un paiement, un événement ou un service
        ? Écrivez-nous : l’équipe CanCham vous répond ici même, et la
        conversation reste dans votre messagerie.
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => choisir(s)}
            className="text-left text-[12.5px] font-medium px-3 py-1.5 rounded-full border border-accent/30 bg-accent-soft text-accent-strong cursor-pointer hover:border-accent/60"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================ Demandes, côté équipe ============================ */

function ListeDemandes({
  fils,
  chargement,
  erreur,
  ouvrir,
}: {
  fils: ResumeSupport[];
  chargement: boolean;
  erreur: boolean;
  ouvrir: (id: string) => void;
}) {
  if (erreur && !fils.length) {
    return (
      <p className="m-auto text-[13px] text-bad text-center px-6">
        Le support ne répond pas pour le moment.
      </p>
    );
  }
  if (chargement) {
    return <p className="m-auto text-[13px] text-faint">Chargement…</p>;
  }
  if (!fils.length) {
    return (
      <p className="m-auto text-[13px] text-faint text-center px-6">
        Aucune demande de membre pour l’instant.
      </p>
    );
  }
  return (
    <ul className="flex-1 min-h-0 overflow-y-auto m-0 p-0 list-none">
      {fils.map((f) => (
        <li key={f.id} className="border-b border-line last:border-b-0">
          <button
            type="button"
            onClick={() => ouvrir(f.id)}
            className="w-full flex gap-3 px-3.5 py-3 text-left bg-transparent border-0 cursor-pointer hover:bg-surface-2"
          >
            <Pastille
              src={f.avatar}
              alt=""
              initiales={f.init}
              taille={40}
              className="bg-accent-soft text-accent-strong"
            />
            <span className="flex-1 min-w-0">
              <span className="flex items-baseline gap-2">
                <span
                  className={`flex-1 min-w-0 truncate text-[13.5px] ${
                    f.nonLus ? "font-bold text-ink" : "font-semibold text-ink"
                  }`}
                >
                  {f.nom}
                </span>
                <span className="text-[11px] text-faint shrink-0 tabular-nums">
                  {heureRelative(new Date(f.le))}
                </span>
              </span>
              {f.sousTitre ? (
                <span className="block text-[11.5px] text-muted truncate">
                  {f.sousTitre}
                </span>
              ) : null}
              <span className="flex items-center gap-2 mt-0.5">
                <span
                  className={`flex-1 min-w-0 truncate text-[12.5px] ${
                    f.nonLus ? "text-ink font-medium" : "text-faint"
                  }`}
                >
                  {f.apercu}
                </span>
                {f.nonLus ? (
                  <span className="text-[10.5px] font-bold px-[7px] py-px rounded-full bg-accent text-white shrink-0">
                    {f.nonLus}
                  </span>
                ) : null}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
