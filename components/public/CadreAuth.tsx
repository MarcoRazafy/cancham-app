import Image from "next/image";
import { LienSite } from "@/components/Application";
import { LogoOfficiel } from "@/components/public/Marque";

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
  large?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh overflow-hidden grid lg:grid-cols-[minmax(0,65fr)_minmax(440px,35fr)]">
      <div className="relative hidden lg:block h-full overflow-hidden bg-marque-nuit">
        <Image
          src={photo}
          alt={alt}
          fill
          priority
          sizes="65vw"
          className="zoom-lent object-cover saturate-[0.9] brightness-[1.05]"
        />

        <div
          className="degrade-anime absolute inset-0 mix-blend-multiply opacity-[0.3]"
          style={{
            background:
              "linear-gradient(135deg, #c41414 0%, #a3122a 26%, #1b3a6b 52%, #0a7a49 76%, #00a05b 100%)",
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-marque-nuit/80 from-0% via-marque-nuit/0 via-45% to-transparent" />
        <div className="absolute inset-x-0 top-0 h-[28%] bg-linear-to-b from-marque-nuit/45 to-transparent" />

        <div className="sur-sombre relative h-full flex flex-col justify-between p-10 xl:p-14">
          <LienSite className="apparition inline-block">
            <LogoOfficiel version="blanc" className="w-[250px] h-auto" />
          </LienSite>

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

      <div className="relative h-full overflow-hidden bg-[#fbfcfe]">
        <div aria-hidden className="grille-fine absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgb(255 255 255 / 0.82) 0%, rgb(255 255 255 / 0.55) 100%)",
          }}
        />
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
            <div className="carte-filet filet-fixe filet-degrade rounded-[var(--radius-l)] border border-line bg-surface shadow-[0_18px_44px_-24px_rgb(15_29_44/0.35)] px-6 py-8 sm:px-10 sm:py-11">
              <LienSite className="lg:hidden block mb-6">
                <LogoOfficiel className="w-[178px] h-auto" priority />
              </LienSite>
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

export function Alerte({ children }: { children: React.ReactNode }) {
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
