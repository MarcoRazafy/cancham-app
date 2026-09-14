import { Check } from "lucide-react";
import { BtnLink, Card } from "@/components/ui";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ nom?: string }>;
}) {
  const { nom } = await searchParams;

  return (
    <div className="max-w-[520px] mx-auto">
      <Card className="p-[22px] text-center">
        <div className="w-14 h-14 rounded-full bg-success-soft text-success-strong flex items-center justify-center mx-auto mb-3.5">
          <Check size={26} />
        </div>
        <h1 className="text-[21px] m-0 mb-2">Demande envoyée</h1>
        <p className="text-muted text-[13.8px] max-w-[46ch] mx-auto mb-5">
          Merci pour votre intérêt envers CanCham Madagascar
          {nom ? ` au nom de ${nom}` : ""}. Votre demande est en attente d’examen par
          notre équipe. Une fois validée, il vous restera à régler la cotisation pour
          activer votre accès complet à l’espace membre.
        </p>
        <BtnLink href="/public">Retour à l’accueil</BtnLink>
      </Card>
    </div>
  );
}
