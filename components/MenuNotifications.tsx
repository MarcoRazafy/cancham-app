"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AlarmClock,
  Bell,
  BellOff,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CreditCard,
  FileText,
  MessageSquare,
  Newspaper,
  Tag,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Notification } from "@/lib/notifications";

const ICONES: Record<Notification["categorie"], LucideIcon> = {
  adhesion: UserPlus,
  paiement: CreditCard,
  message: MessageSquare,
  evenement: CalendarDays,
  actualite: Newspaper,
  offre: Tag,
  ressource: FileText,
  rappel: AlarmClock,
  rendezvous: CalendarClock,
};

/** Rouge pour ce qui presse, ocre pour ce qui attend, bleu nuit pour ce qui informe. */
const TUILES: Record<Notification["ton"], string> = {
  bad: "bg-accent text-white",
  warn: "bg-[#8a6410] text-white",
  info: "bg-[#14263a] text-white",
};

const CLE = "cancham:notifications-vues";

/**
 * Une notification reste « nouvelle » tant qu'on ne l'a pas vue sous cette
 * forme : « 2 messages non lus » devenu « 3 messages non lus » l'est à nouveau.
 */
const signature = (n: Notification) => `${n.id}:${n.titre}`;

/*
 * Mémoire des notifications vues, dans le stockage du navigateur. Lue comme
 * une source externe : le serveur n'en sait rien, et l'affichage se met à
 * jour dès qu'elle change, y compris depuis un autre onglet.
 */
const abonnes = new Set<() => void>();

function sAbonner(rappel: () => void) {
  abonnes.add(rappel);
  window.addEventListener("storage", rappel);
  return () => {
    abonnes.delete(rappel);
    window.removeEventListener("storage", rappel);
  };
}

function lireBrut(): string {
  try {
    return localStorage.getItem(CLE) ?? "[]";
  } catch {
    return "[]";
  }
}

function enregistrerVues(signatures: string[]) {
  try {
    localStorage.setItem(CLE, JSON.stringify(signatures));
  } catch {
    /* Stockage indisponible : tout restera « nouveau », sans gêne. */
  }
  abonnes.forEach((rappel) => rappel());
}

function versEnsemble(brut: string): Set<string> {
  try {
    return new Set(JSON.parse(brut));
  } catch {
    return new Set();
  }
}

/**
 * Cloche et fenêtre des notifications.
 *
 * Un clic sur une notification mène à la page qui la traite — la
 * conversation, la fiche, la facture —, pas à une liste où la chercher. Le
 * compteur ne retient que les nouvelles depuis la dernière ouverture ; cette
 * mémoire vit dans le navigateur, et son absence ne gêne rien : tout apparaît
 * alors comme nouveau.
 */
export function MenuNotifications({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  // `null` côté serveur : on n'y affiche aucun compteur de nouvelles.
  const brut = useSyncExternalStore(sAbonner, lireBrut, () => null);
  const vues = useMemo(
    () => (brut === null ? null : versEnsemble(brut)),
    [brut],
  );

  // Ce qui était déjà vu à l'ouverture : les nouvelles restent marquées dans
  // la fenêtre, même si le compteur de la cloche s'éteint aussitôt.
  const [vuesAOuverture, setVuesAOuverture] = useState<Set<string> | null>(
    null,
  );

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: Event) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !zone.current?.contains(e.target as Node)
      )
        setOuvert(false);
    };
    document.addEventListener("pointerdown", fermer);
    document.addEventListener("keydown", fermer);
    return () => {
      document.removeEventListener("pointerdown", fermer);
      document.removeEventListener("keydown", fermer);
    };
  }, [ouvert]);

  const nouvelles = vues
    ? notifications.filter((n) => !vues.has(signature(n)))
    : [];

  const ouvrir = () => {
    if (!ouvert) {
      // Ouvrir la fenêtre vaut avoir vu ce qu'elle contient.
      setVuesAOuverture(vues);
      enregistrerVues(notifications.map(signature));
    }
    setOuvert((o) => !o);
  };

  const urgentes = notifications.some((n) => n.ton !== "info");

  return (
    <div ref={zone} className="relative">
      <button
        type="button"
        onClick={ouvrir}
        aria-expanded={ouvert}
        aria-haspopup="dialog"
        aria-label={`Notifications${nouvelles.length ? ` (${nouvelles.length} nouvelle${nouvelles.length > 1 ? "s" : ""})` : ""}`}
        className={`relative w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer border-0 ${
          ouvert
            ? "bg-white/15 text-white"
            : "bg-transparent text-white/75 hover:text-white hover:bg-white/10"
        }`}
      >
        <Bell size={17} />
        {nouvelles.length ? (
          <span className="pastille absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0f1d2c]">
            {nouvelles.length}
          </span>
        ) : notifications.length && urgentes ? (
          <span className="pastille absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent border-2 border-[#0f1d2c]" />
        ) : null}
      </button>

      {ouvert ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="anim-echelle origin-top sm:origin-top-right fixed left-3 right-3 top-[70px] sm:absolute sm:left-auto sm:right-0 sm:top-12 z-50 sm:w-[380px] bg-surface text-ink border border-line rounded-[var(--radius-m)] shadow-[0_18px_48px_-18px_rgba(15,29,44,0.55)] overflow-hidden"
        >
          <div
            className="h-1"
            style={{ background: "var(--marque-degrade)" }}
            aria-hidden="true"
          />
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
            <div>
              <div className="font-bold text-[15px]">Notifications</div>
              <div className="text-[12px] text-muted">
                {notifications.length
                  ? `${notifications.length} à suivre`
                  : "Rien à suivre"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              aria-label="Fermer"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted cursor-pointer border-0 bg-transparent hover:bg-surface-2 hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>

          {notifications.length ? (
            <ul className="list-none m-0 p-0 max-h-[min(70vh,460px)] overflow-y-auto">
              {notifications.map((n) => {
                const Icone = ICONES[n.categorie];
                const nouvelle = vuesAOuverture
                  ? !vuesAOuverture.has(signature(n))
                  : false;
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => setOuvert(false)}
                      className={`group flex items-center gap-3 px-4 py-3 no-underline border-b border-line last:border-b-0 ${
                        nouvelle ? "bg-accent-soft/40" : ""
                      } hover:bg-surface-2`}
                    >
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TUILES[n.ton]}`}
                      >
                        <Icone size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.4px] font-semibold text-ink leading-snug">
                          {n.titre}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11.8px] text-muted mt-0.5">
                          {nouvelle ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          ) : null}
                          {n.temps}
                        </span>
                      </span>
                      <ChevronRight
                        size={16}
                        className="text-faint shrink-0 group-hover:text-accent group-hover:translate-x-0.5 transition-transform"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-9 text-center text-[13.4px] text-muted">
              <BellOff size={24} className="text-faint" />
              Tout est à jour.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
