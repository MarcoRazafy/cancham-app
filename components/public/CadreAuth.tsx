import Image from "next/image";
import Link from "next/link";
import { LogoOfficiel } from "@/components/public/Marque";

/**
 * Cadre des écrans d'identification : une image à gauche, le formulaire à
 * droite, le tout dans une hauteur de fenêtre — seule la colonne du
 * formulaire défile.
 *
 * Sur la photo, le dégradé rouge → vert de la charte est posé en `multiply`
 * sur une image désaturée : les deux couleurs de la chambre sortent
 * franchement au lieu de se perdre dans les teintes de la photo. L'image
 * respire par un zoom très lent, le dégradé glisse, et les blocs arrivent en
 * fondu — assez pour donner vie, jamais assez pour distraire du formulaire.
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
    // `dvh` plutôt que `vh` : sur téléphone, la barre d'adresse mange une
    // partie de `vh`. Classes écrites en entier : Tailwind ne voit pas un nom
    // composé à l'exécution.
    <div
      className={`h-dvh overflow-hidden grid ${
        large
          ? "lg:grid-cols-[1fr_minmax(0,620px)]"
          : "lg:grid-cols-[1.05fr_minmax(0,520px)]"
      }`}
    >
      {/* ==================== Image ==================== */}
      <div className="relative hidden lg:block h-full overflow-hidden bg-marque-nuit">
        <Image
          src={photo}
          alt={alt}
          fill
          priority
          sizes="55vw"
          className="zoom-lent object-cover saturate-[0.65] brightness-[1.12]"
        />

        {/* Le dégradé de la charte, en multiply et en demi-teinte : il colore
            la photo sans la recouvrir — on doit reconnaître le rouge et le
            vert, et voir la scène. */}
        <div
          className="degrade-anime absolute inset-0 mix-blend-multiply opacity-[0.62]"
          style={{
            background:
              "linear-gradient(135deg, #c41414 0%, #a3122a 26%, #1b3a6b 52%, #0a7a49 76%, #00a05b 100%)",
          }}
        />
        {/* Voile du bas : le dégradé étant en demi-teinte, c'est lui qui
            garantit la lisibilité du titre sur une photo claire. */}
        <div className="absolute inset-0 bg-linear-to-t from-marque-nuit/85 from-5% via-marque-nuit/20 via-55% to-marque-nuit/10" />

        <div className="sur-sombre relative h-full flex flex-col justify-between p-10 xl:p-14">
          <Link
            href="/public"
            aria-label="CanCham Connect"
            className="apparition inline-block"
          >
            <LogoOfficiel version="blanc" className="w-[250px] h-auto" />
          </Link>

          <div>
            <span
              className="apparition surtitre inline-block px-3.5 py-1.5 rounded-full border border-white/30 text-white/85"
              style={{ animationDelay: "0.1s" }}
            >
              Le réseau Canada–Madagascar
            </span>
            <h2
              className="apparition titre text-[clamp(28px,2.6vw,40px)] leading-[1.15] m-0 mt-5 max-w-[16ch] text-white"
              style={{ animationDelay: "0.2s" }}
            >
              {accroche}
            </h2>
            <p
              className="apparition text-[15px] leading-relaxed text-white/85 mt-4 mb-0 max-w-[42ch]"
              style={{ animationDelay: "0.32s" }}
            >
              {sous}
            </p>
            {/* Filet aux deux couleurs, signature discrète de la charte. */}
            <span
              aria-hidden
              className="apparition block h-1 w-24 rounded-full mt-7"
              style={{
                animationDelay: "0.42s",
                background: "linear-gradient(90deg, #d32020, #3fc98a)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ==================== Formulaire ==================== */}
      {/* Seule colonne qui défile. */}
      <div className="relative h-full overflow-y-auto bg-surface-2">
        {/* Trame très légère, pour que le blanc de la carte se détache. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.55] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,29,44,0.13) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative flex flex-col min-h-full px-4 py-8 sm:px-8 lg:px-10">
          <Link
            href="/public"
            aria-label="CanCham Connect"
            className="lg:hidden mb-6 self-center"
          >
            <LogoOfficiel className="w-[190px] h-auto" priority />
          </Link>

          <main
            className={`apparition flex-1 flex flex-col justify-center w-full mx-auto ${
              large ? "max-w-[560px]" : "max-w-[440px]"
            }`}
          >
            <div className="rounded-[var(--radius-l)] border border-line bg-surface shadow-[0_18px_44px_-24px_rgb(15_29_44/0.35)] px-6 py-7 sm:px-8 sm:py-9">
              {children}
            </div>
          </main>

          <p className="text-[12px] text-faint text-center m-0 mt-8">
            © {new Date().getFullYear()} CanCham · Chambre de Commerce et de
            Coopération Canada–Madagascar
          </p>
        </div>
      </div>
    </div>
  );
}

/** Message d'erreur d'un formulaire d'identification. */
export function Alerte({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="apparition m-0 mb-5 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-[13.5px] text-accent-strong"
    >
      {children}
    </p>
  );
}

export {
  CHAMP_AUTH,
  ChampAuth,
  ChampMotDePasse,
  Saisie,
} from "@/components/public/ChampsAuth";
