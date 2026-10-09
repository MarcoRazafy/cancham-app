import type { ReactNode } from "react";

export function Incident({
  icone,
  illustration,
  surtitre,
  titre,
  children,
  actions,
  pleinEcran = false,
}: {
  icone?: ReactNode;
  illustration?: ReactNode;
  surtitre: string;
  titre: string;
  children: ReactNode;
  actions: ReactNode;
  pleinEcran?: boolean;
}) {
  return (
    <div
      className={`${
        pleinEcran ? "min-h-dvh" : "min-h-[60vh]"
      } flex items-center justify-center px-5 py-14`}
    >
      <div className="max-w-[520px] text-center anim-echelle">
        {illustration ? (
          <div aria-hidden className="mb-4">
            {illustration}
          </div>
        ) : icone ? (
          <span
            aria-hidden
            className="mx-auto mb-5 w-14 h-14 rounded-full bg-accent-soft text-accent flex items-center justify-center"
          >
            {icone}
          </span>
        ) : null}
        <div className="text-[11px] tracking-[0.12em] uppercase text-faint font-semibold mb-2">
          {surtitre}
        </div>
        <h1 className="text-[clamp(24px,3vw,30px)] font-semibold m-0 mb-3">
          {titre}
        </h1>
        <div className="text-[14px] text-muted leading-relaxed">{children}</div>
        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          {actions}
        </div>
      </div>
    </div>
  );
}
