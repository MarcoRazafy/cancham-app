import Link from "next/link";

/**
 * Coquille de l'espace public : pas de sidebar, pas de navigation applicative.
 * Un visiteur n'est pas connecté et n'a rien à piloter.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-[980px] mx-auto px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/public" className="no-underline">
            <div className="font-[family-name:var(--font-display)] font-semibold text-[21px] text-ink">
              Can<span className="text-accent">Cham</span> Connect
            </div>
            <div className="text-[10px] tracking-[0.12em] uppercase text-faint">
              Chambre Canada – Madagascar
            </div>
          </Link>
          <nav className="flex items-center gap-2 text-[12.5px]">
            <Link
              href="/public/adhesion"
              className="font-semibold px-[15px] py-[9px] rounded-[var(--radius-s)] bg-accent text-white no-underline hover:bg-accent-strong"
            >
              Devenir membre
            </Link>
            <Link
              href="/membre"
              className="font-semibold px-[15px] py-[9px] rounded-[var(--radius-s)] border border-line text-ink no-underline hover:bg-surface-2"
            >
              Espace membre
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[980px] w-full mx-auto px-5 py-10">{children}</main>

      <footer className="border-t border-line">
        <div className="max-w-[980px] mx-auto px-5 py-5 text-[11.5px] text-faint flex justify-between gap-4 flex-wrap">
          <span>Maquette sans authentification — l’espace suit l’URL.</span>
          <span className="flex gap-3">
            <Link href="/" className="text-faint no-underline hover:text-ink">
              Choix de l’espace
            </Link>
            <Link href="/admin" className="text-faint no-underline hover:text-ink">
              Back-office
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
