import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  FolderOpen,
  MessageCircle,
  Pencil,
  PlayCircle,
  Plus,
  ShoppingBag,
} from "lucide-react";
import {
  Compteur,
  EnTeteAdmin,
  Onglets,
  Panneau,
  Vide,
} from "@/components/admin/ui";
import { ilYa } from "@/components/admin/LigneJournal";
import { SupprimerRessourceButton } from "@/components/forms/AdminContenuForms";
import { Card, Pill, Saillant } from "@/components/ui";
import { fmtDate, fmtMoney } from "@/lib/format";
import { getDemandesAchat, getRessourcesAdmin } from "@/lib/queries-admin";

export default async function AdminRessources({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: demande } = await searchParams;
  const type = demande === "gratuit" || demande === "payant" ? demande : "tout";

  const [ressources, achats] = await Promise.all([
    getRessourcesAdmin(),
    getDemandesAchat(8),
  ]);
  const liste =
    type === "tout" ? ressources : ressources.filter((r) => r.type === type);
  const sansFichier = ressources.filter((r) => !r.pret).length;

  return (
    <>
      <EnTeteAdmin
        surtitre="Programme"
        titre={
          <>
            Bibliothèque de <Saillant>ressources</Saillant>
          </>
        }
        actions={
          <Link
            href="/admin/ressources/nouvelle"
            className="btn-action btn-action-sm no-underline"
          >
            <Plus size={15} /> Nouvelle ressource
          </Link>
        }
      >
        Guides, modèles, rapports et formations. Les membres les lisent dans la
        plateforme, sans pouvoir les télécharger.
      </EnTeteAdmin>

      <div className="grid gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <Compteur
          icone={<FolderOpen size={22} />}
          teinte="bleu"
          libelle="Ressources"
          valeur={ressources.length}
          detail={`${ressources.filter((r) => r.type === "payant").length} payantes`}
        />
        <Compteur
          icone={<CheckCircle2 size={22} />}
          teinte="vert"
          libelle="Prêtes à la lecture"
          valeur={ressources.length - sansFichier}
        />
        <Compteur
          icone={<AlertTriangle size={22} />}
          teinte="rouge"
          libelle="Sans fichier lisible"
          valeur={sansFichier}
          detail={
            sansFichier
              ? "Les membres ne peuvent pas les ouvrir"
              : "Tout est lisible"
          }
        />
        <Compteur
          icone={<ShoppingBag size={22} />}
          teinte="rouge"
          libelle="Demandes d’achat"
          valeur={ressources.reduce((n, r) => n + r.demandes, 0)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px] items-start">
        <div className="min-w-0">
          <Onglets
            actif={type}
            onglets={[
              {
                cle: "tout",
                libelle: "Tout",
                href: "/admin/ressources",
                compte: ressources.length,
              },
              {
                cle: "gratuit",
                libelle: "Incluses",
                href: "/admin/ressources?type=gratuit",
                compte: ressources.filter((r) => r.type === "gratuit").length,
              },
              {
                cle: "payant",
                libelle: "Payantes",
                href: "/admin/ressources?type=payant",
                compte: ressources.filter((r) => r.type === "payant").length,
              },
            ]}
          />

          {liste.length ? (
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
              {liste.map((r) => (
                <li key={r.id}>
                  <Card className="p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
                    <span
                      className={`tuile tuile-sm ${r.fmt === "video" ? "tuile-bleue" : r.type === "payant" ? "tuile-rouge" : "tuile-verte"}`}
                    >
                      {r.fmt === "video" ? (
                        <PlayCircle size={22} />
                      ) : (
                        <FileText size={22} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-ink">
                        {r.titre}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1 text-[12.5px] text-muted">
                        <Pill>{r.cat}</Pill>
                        <Pill tone={r.type === "payant" ? "warn" : "ok"}>
                          {r.type === "payant" ? fmtMoney(r.prix) : "Inclus"}
                        </Pill>
                        <span>
                          {r.fmt === "video" ? "Vidéo" : r.fmt.toUpperCase()}
                          {r.pages ? ` · ${r.pages} p.` : ""} · {r.taille} ·{" "}
                          {fmtDate(r.date, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[12px]">
                        {r.pret ? (
                          <span className="inline-flex items-center gap-1 text-success-strong font-semibold">
                            <CheckCircle2 size={13} /> Prête à la lecture
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-accent font-semibold">
                            <AlertTriangle size={13} /> Fichier manquant
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-muted">
                          <MessageCircle size={13} /> {r.commentaires}
                        </span>
                        {r.demandes ? (
                          <span className="inline-flex items-center gap-1 text-muted">
                            <ShoppingBag size={13} /> {r.demandes} demande
                            {r.demandes > 1 ? "s" : ""}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {r.pret && r.type === "gratuit" ? (
                        <Link
                          href={`/membre/ressources/${r.id}`}
                          aria-label={`Lire « ${r.titre} »`}
                          title="Lire comme un membre"
                          className="w-9 h-9 rounded-[var(--radius-s)] border border-line bg-surface flex items-center justify-center text-muted hover:text-ink hover:border-faint"
                        >
                          <BookOpen size={15} />
                        </Link>
                      ) : null}
                      <Link
                        href={`/admin/ressources/${r.id}/modifier`}
                        aria-label={`Modifier « ${r.titre} »`}
                        title="Modifier"
                        className="w-9 h-9 rounded-[var(--radius-s)] border border-line bg-surface flex items-center justify-center text-muted hover:text-ink hover:border-faint"
                      >
                        <Pencil size={15} />
                      </Link>
                      <SupprimerRessourceButton
                        resourceId={r.id}
                        titre={r.titre}
                      />
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Card>
              <Vide icone={<FolderOpen size={26} />}>
                Aucune ressource dans cette catégorie.
              </Vide>
            </Card>
          )}
        </div>

        <Panneau
          titre="Demandes d’achat"
          sousTitre="Les membres qui ont demandé une ressource payante"
          teinte="rouge"
          corpsClassName="px-6 pb-5"
        >
          {achats.length ? (
            <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
              {achats.map((a) => (
                <li key={a.id} className="flex gap-3 items-start">
                  <span className="w-8 h-8 rounded-lg bg-accent-soft text-accent-strong flex items-center justify-center shrink-0">
                    <ShoppingBag size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ink">
                      {a.acteur}
                    </span>
                    <span className="block text-[12.5px] text-muted">
                      {a.detail}
                    </span>
                    <span className="block text-[11.5px] text-faint">
                      {ilYa(a.date)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[13px] text-muted">
              Aucune demande pour l’instant.
            </p>
          )}
          <p className="m-0 mt-4 text-[11.8px] text-faint">
            Répondez depuis la messagerie ; une fois le règlement reçu, émettez
            la facture depuis Paiements &amp; factures.
          </p>
        </Panneau>
      </div>
    </>
  );
}
