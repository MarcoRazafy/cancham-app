import { SubmitButton } from "@/components/form-bits";
import { VisuelMode } from "@/components/paiement/IconeMode";
import { MODES, ORDRE_MODES, type ModeReglement } from "@/lib/modes-reglement";

export function GrilleMoyens({
  modes,
  bientot = [],
  colonnes = "sm:grid-cols-2 lg:grid-cols-4",
}: {
  modes: ModeReglement[];
  bientot?: ModeReglement[];
  colonnes?: string;
}) {
  return (
    <div className={`grid gap-3 ${colonnes}`}>
      {ORDRE_MODES.map((m) =>
        modes.includes(m) ? (
          <SubmitButton
            key={m}
            name="mode"
            value={m}
            variant="line"
            pendingLabel="Ouverture…"
            className="h-full min-h-[112px] w-full min-w-0 flex-col items-center justify-center gap-2.5 px-4 py-4 text-center whitespace-normal!"
          >
            <VisuelMode mode={m} />
            <span className="text-[15px] font-semibold text-ink">
              {MODES[m].titre}
            </span>
          </SubmitButton>
        ) : bientot.includes(m) ? (
          <div
            key={m}
            aria-disabled="true"
            className="flex h-full min-h-[112px] min-w-0 cursor-not-allowed flex-col items-center justify-center gap-2.5 rounded-[var(--radius-s)] border border-dashed border-line bg-surface-2 px-4 py-4 text-center"
          >
            <span className="opacity-50 grayscale">
              <VisuelMode mode={m} />
            </span>
            <span className="text-[15px] font-semibold text-muted">
              {MODES[m].titre}
            </span>
            <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-[12px] font-semibold text-muted">
              Bientôt disponible
            </span>
          </div>
        ) : null,
      )}
    </div>
  );
}
