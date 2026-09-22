import Link from "next/link";
import { Lock, Mail, Phone, Search } from "lucide-react";
import { EnTeteAdmin, Panneau, Vide } from "@/components/admin/ui";
import { FiltresAuto } from "@/components/FiltresAuto";
import {
  ChangerNiveauButton,
  FormulaireNouvelEquipier,
  PromouvoirButton,
  RetirerAdminButton,
} from "@/components/forms/EquipeForms";
import { Pastille } from "@/components/messagerie/outils";
import { Pill, Saillant, StatusPill } from "@/components/ui";
import { estAdministrateur } from "@/lib/autorisations";
import { initialesDe } from "@/lib/avatars";
import { NIVEAU_EQUIPE_LABEL } from "@/lib/enums";
import { fmtDate } from "@/lib/format";
import {
  chercherComptes,
  getAdministrateurs,
  type CompteMembre,
} from "@/lib/queries-admin";
import { getCurrentUser } from "@/lib/session";

/**
 * Équipe et accès : qui tient le back-office, et qui peut y entrer.
 *
 * Seul un administrateur ouvre un compte d'équipe : une adresse, une
 * fonction, un rôle, et l'identifiant part par e-mail avec un mot de passe
 * provisoire. Un compte déjà inscrit peut aussi être promu, en le cherchant.
 * Un manager voit l'équipe, sans pouvoir la modifier.
 */
export default async function AdminEquipe({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, moi] = await Promise.all([
    searchParams,
    getCurrentUser("admin"),
  ]);
  const recherche = q?.trim() ?? "";
  const gere = estAdministrateur(moi);

  const [admins, trouves] = await Promise.all([
    getAdministrateurs(),
    gere ? chercherComptes(recherche) : Promise.resolve([]),
  ]);

  return (
    <>
      <EnTeteAdmin
        surtitre="Back-office"
        titre={
          <>
            Équipe &amp; <Saillant>accès</Saillant>
          </>
        }
      >
        {gere
          ? "Les comptes qui ouvrent le back-office. Ajoutez un membre de l’équipe avec son adresse, sa fonction et son rôle : il reçoit ses accès par e-mail."
          : "Les comptes qui ouvrent le back-office. Seuls les administrateurs ajoutent ou retirent un membre de l’équipe."}
      </EnTeteAdmin>

      <div className="grid gap-4 items-start lg:grid-cols-[1fr_380px]">
        {gere ? (
          <div className="flex flex-col gap-4 min-w-0">
            <Panneau
              titre={
                <>
                  Ajouter à <Saillant>l’équipe</Saillant>
                </>
              }
              sousTitre="Un compte d’administrateur ou de manager, ouvert par vous"
              teinte="rouge"
            >
              <FormulaireNouvelEquipier />
            </Panneau>

            {/* ==================== Recherche ==================== */}
            <Panneau
              titre="Promouvoir un compte existant"
              sousTitre="Quelqu’un qui a déjà un compte de membre et rejoint l’équipe"
              teinte="bleu"
              corpsClassName="px-6 pb-3"
            >
              <FiltresAuto action="/admin/equipe" className="relative mb-4">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={recherche}
                  placeholder="Nom, adresse courriel, entreprise…"
                  aria-label="Chercher un compte"
                  className="w-full max-w-[420px] rounded-[var(--radius-s)] border border-line bg-surface text-ink pl-9 pr-3 py-2.5 text-[13.5px] outline-none focus:border-accent"
                />
              </FiltresAuto>

              {!recherche ? (
                <p className="m-0 pb-3 text-[13px] text-muted">
                  Tapez quelques lettres pour retrouver un compte.
                </p>
              ) : trouves.length ? (
                <ul className="list-none m-0 p-0">
                  {trouves.map((c) => (
                    <Inscription key={c.id} compte={c} />
                  ))}
                </ul>
              ) : (
                <Vide icone={<Search size={26} />}>
                  Aucun compte ne correspond à « {recherche} ».
                </Vide>
              )}
            </Panneau>
          </div>
        ) : (
          <Panneau titre="Votre rôle : manager" teinte="bleu">
            <div className="flex gap-3 items-start pb-2">
              <Lock size={18} className="text-faint shrink-0 mt-0.5" />
              <p className="m-0 text-[13.4px] text-muted">
                Vous avez accès à tout le back-office — membres, paiements,
                événements, contenus, messagerie —, sauf à la gestion de
                l’équipe : ajouter quelqu’un, changer son rôle ou retirer son
                accès revient à un administrateur.
              </p>
            </div>
          </Panneau>
        )}

        {/* ==================== L'équipe ==================== */}
        <Panneau
          titre="L’équipe"
          sousTitre={`${admins.length} compte${admins.length > 1 ? "s" : ""} avec accès au back-office`}
          teinte="degrade"
          corpsClassName="px-6 pb-3"
        >
          <ul className="list-none m-0 p-0">
            {admins.map((a) => {
              const cest_moi = a.id === moi.id;
              return (
                <li
                  key={a.id}
                  className="flex gap-3 py-3.5 border-t border-line first:border-t-0"
                >
                  <Pastille
                    src={a.photo}
                    alt=""
                    initiales={initialesDe(a.nom)}
                    taille={40}
                    className="bg-navy-soft text-navy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14.5px] font-semibold text-ink">
                        {a.nom}
                      </span>
                      <Pill
                        tone={a.niveau === "administrateur" ? "ok" : "muted"}
                      >
                        {NIVEAU_EQUIPE_LABEL[a.niveau]}
                      </Pill>
                      {cest_moi ? <Pill>Vous</Pill> : null}
                      {a.sansMotDePasse ? (
                        <Pill tone="warn">Jamais connecté</Pill>
                      ) : null}
                    </div>
                    <div className="text-[12.8px] text-muted">{a.fonction}</div>
                    <div className="flex flex-col gap-0.5 mt-1.5 text-[12.5px]">
                      <a
                        href={`mailto:${a.email}`}
                        className="inline-flex items-center gap-1.5 text-ink no-underline hover:underline"
                      >
                        <Mail size={13} className="text-faint shrink-0" />
                        <span className="truncate">{a.email}</span>
                      </a>
                      {a.tel ? (
                        <a
                          href={`tel:${a.tel.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-ink no-underline hover:underline"
                        >
                          <Phone size={13} className="text-faint shrink-0" />
                          {a.tel}
                        </a>
                      ) : null}
                    </div>
                    <div className="text-[11.5px] text-faint mt-1.5">
                      Dans l’équipe depuis le {fmtDate(a.depuis)}
                    </div>
                    {gere && !cest_moi ? (
                      <div className="mt-2.5 flex gap-2 flex-wrap">
                        <ChangerNiveauButton
                          userId={a.id}
                          nom={a.nom}
                          niveau={a.niveau}
                        />
                        <RetirerAdminButton userId={a.id} nom={a.nom} />
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="m-0 mt-1 mb-3 text-[12px] text-faint">
            Un administrateur ne peut ni retirer son propre accès ni changer son
            propre rôle : la plateforme en garde toujours au moins un.
          </p>
        </Panneau>
      </div>
    </>
  );
}

/* ============================ Une ligne de compte ============================ */

function Inscription({ compte: c }: { compte: CompteMembre }) {
  return (
    <li className="flex gap-3.5 py-3.5 border-t border-line first:border-t-0 flex-wrap sm:flex-nowrap">
      <Pastille
        src={c.photo}
        alt=""
        initiales={initialesDe(c.nom)}
        taille={40}
        className="bg-accent-soft text-accent-strong"
      />
      <div className="min-w-0 flex-1 basis-[220px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14.5px] font-semibold text-ink">{c.nom}</span>
          {c.membre ? <StatusPill status={c.membre.statut} /> : null}
        </div>
        <div className="text-[12.8px] text-muted truncate">
          {c.email}
          {c.fonction ? ` · ${c.fonction}` : ""}
          {c.tel ? ` · ${c.tel}` : ""}
        </div>
        {c.membre ? (
          <div className="text-[12.8px] text-muted">
            <Link
              href={`/admin/membres/${c.membre.id}`}
              className="text-accent font-semibold no-underline hover:underline"
            >
              {c.membre.nom}
            </Link>
          </div>
        ) : null}
        {c.membre?.motivation ? (
          <p className="m-0 mt-1 text-[12.5px] text-muted line-clamp-2">
            « {c.membre.motivation} »
          </p>
        ) : null}
        <div className="text-[11.5px] text-faint mt-1">
          Inscrit le {fmtDate(c.depuis)}
        </div>
      </div>
      <div className="flex items-start gap-2 flex-wrap shrink-0">
        {c.membre ? (
          <Link
            href={`/admin/membres/${c.membre.id}`}
            className="btn-contour btn-contour-sm text-ink no-underline hover:bg-surface-2"
          >
            Voir la fiche
          </Link>
        ) : null}
        <PromouvoirButton
          userId={c.id}
          nom={c.nom}
          email={c.email}
          entreprise={c.membre?.nom}
          ficheEffacable={Boolean(
            c.membre?.sansHistorique && c.membre.statut === "candidature",
          )}
        />
      </div>
    </li>
  );
}
