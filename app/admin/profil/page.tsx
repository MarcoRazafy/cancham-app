import { EnTeteAdmin } from "@/components/admin/ui";
import { FormulaireProfilEquipe } from "@/components/forms/ProfilEquipe";
import { Card, Saillant } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";

export default async function MonProfil() {
  const user = await getCurrentUser("admin");

  return (
    <>
      <EnTeteAdmin
        surtitre="Équipe CanCham"
        titre={
          <>
            Mon <Saillant>profil</Saillant>
          </>
        }
      >
        Vos nom, fonction, coordonnées et photo. C’est ainsi que les membres
        vous voient dans la messagerie, et que l’équipe vous retrouve au journal
        d’activité.
      </EnTeteAdmin>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] items-start">
        <FormulaireProfilEquipe user={user} />

        <Card className="carte-filet filet-fixe filet-degrade p-6">
          <div className="surtitre text-faint mb-3">Où ce profil apparaît</div>
          <ul className="list-none m-0 p-0 flex flex-col gap-3 text-[13.4px] text-muted">
            <li>
              <b className="text-ink">Messagerie</b> — votre nom et votre photo
              accompagnent chacun de vos messages.
            </li>
            <li>
              <b className="text-ink">Journal d’activité</b> — chaque paiement,
              validation ou publication porte votre nom.
            </li>
            <li>
              <b className="text-ink">Menu du back-office</b> — en bas du menu
              et en haut à droite de chaque page.
            </li>
          </ul>
          <p className="m-0 mt-4 text-[12px] text-faint">
            Tant que la connexion par compte n’est pas en place, ce profil est
            celui de l’espace d’administration de démonstration.
          </p>
        </Card>
      </div>
    </>
  );
}
