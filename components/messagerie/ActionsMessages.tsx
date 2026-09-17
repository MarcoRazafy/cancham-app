"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Forward, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  FermerApresEnvoi,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import { supprimerMessage, transfererMessage } from "@/lib/actions/messages";
import { MAX_CIBLES_TRANSFERT } from "@/lib/messagerie";
import type { Space } from "@/lib/types";
import { ListeACocher, type ElementACocher } from "./ListeACocher";

/** Ce que les fenêtres rappellent du message visé. */
export interface MessageVise {
  id: string;
  de: string;
  apercu: string;
}

const Contexte = createContext<{
  transferer: (m: MessageVise) => void;
  supprimer: (m: MessageVise) => void;
} | null>(null);

export function useActionsMessages() {
  const c = useContext(Contexte);
  if (!c) throw new Error("useActionsMessages hors de <ActionsMessages>.");
  return c;
}

/**
 * Fenêtres « Transférer » et « Supprimer », une seule fois par conversation.
 *
 * Chaque bulle les ouvre par le contexte. Posées dans le menu de la bulle,
 * elles disparaîtraient avec lui dès le clic qui le referme.
 */
export function ActionsMessages({
  space,
  cibles,
  children,
}: {
  space: Space;
  /** Conversations existantes, puis personnes sans conversation ouverte. */
  cibles: { conversations: ElementACocher[]; personnes: ElementACocher[] };
  children: ReactNode;
}) {
  const [aTransferer, setATransferer] = useState<MessageVise | null>(null);
  const [aSupprimer, setASupprimer] = useState<MessageVise | null>(null);
  const [nombre, setNombre] = useState(0);

  const valeur = useMemo(
    () => ({
      transferer: (m: MessageVise) => {
        setNombre(0);
        setATransferer(m);
      },
      supprimer: setASupprimer,
    }),
    [],
  );

  const sections = useMemo(
    () => [
      { titre: "Conversations", elements: cibles.conversations },
      { titre: "Autres personnes", elements: cibles.personnes },
    ],
    [cibles],
  );

  return (
    <Contexte.Provider value={valeur}>
      {children}

      <Modal
        title="Transférer le message"
        ouvert={Boolean(aTransferer)}
        onFermer={() => setATransferer(null)}
      >
        {(fermer) =>
          aTransferer ? (
            <form action={transfererMessage}>
              <FermerApresEnvoi fermer={fermer} />
              <input type="hidden" name="messageId" value={aTransferer.id} />
              <input type="hidden" name="space" value={space} />
              <ModalBody>
                <Apercu message={aTransferer} />
                <ListeACocher
                  name="cible"
                  sections={sections}
                  max={MAX_CIBLES_TRANSFERT}
                  onCompte={setNombre}
                  placeholder="Rechercher une conversation, une personne…"
                />
              </ModalBody>
              <ModalFooter>
                <CancelButton onClick={fermer} />
                <SubmitButton pendingLabel="Transfert…" disabled={nombre === 0}>
                  <Forward size={14} /> Transférer
                  {nombre > 1 ? ` (${nombre})` : ""}
                </SubmitButton>
              </ModalFooter>
            </form>
          ) : null
        }
      </Modal>

      <Modal
        title="Supprimer le message"
        ouvert={Boolean(aSupprimer)}
        onFermer={() => setASupprimer(null)}
      >
        {(fermer) =>
          aSupprimer ? (
            <form action={supprimerMessage}>
              <FermerApresEnvoi fermer={fermer} />
              <input type="hidden" name="messageId" value={aSupprimer.id} />
              <input type="hidden" name="space" value={space} />
              <ModalBody>
                <Apercu message={aSupprimer} />
                <p className="m-0 text-[13.6px] leading-relaxed">
                  Le message sera supprimé pour tous les participants, avec ses
                  pièces jointes. La conversation indiquera seulement qu’un
                  message a été supprimé.
                </p>
              </ModalBody>
              <ModalFooter>
                <CancelButton onClick={fermer} />
                <SubmitButton pendingLabel="Suppression…" variant="danger">
                  <Trash2 size={14} /> Supprimer
                </SubmitButton>
              </ModalFooter>
            </form>
          ) : null
        }
      </Modal>
    </Contexte.Provider>
  );
}

function Apercu({ message }: { message: MessageVise }) {
  return (
    <blockquote className="m-0 border-l-[3px] border-accent bg-surface-2 rounded-r-[var(--radius-s)] px-3 py-2">
      <span className="block text-[11.4px] font-semibold text-muted">
        {message.de}
      </span>
      <span className="block text-[13px] text-ink line-clamp-3 whitespace-pre-line">
        {message.apercu}
      </span>
    </blockquote>
  );
}
