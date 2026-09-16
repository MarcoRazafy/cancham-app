import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  BtnLink,
  Pill,
  Saillant,
  Stat,
  TableWrap,
  Td,
  Th,
  ViewHead,
} from "@/components/ui";
import {
  AddAttendeeButton,
  AttendanceButton,
} from "@/components/forms/EventForms";
import { prisma } from "@/lib/db";
import { getEvent, getMembers } from "@/lib/queries";
import { fmtDate, fmtMoney, isPast, statusLabel } from "@/lib/format";
import type { AttendeeStatus } from "@/lib/types";

/** Libellés de statut côté base → modèle de vue. */
const STATUT: Record<string, AttendeeStatus> = {
  confirme: "confirmé",
  present: "présent",
  absent: "absent",
};

export default async function InscritsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  const [{ id }, { onglet = "inscrits" }] = await Promise.all([
    params,
    searchParams,
  ]);

  const e = await getEvent(id);
  if (!e) notFound();

  const [participants, membres] = await Promise.all([
    prisma.attendee.findMany({
      where: { eventId: id },
      orderBy: { nom: "asc" },
    }),
    getMembers(),
  ]);

  const presents = participants.filter((a) => a.statut === "present");
  const absents = participants.filter((a) => a.statut === "absent");
  const liste = onglet === "presents" ? presents : participants;
  const passe = isPast(e.date);

  return (
    <>
      <div className="mb-4">
        <BtnLink href="/admin/evenements" variant="ghost" sm>
          <ArrowLeft size={14} /> Retour aux événements
        </BtnLink>
      </div>

      <ViewHead
        title={<>Personnes {<Saillant ton="vert">inscrites</Saillant>}</>}
        action={
          <AddAttendeeButton
            eventId={id}
            membres={membres.map((m) => ({
              id: m.id,
              nom: m.nom,
              contact: m.nom,
              email: "",
            }))}
          />
        }
      >
        {e.titre} · {fmtDate(e.date)} · {e.lieu} ·{" "}
        {e.payant ? fmtMoney(e.prix) : "Gratuit"}
      </ViewHead>

      <div className="grid gap-4 mb-[18px] md:grid-cols-3">
        <Stat
          k="Inscrits"
          v={
            <span className="text-[22px]">
              {participants.length}/{e.cap}
            </span>
          }
        />
        <Stat
          k="Présents"
          v={<span className="text-[22px]">{presents.length}</span>}
        />
        <Stat
          k={passe ? "Absents" : "Places restantes"}
          v={
            <span className="text-[22px]">
              {passe ? absents.length : e.cap - participants.length}
            </span>
          }
        />
      </div>

      <div className="flex gap-1 border-b border-line mb-[18px]">
        {[
          {
            key: "inscrits",
            label: `Liste des inscrits (${participants.length})`,
          },
          { key: "presents", label: `Liste des présents (${presents.length})` },
        ].map((t) => (
          <BtnLink
            key={t.key}
            href={`/admin/evenements/${id}/inscrits?onglet=${t.key}`}
            variant="ghost"
            sm
            className={`rounded-none border-b-2 ${
              onglet === t.key
                ? "text-accent border-accent"
                : "border-transparent"
            }`}
          >
            {t.label}
          </BtnLink>
        ))}
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Nom</Th>
            <Th>Entreprise</Th>
            <Th>Courriel</Th>
            <Th>Statut</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {liste.length ? (
            liste.map((a) => (
              <tr key={a.id} className="hover:bg-surface-2">
                <Td className="font-semibold">{a.nom}</Td>
                <Td className="text-muted">{a.entreprise}</Td>
                <Td className="text-muted">{a.email}</Td>
                <Td>
                  <Pill
                    tone={
                      a.statut === "present"
                        ? "ok"
                        : a.statut === "absent"
                          ? "bad"
                          : "warn"
                    }
                  >
                    {statusLabel(STATUT[a.statut])}
                  </Pill>
                </Td>
                <Td>
                  <AttendanceButton
                    attendeeId={a.id}
                    eventId={id}
                    statut={STATUT[a.statut]}
                  />
                </Td>
              </tr>
            ))
          ) : (
            <tr>
              <Td className="text-muted text-center py-6">
                {onglet === "presents"
                  ? "Personne n’a encore été enregistré comme présent."
                  : "Aucun inscrit pour cet événement."}
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>
    </>
  );
}
