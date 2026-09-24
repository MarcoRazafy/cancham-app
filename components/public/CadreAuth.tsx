import Image from "next/image";
import Link from "next/link";
import { LogoOfficiel } from "@/components/public/Marque";

/**
 * Cadre des écrans d'identification : une image à gauche, le formulaire à
 * droite, le tout dans une hauteur de fenêtre — seule la colonne du
 * formulaire défile.
 *
 * L'accroche porte les couleurs de la chambre sur ses mots saillants.
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
    // L'image prend les deux tiers : c'est elle qui accueille. Le formulaire
    // garde 440 px au moins, pour ne pas se tasser sur un petit écran.
    // `dvh` plutôt que `vh` : sur téléphone, la barre d'adresse mange une
    // partie de `vh`.
    <div className="h-dvh overflow-hidden grid lg:grid-cols-[minmax(0,65fr)_minmax(440px,35fr)]">
      {/* ==================== Image ==================== */}
      <div className="relative hidden lg:block h-full overflow-hidden bg-marque-nuit">
        <Image
          src={photo}
          alt={alt}
          fill
          priority
          sizes="65vw"
          className="zoom-lent object-cover saturate-[0.9] brightness-[1.05]"
        />

        {/* Le dégradé de la charte, en multiply et à peine posé : une teinte
            rouge et verte sur une photo qui reste claire — on doit voir la
            scène et les visages avant la couleur. */}
        <div
          className="degrade-anime absolute inset-0 mix-blend-multiply opacity-[0.3]"
          style={{
            background:
              "linear-gradient(135deg, #c41414 0%, #a3122a 26%, #1b3a6b 52%, #0a7a49 76%, #00a05b 100%)",
          }}
        />
        {/* Voiles des bords seulement : sombre en bas, derrière le titre, et
            léger en haut, derrière le logo blanc. Le milieu de la photo reste
            à nu. */}
        <div className="absolute inset-0 bg-linear-to-t from-marque-nuit/80 from-0% via-marque-nuit/0 via-45% to-transparent" />
        <div className="absolute inset-x-0 top-0 h-[28%] bg-linear-to-b from-marque-nuit/45 to-transparent" />

        <div className="sur-sombre relative h-full flex flex-col justify-between p-10 xl:p-14">
          <Link
            href="/"
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
          </div>
        </div>
      </div>

      {/* ==================== Formulaire ==================== */}
      {/* Le décor reste immobile : c'est la colonne intérieure qui défile. */}
      <div className="relative h-full overflow-hidden bg-[#fbfcfe]">
        <div aria-hidden className="grille-fine absolute inset-0" />
        {/* Voile blanc sur la grille : plus dense au centre, derrière le
            formulaire, il la laisse à peine deviner sur les bords. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgb(255 255 255 / 0.82) 0%, rgb(255 255 255 / 0.55) 100%)",
          }}
        />
        {/* Halos de la charte, très diffus : la couleur vient du fond, pas
            d'un aplat. */}
        <div
          aria-hidden
          className="halo-marque absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(173 7 7 / 0.18), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="halo-marque absolute -bottom-32 -right-24 w-[520px] h-[520px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(0 113 64 / 0.18), transparent 70%)",
            animationDelay: "-7s",
          }}
        />

        <div className="relative h-full overflow-y-auto flex flex-col px-4 py-8 sm:px-6 lg:px-8">
          <main
            className={`apparition flex-1 flex flex-col justify-center w-full mx-auto ${
              large ? "max-w-[660px]" : "max-w-[520px]"
            }`}
          >
            {/* Filet dégradé en tête, comme les cartes des espaces membre et
                back-office. Le logo n'apparaît que sous 1024 px : au-dessus,
                il est déjà sur la photo, et le répéter ferait doublon. */}
            <div className="carte-filet filet-fixe filet-degrade rounded-[var(--radius-l)] border border-line bg-surface shadow-[0_18px_44px_-24px_rgb(15_29_44/0.35)] px-6 py-8 sm:px-10 sm:py-11">
              <Link
                href="/"
                aria-label="CanCham Connect"
                className="lg:hidden block mb-6"
              >
                <LogoOfficiel className="w-[178px] h-auto" priority />
              </Link>
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
  // Il apparaît, puis secoue la tête : un refus doit se voir autant qu'une
  // réussite. Deux enveloppes, pour que les deux mouvements ne se disputent
  // pas la même transformation.
  return (
    <div className="apparition">
      <p
        role="alert"
        className="anim-secousse m-0 mb-5 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-[13.5px] text-accent-strong"
        style={{ animationDelay: "0.35s" }}
      >
        {children}
      </p>
    </div>
  );
}

/** Confirmation au-dessus d'un formulaire d'identification. */
export function Confirmation({ children }: { children: React.ReactNode }) {
  return (
    <div className="apparition">
      <p
        role="status"
        className="m-0 mb-5 rounded-lg border border-marque-vert/30 bg-marque-vert/10 px-4 py-3 text-[13.5px] text-marque-vert"
      >
        {children}
      </p>
    </div>
  );
}

export {
  ChampAuth,
  ChampMotDePasse,
  Saisie,
} from "@/components/public/ChampsAuth";
export { CHAMP_AUTH } from "@/components/public/style-champs";
