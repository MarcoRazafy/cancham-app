"use client";

import {
  Children,
  useState,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { GripVertical } from "lucide-react";
import { ordonnerRessources } from "@/lib/actions/content";

/**
 * Les ressources d'un dossier, que l'équipe range à la souris.
 *
 * Chaque ligne porte une poignée, à gauche : on la saisit, on glisse la
 * ligne, un trait rouge montre où elle se posera, on lâche. L'ordre change
 * tout de suite à l'écran, puis s'enregistre ; la page se rafraîchit sur
 * place.
 *
 * La ligne ne devient déplaçable qu'une fois sa poignée saisie : ailleurs,
 * elle garde ses liens, ses boutons et son texte qu'on sélectionne. Au
 * clavier, la poignée prend le curseur et les flèches haut et bas montent
 * ou descendent la ligne d'un rang.
 *
 * Les lignes arrivent toutes dessinées du serveur, dans l'ordre de `ids` ;
 * ce composant ne fait que les réordonner.
 */
export function ListeTriable({
  ids,
  titres,
  classeLigne,
  children,
}: {
  /** Les identifiants des ressources, dans l'ordre enregistré. */
  ids: string[];
  /** Leurs titres, dans le même ordre : pour nommer chaque poignée. */
  titres: string[];
  /** Les classes d'une ligne, les mêmes que hors de cette liste. */
  classeLigne: string;
  /** Le contenu de chaque ligne, dans le même ordre. */
  children: ReactNode;
}) {
  const contenus = Children.toArray(children);
  const parId = new Map(
    ids.map((id, i) => [id, { contenu: contenus[i], titre: titres[i] }]),
  );

  const [ordre, setOrdre] = useState(ids);
  /** La ligne dont on tient la poignée : elle seule est déplaçable. */
  const [saisie, setSaisie] = useState<string | null>(null);
  /** La ligne qu'on est en train de glisser. */
  const [tiree, setTiree] = useState<string | null>(null);
  /** Où elle se poserait : avant ou après cette ligne. */
  const [cible, setCible] = useState<{ id: string; apres: boolean } | null>(
    null,
  );
  const [, demarrer] = useTransition();

  const ranger = (suite: string[]) => {
    if (suite.join() === ordre.join()) return;
    setOrdre(suite);
    demarrer(() => {
      void ordonnerRessources(suite);
    });
  };

  const lacher = () => {
    setSaisie(null);
    setTiree(null);
    setCible(null);
  };

  const deposer = () => {
    if (tiree && cible && cible.id !== tiree) {
      const reste = ordre.filter((x) => x !== tiree);
      const i = reste.indexOf(cible.id) + (cible.apres ? 1 : 0);
      ranger([...reste.slice(0, i), tiree, ...reste.slice(i)]);
    }
    lacher();
  };

  /** Au clavier : les flèches déplacent la ligne d'un rang. */
  const auClavier = (e: KeyboardEvent, id: string) => {
    const pas = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!pas) return;
    e.preventDefault();
    const i = ordre.indexOf(id);
    const j = i + pas;
    if (j < 0 || j >= ordre.length) return;
    const suite = [...ordre];
    [suite[i], suite[j]] = [suite[j], suite[i]];
    ranger(suite);
  };

  return (
    <ul className="m-0 list-none p-0">
      {ordre.map((id) => {
        const ligne = parId.get(id);
        if (!ligne) return null;
        const visee = tiree && cible?.id === id && tiree !== id ? cible : null;
        return (
          <li
            key={id}
            draggable={saisie === id}
            onDragStart={(e) => {
              setTiree(id);
              e.dataTransfer.effectAllowed = "move";
              // Sans donnée, certains navigateurs ne lancent pas le glisser.
              e.dataTransfer.setData("text/plain", id);
            }}
            onDragOver={(e) => {
              if (!tiree) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              const r = e.currentTarget.getBoundingClientRect();
              const apres = e.clientY > r.top + r.height / 2;
              if (cible?.id !== id || cible.apres !== apres) {
                setCible({ id, apres });
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              deposer();
            }}
            onDragEnd={lacher}
            className={`${classeLigne} ${tiree === id ? "opacity-40" : ""} ${
              // Le trait qui montre où la ligne se posera.
              visee
                ? visee.apres
                  ? "shadow-[inset_0_-3px_0_var(--accent)]"
                  : "shadow-[inset_0_3px_0_var(--accent)]"
                : ""
            }`}
          >
            <span
              role="button"
              tabIndex={0}
              aria-label={`Déplacer « ${ligne.titre} » : glissez, ou flèches haut et bas`}
              title="Glisser pour déplacer"
              onMouseDown={() => setSaisie(id)}
              onMouseUp={() => setSaisie(null)}
              onKeyDown={(e) => auClavier(e, id)}
              // Au-dessus du lien qui couvre la ligne.
              className="relative z-10 -ml-1.5 flex h-9 w-6 shrink-0 cursor-grab items-center justify-center self-center rounded-[var(--radius-s)] text-faint hover:bg-surface-3 hover:text-ink active:cursor-grabbing"
            >
              <GripVertical size={16} />
            </span>
            {ligne.contenu}
          </li>
        );
      })}
    </ul>
  );
}
