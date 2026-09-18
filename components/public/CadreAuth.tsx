import Image from "next/image";
import Link from "next/link";
import { LogoOfficiel } from "@/components/public/Marque";

/**
 * Cadre des écrans d'identification : une image à gauche, le formulaire à
 * droite.
 *
 * L'image porte la marque — photo d'une rencontre, dégradé de la charte,
 * logo renversé — et disparaît sous 1024 px, où l'écran revient au
 * formulaire seul, avec le logo couleur au-dessus.
 */
export function CadreAuth({
  photo,
  alt,
  accroche,
  sous,
  large = false,
  children,
}: {
  photo: string;
  alt: string;
  accroche: React.ReactNode;
  sous: string;
  /** Formulaire long — l'inscription — : colonne plus large. */
  large?: boolean;
  children: React.ReactNode;
}) {
  return (
    // Classes écrites en entier : Tailwind ne voit pas un nom composé à
    // l'exécution.
    <div
      className={`min-h-screen grid ${
        large
          ? "lg:grid-cols-[1fr_minmax(0,620px)]"
          : "lg:grid-cols-[1.05fr_minmax(0,520px)]"
      }`}
    >
      {/* ==================== Image ====================
          Collée en haut et haute d'un écran : sur une page longue — le
          formulaire d'inscription —, l'accroche reste visible pendant qu'on
          remplit les champs. */}
      <div className="relative hidden lg:block lg:sticky lg:top-0 lg:h-screen">
        <Image
          src={photo}
          alt={alt}
          fill
          priority
          sizes="55vw"
          className="object-cover"
        />
        {/* Le dégradé de la charte, posé sur la photo : la marque d'abord,
            la lisibilité du texte ensuite. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(150deg, rgba(173,7,7,0.82) 0%, rgba(15,29,44,0.78) 45%, rgba(0,113,64,0.82) 100%)",
          }}
        />
        <div className="sur-sombre relative h-full flex flex-col justify-between p-10 xl:p-14">
          <Link href="/public" aria-label="CanCham Connect">
            <LogoOfficiel version="blanc" className="w-[250px] h-auto" />
          </Link>
          <div>
            <h2 className="titre text-[clamp(28px,2.6vw,40px)] leading-[1.15] m-0 max-w-[16ch] text-white">
              {accroche}
            </h2>
            <p className="text-[15px] leading-relaxed text-white/80 mt-4 mb-0 max-w-[42ch]">
              {sous}
            </p>
          </div>
        </div>
      </div>

      {/* ==================== Formulaire ==================== */}
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-12 xl:px-16">
        <Link
          href="/public"
          aria-label="CanCham Connect"
          className="lg:hidden mb-8"
        >
          <LogoOfficiel className="w-[190px] h-auto" priority />
        </Link>

        <main
          className={`flex-1 flex flex-col justify-center w-full mx-auto lg:mx-0 py-4 ${
            large ? "max-w-[540px]" : "max-w-[460px]"
          }`}
        >
          {children}
        </main>

        <p className="text-[12px] text-faint m-0 mt-8">
          © {new Date().getFullYear()} CanCham · Chambre de Commerce et de
          Coopération Canada–Madagascar
        </p>
      </div>
    </div>
  );
}

/** Message d'erreur d'un formulaire d'identification. */
export function Alerte({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="m-0 mb-5 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-[13.5px] text-accent-strong"
    >
      {children}
    </p>
  );
}

/** Champs des formulaires d'identification. */
export const CHAMP_AUTH =
  "w-full min-w-0 rounded-lg border border-line bg-white text-ink placeholder:text-faint px-3.5 py-3 text-[14px] outline-none transition-colors focus:border-marque-vert focus:ring-2 focus:ring-marque-vert/15";

export function ChampAuth({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-semibold text-ink mb-1.5">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-[11.5px] text-faint mt-1">{hint}</span>
      ) : null}
    </label>
  );
}
