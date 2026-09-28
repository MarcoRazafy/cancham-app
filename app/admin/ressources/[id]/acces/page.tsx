import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, Trash2, Users } from "lucide-react";
import { EnTeteAdmin } from "@/components/admin/ui";
import { BoutonAccesRessource } from "@/components/forms/BibliothequeOutils";
import { Card, EmptyState, Saillant } from "@/components/ui";
import { SubmitButton } from "@/components/form-bits";
import { retirerAccesRessource } from "@/lib/actions/content";
import { ilYa } from "@/components/admin/LigneJournal";
import { getAccesRessource, getMembresPourAcces } from "@/lib/queries-admin";
import { prisma } from "@/lib/db";

/**
 * Qui a accès à une ressource payante.
 *
 * Une ressource incluse dans l'adhésion n'a pas de liste : tout membre à
 * jour la lit, et cette page le dit plutôt que d'afficher un tableau vide
 * qu'on croirait à remplir.
 */
export default async function AccesRessource({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = await prisma.resource.findUnique({
    where: { id },
    select: { id: true, titre: true, type: true, prix: true },
  });
  if (!r) notFound();

  const [acces, membres] = await Promise.all([
    getAccesRessource(r.id),
    getMembresPourAcces(),
  ]);
  const ouverts = new Set(acces.map((a) => a.memberId));

  return (
    <>
      <Link
        href="/admin/ressources"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent"
      >
        <ArrowLeft size={14} /> Bibliothèque
      </Link>
      <EnTeteAdmin
        surtitre="Programme"
        titre={
          <>
            Qui a <Saillant>accès</Saillant>
          </>
        }
        actions={
          r.type === "payant" ? (
            <BoutonAccesRessource
              membres={membres.filter((m) => !ouverts.has(m.id))}
              resourceId={r.id}
            />
          ) : null
        }
      >
        {r.titre}
      </EnTeteAdmin>

      {r.type === "gratuit" ? (
        <Card className="flex items-start gap-3 p-5">
          <Lock size={18} className="mt-px shrink-0 text-success-strong" />
          <p className="m-0 text-[13.8px] text-muted">
            Cette ressource est{" "}
            <b className="text-ink">incluse dans l’adhésion</b> : tout membre à
            jour de cotisation la lit. Il n’y a pas de liste d’accès à tenir.
            Passez-la en payante depuis sa fiche si vous voulez la réserver.
          </p>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
            <Users size={16} className="text-accent" />
            <h2 className="m-0 text-[15.5px] font-semibold">
              {acces.length} entreprise{acces.length > 1 ? "s" : ""} y{" "}
              {acces.length > 1 ? "ont" : "a"} accès
            </h2>
          </div>

          {acces.length ? (
            <ul className="m-0 list-none p-0">
              {acces.map((a) => (
                <li
                  key={a.memberId}
                  className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-ink">
                      {a.nom}
                    </div>
                    <div className="text-[12.2px] text-faint">
                      Ouvert par {a.ouvertPar} · {ilYa(a.date)}
                    </div>
                  </div>
                  <form action={retirerAccesRessource}>
                    <input type="hidden" name="resourceId" value={r.id} />
                    <input type="hidden" name="membreId" value={a.memberId} />
                    <input
                      type="hidden"
                      name="retour"
                      value={`/admin/ressources/${r.id}/acces`}
                    />
                    <SubmitButton sm variant="ghost" pendingLabel="…">
                      <Trash2 size={14} /> Retirer
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState>
                Personne n’y a encore accès. Ouvrez-le aux entreprises qui l’ont
                acquise.
              </EmptyState>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
