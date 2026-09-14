import { Check } from "lucide-react";
import Link from "next/link";
import { EnTetePublique } from "@/components/public/Marque";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ nom?: string }>;
}) {
  const { nom } = await searchParams;

  return (
    <>
      <EnTetePublique />
      <main className="max-w-[560px] mx-auto px-5 py-16 w-full text-center">
        <div className="w-16 h-16 rounded-full border border-marque-vert/50 text-marque-vert flex items-center justify-center mx-auto mb-5">
          <Check size={30} />
        </div>
        <h1 className="titre text-[clamp(26px,4vw,34px)] font-extrabold m-0 mb-3">
          Demande envoyée
        </h1>
        <p className="text-[15px] leading-relaxed text-white/70 max-w-[48ch] mx-auto mb-8">
          Merci pour votre intérêt envers CanCham Madagascar
          {nom ? ` au nom de ${nom}` : ""}. Votre demande est en attente d’examen par
          notre équipe. Une fois validée, il vous restera à régler la cotisation pour
          activer votre accès complet à l’espace membre.
        </p>
        <Link
          href="/public"
          className="inline-flex items-center font-[family-name:var(--font-titre)] font-bold text-[14px] px-6 py-3.5 rounded-lg border border-white/30 text-white no-underline hover:bg-white/10"
        >
          Retour à l’accueil
        </Link>
      </main>
    </>
  );
}
