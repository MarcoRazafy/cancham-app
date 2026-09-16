import Link from "next/link";
import { AvatarRond } from "@/components/domain";
import { ViewHead } from "@/components/ui";
import { MessageComposer } from "@/components/forms/MessageComposer";
import { getThreads } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import type { Space } from "@/lib/types";

export async function MessageriePage({
  space,
  threadId,
}: {
  space: Space;
  threadId?: string;
}) {
  const user = await getCurrentUser(space);
  const threads = await getThreads(user.id);
  const active = threads.find((t) => t.id === threadId) ?? threads[0];
  const base = `/${space}/messagerie`;

  return (
    <>
      <ViewHead title="Messagerie">
        {space === "admin"
          ? "Échangez avec les membres et les comités depuis l’espace d’administration."
          : "Échangez directement avec un autre membre ou un groupe : comités, organisateurs d’événements, équipe CanCham."}
      </ViewHead>

      <div className="flex border border-line rounded-[var(--radius-m)] bg-surface overflow-hidden h-[min(620px,calc(100vh-240px))] min-h-[420px] flex-col md:flex-row">
        <div className="w-full md:w-[280px] md:shrink-0 border-b md:border-b-0 md:border-r border-line overflow-y-auto">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`${base}?t=${t.id}`}
              className={`flex gap-2.5 px-3.5 py-3 border-b border-line no-underline ${
                t.id === active.id
                  ? // Un aplat bleu : la sélection doit se voir d'un coup d'œil.
                    "bg-[#14263a] text-white"
                  : "hover:bg-surface-2"
              }`}
            >
              <AvatarRond
                src={t.avatar}
                alt={t.nom}
                initiales={t.init}
                taille={36}
                className={`text-[11.5px] ${
                  t.id === active.id
                    ? "bg-white/15 text-white"
                    : t.type === "groupe"
                      ? "bg-navy-soft text-navy"
                      : "bg-accent-soft text-accent-strong"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-1.5 items-baseline">
                  <span className="font-semibold text-[13px] truncate">
                    {t.nom}
                  </span>
                  {t.unread ? (
                    <span className="text-[10.5px] font-bold px-[7px] py-px rounded-full bg-accent text-white shrink-0">
                      {t.unread}
                    </span>
                  ) : null}
                </div>
                <div
                  className={`text-[11.6px] truncate ${
                    t.id === active.id ? "text-white/60" : "text-faint"
                  }`}
                >
                  {t.messages[t.messages.length - 1].texte}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-[18px] py-3.5 border-b border-line flex items-center gap-2.5 shrink-0">
            <AvatarRond
              src={active.avatar}
              alt={active.nom}
              initiales={active.init}
              taille={34}
              className={`text-[12.5px] ${
                active.type === "groupe"
                  ? "bg-navy-soft text-navy"
                  : "bg-accent-soft text-accent-strong"
              }`}
            />
            <div>
              <div className="font-semibold text-[13.8px]">{active.nom}</div>
              <div className="text-[11.4px] text-faint">{active.sousTitre}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-[18px] flex flex-col gap-2.5">
            {active.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[72%] px-3 py-2.5 text-[13.3px] leading-relaxed ${
                  m.moi
                    ? "self-end bg-accent text-white rounded-[14px] rounded-br-[4px]"
                    : "self-start bg-surface-2 rounded-[14px] rounded-bl-[4px]"
                }`}
              >
                {!m.moi && active.type === "groupe" ? (
                  <div className="text-[10.6px] font-bold opacity-75 mb-0.5">
                    {m.de}
                  </div>
                ) : null}
                {m.texte}
              </div>
            ))}
          </div>

          <MessageComposer threadId={active.id} space={space} />
        </div>
      </div>
    </>
  );
}
