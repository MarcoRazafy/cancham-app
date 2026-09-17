import { Fragment } from "react";
import { ActionsMessages } from "@/components/messagerie/ActionsMessages";
import { Bulle } from "@/components/messagerie/Bulle";
import { Composeur } from "@/components/messagerie/Composeur";
import { DefilerEnBas } from "@/components/messagerie/DefilerEnBas";
import {
  EnTeteConversation,
  type InfoConversation,
} from "@/components/messagerie/EnTeteConversation";
import type { ElementACocher } from "@/components/messagerie/ListeACocher";
import { ListeFils, type ResumeFil } from "@/components/messagerie/ListeFils";
import { MarquerLu } from "@/components/messagerie/MarquerLu";
import { Saillant, ViewHead } from "@/components/ui";
import { initialesDe } from "@/lib/avatars";
import { COORDONNEES } from "@/lib/coordonnees";
import { heureExacte, jourLisible } from "@/lib/enums";
import {
  getMembresJoignables,
  getPersonnesJoignables,
  getThreads,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import type {
  Message,
  MessageThread,
  Personne,
  Space,
  User,
} from "@/lib/types";

/** Ce que montre la liste des fils sous le nom d'une conversation. */
function apercu(fil: MessageThread): string {
  const m = fil.messages.at(-1);
  if (!m)
    return fil.type === "groupe" ? "Groupe créé" : "Nouvelle conversation";

  let corps: string;
  if (m.supprime) corps = "Message supprimé";
  else if (m.texte) corps = m.texte;
  else {
    const p = m.pieces[0];
    const libelle = p
      ? { image: "Photo", video: "Vidéo", pdf: p.nom }[p.type]
      : "";
    corps = `📎 ${libelle}${m.pieces.length > 1 ? ` +${m.pieces.length - 1}` : ""}`;
  }

  // Dans un groupe, on précise qui a écrit : « Lova : … ».
  if (fil.type === "groupe") {
    const auteur = m.moi ? "Vous" : m.de.split(" ")[0];
    return `${auteur} : ${corps}`;
  }
  return m.moi && !m.supprime ? `Vous : ${corps}` : corps;
}

const versElement = (p: Personne, valeur = p.id): ElementACocher => ({
  valeur,
  nom: p.nom,
  detail: [p.fonction, p.entreprise].filter(Boolean).join(" · "),
  avatar: p.photo,
  init: initialesDe(p.nom),
});

export async function MessageriePage({
  space,
  threadId,
}: {
  space: Space;
  threadId?: string;
}) {
  const user = await getCurrentUser(space);
  const [threads, membres, personnes] = await Promise.all([
    getThreads(user),
    // La recherche de personnes ouvre de nouvelles conversations côté membre ;
    // le back-office n'a pas de fiche membre à partir de laquelle écrire.
    space === "membre" ? getMembresJoignables(user) : Promise.resolve([]),
    getPersonnesJoignables(user.id),
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
    apercu: apercu(t),
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
          personnes={personnes.map((p) => versElement(p))}
        />

        {active ? (
          <Conversation
            fil={active}
            fils={threads}
            personnes={personnes}
            space={space}
            user={user}
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
  fils,
  personnes,
  space,
  user,
}: {
  fil: MessageThread;
  fils: MessageThread[];
  personnes: Personne[];
  space: Space;
  user: User;
}) {
  const lienProfil = fil.membre
    ? fil.membre.id === user.memberId
      ? "/membre/profil"
      : space === "admin"
        ? `/admin/membres/${fil.membre.id}`
        : `/membre/annuaire/${fil.membre.id}`
    : null;

  // L'assistance vue par le membre : il parle à la chambre, pas à quelqu'un.
  const equipe = fil.equipe && !fil.contact;

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

  // Transfert : toutes ses conversations, puis les personnes avec qui aucun
  // échange individuel n'est encore ouvert — les autres y sont déjà.
  const dejaEnContact = new Set(
    fils
      .filter((t) => t.type === "individuel" && !t.equipe)
      .map((t) => t.contact?.id),
  );
  const cibles = {
    conversations: fils.map((t): ElementACocher => ({
      valeur: `fil:${t.id}`,
      nom: t.nom,
      detail: t.sousTitre,
      avatar: t.avatar ?? null,
      init: t.init,
      groupe: t.type === "groupe",
    })),
    personnes: personnes
      .filter((p) => !dejaEnContact.has(p.id))
      .map((p) => versElement(p, `personne:${p.id}`)),
  };

  const membresDuFil = new Set(fil.participants.map((p) => p.id));
  const ajoutables = personnes
    .filter((p) => !membresDuFil.has(p.id))
    .map((p) => versElement(p));

  const dernier = fil.messages.at(-1)?.id ?? "vide";
  const visibles = fil.messages.filter((m) => !m.supprime);

  return (
    // `relative` : le panneau d'information se pose sur la droite de la conversation.
    <div className="flex-1 min-w-0 min-h-0 flex flex-col relative">
      <MarquerLu threadId={fil.id} space={space} nonLus={fil.unread} />

      <EnTeteConversation
        // Changer de fil referme le panneau et vide sa recherche.
        key={fil.id}
        threadId={fil.id}
        space={space}
        moiId={user.id}
        nom={fil.nom}
        sousTitre={fil.sousTitre}
        avatar={fil.avatar ?? null}
        init={fil.init}
        info={info}
        participants={fil.participants}
        ajoutables={ajoutables}
        messages={visibles.map((m) => ({
          id: m.id,
          de: m.moi ? "Vous" : m.de,
          texte: m.texte,
          heure: m.heure,
          pieces: m.pieces,
        }))}
      />

      <ActionsMessages space={space} cibles={cibles}>
        <div className="flex-1 min-h-0 overflow-y-auto p-[18px] flex flex-col gap-2.5">
          {fil.messages.length === 0 ? (
            <p className="m-auto text-[13px] text-faint text-center max-w-[32ch]">
              Aucun message pour l’instant. Écrivez le premier.
            </p>
          ) : null}

          {fil.messages.map((m: Message, i) => {
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
                <Bulle
                  message={m}
                  heure={heureExacte(m.envoyeLe)}
                  groupe={fil.type === "groupe"}
                  space={space}
                />
              </Fragment>
            );
          })}

          <DefilerEnBas repere={`${fil.id}:${dernier}`} />
        </div>
      </ActionsMessages>

      {/* Remonté à chaque nouveau message : texte et pièces choisies repartent à vide. */}
      <Composeur key={`${fil.id}:${dernier}`} threadId={fil.id} space={space} />
    </div>
  );
}
