import { Fragment } from "react";
import { Composeur } from "@/components/messagerie/Composeur";
import { DefilerEnBas } from "@/components/messagerie/DefilerEnBas";
import {
  EnTeteConversation,
  type InfoConversation,
} from "@/components/messagerie/EnTeteConversation";
import { ListeFils, type ResumeFil } from "@/components/messagerie/ListeFils";
import { PiecesJointes } from "@/components/messagerie/PiecesJointes";
import { Saillant, ViewHead } from "@/components/ui";
import { COORDONNEES } from "@/lib/coordonnees";
import { heureExacte, jourLisible } from "@/lib/enums";
import { getMembresJoignables, getThreads } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import type { Message, MessageThread, Space } from "@/lib/types";

/** Ce que montre l'aperçu d'un fil quand son dernier message n'a pas de texte. */
function apercu(m: Message | undefined): string {
  if (!m) return "Nouvelle conversation";
  if (m.texte) return m.texte;
  const p = m.pieces[0];
  if (!p) return "";
  const libelle = { image: "Photo", video: "Vidéo", pdf: p.nom }[p.type];
  return `📎 ${libelle}${m.pieces.length > 1 ? ` +${m.pieces.length - 1}` : ""}`;
}

export async function MessageriePage({
  space,
  threadId,
}: {
  space: Space;
  threadId?: string;
}) {
  const user = await getCurrentUser(space);
  const [threads, membres] = await Promise.all([
    getThreads(user.id),
    // La recherche de personnes ouvre de nouvelles conversations côté membre ;
    // le back-office n'a pas de fiche membre à partir de laquelle écrire.
    space === "membre"
      ? getMembresJoignables(user.memberId)
      : Promise.resolve([]),
  ]);
  const active = threads.find((t) => t.id === threadId) ?? threads[0];
  const base = `/${space}/messagerie`;

  const resumes: ResumeFil[] = threads.map((t) => ({
    id: t.id,
    nom: t.nom,
    sousTitre: t.sousTitre,
    avatar: t.avatar ?? null,
    init: t.init,
    type: t.type,
    unread: t.unread,
    heure: t.messages.at(-1)?.heure ?? "",
    apercu: apercu(t.messages.at(-1)),
  }));

  return (
    <>
      <ViewHead
        title={
          <>
            Messa<Saillant>gerie</Saillant>
          </>
        }
      >
        {space === "admin"
          ? "Échangez avec les membres et les comités depuis l’espace d’administration."
          : "Échangez directement avec un autre membre ou un groupe : comités, organisateurs d’événements, équipe CanCham."}
      </ViewHead>

      <div className="flex border border-line rounded-[var(--radius-m)] bg-surface overflow-hidden h-[min(680px,calc(100vh-220px))] min-h-[480px] flex-col md:flex-row">
        <ListeFils
          fils={resumes}
          actifId={active?.id ?? ""}
          base={base}
          space={space}
          membres={membres}
        />

        {active ? (
          <Conversation
            fil={active}
            space={space}
            memberIdCourant={user.memberId}
          />
        ) : (
          <p className="m-auto text-[13.4px] text-faint">
            Aucune conversation.
          </p>
        )}
      </div>
    </>
  );
}

function Conversation({
  fil,
  space,
  memberIdCourant,
}: {
  fil: MessageThread;
  space: Space;
  memberIdCourant: string | null;
}) {
  const lienProfil = fil.membre
    ? fil.membre.id === memberIdCourant
      ? "/membre/profil"
      : space === "admin"
        ? `/admin/membres/${fil.membre.id}`
        : `/membre/annuaire/${fil.membre.id}`
    : null;

  const equipe = fil.nom === "Équipe CanCham" && !fil.membre;

  const info: InfoConversation = {
    type: fil.type,
    contact: fil.contact ?? null,
    entreprise:
      fil.membre && lienProfil
        ? { nom: fil.membre.nom, lienProfil, siteweb: fil.membre.siteweb }
        : null,
    equipe: equipe
      ? { telephone: COORDONNEES.telephone, email: COORDONNEES.email }
      : null,
  };

  const dernier = fil.messages.at(-1)?.id ?? "vide";

  return (
    // `relative` : le panneau d'information se pose sur la droite de la conversation.
    <div className="flex-1 min-w-0 min-h-0 flex flex-col relative">
      <EnTeteConversation
        nom={fil.nom}
        sousTitre={fil.sousTitre}
        avatar={fil.avatar ?? null}
        init={fil.init}
        info={info}
        messages={fil.messages.map((m) => ({
          id: m.id,
          de: m.moi ? "Vous" : m.de,
          texte: m.texte,
          heure: m.heure,
          pieces: m.pieces,
        }))}
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-[18px] flex flex-col gap-2.5">
        {fil.messages.length === 0 ? (
          <p className="m-auto text-[13px] text-faint text-center max-w-[32ch]">
            Aucun message pour l’instant. Écrivez le premier.
          </p>
        ) : null}

        {fil.messages.map((m, i) => {
          // Un séparateur dès que l'on change de jour, et devant le premier
          // message : sans lui, trois heures et trois jours se ressemblent.
          const jour = jourLisible(m.envoyeLe);
          const nouveauJour =
            i === 0 || jourLisible(fil.messages[i - 1].envoyeLe) !== jour;

          return (
            <Fragment key={m.id}>
              {nouveauJour ? (
                <div className="self-center my-1.5 text-[11px] font-semibold text-muted bg-surface-2 border border-line rounded-full px-3 py-1">
                  {jour}
                </div>
              ) : null}

              <div
                id={`msg-${m.id}`}
                className={`scroll-mt-20 max-w-[72%] px-3 py-2 text-[13.3px] leading-relaxed whitespace-pre-line ${
                  m.moi
                    ? "self-end bg-accent text-white rounded-[14px] rounded-br-[4px]"
                    : "self-start bg-surface-2 rounded-[14px] rounded-bl-[4px]"
                } ${m.pieces.length ? "min-w-[220px]" : ""}`}
              >
                {!m.moi && fil.type === "groupe" ? (
                  <div className="text-[10.6px] font-bold opacity-75 mb-0.5">
                    {m.de}
                  </div>
                ) : null}
                <PiecesJointes pieces={m.pieces} moi={m.moi} />
                {m.texte ? m.texte : null}
                {/* L'heure se loge dans la bulle, alignée à droite : posée
                    dessous, elle décalerait l'alignement des messages. */}
                <span
                  className={`block text-right text-[10.5px] mt-1 tabular-nums ${
                    m.moi ? "text-white/70" : "text-faint"
                  }`}
                >
                  {heureExacte(m.envoyeLe)}
                </span>
              </div>
            </Fragment>
          );
        })}

        <DefilerEnBas repere={`${fil.id}:${dernier}`} />
      </div>

      {/* Remonté à chaque nouveau message : texte et pièces choisies repartent à vide. */}
      <Composeur key={`${fil.id}:${dernier}`} threadId={fil.id} space={space} />
    </div>
  );
}
