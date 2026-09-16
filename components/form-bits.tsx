"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";

/** Champs de formulaire, accordés aux tokens de l'application. */
export const INPUT =
  "w-full border border-line bg-surface text-ink rounded-[var(--radius-s)] px-3 py-[9px] text-[13.6px] disabled:opacity-60";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12.3px] font-semibold text-muted mb-1.5">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-[11.5px] text-faint mt-1">{hint}</span>
      ) : null}
    </label>
  );
}

/**
 * Bouton d'envoi qui se désactive pendant le traitement.
 *
 * Sans cela, un double-clic sur « Enregistrer le paiement » crée deux factures.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  sm = false,
  className = "",
  ...rest
}: ComponentProps<"button"> & {
  pendingLabel?: string;
  variant?: "primary" | "line" | "ghost" | "danger";
  sm?: boolean;
}) {
  const { pending } = useFormStatus();

  const variants = {
    primary: "btn-action",
    line: "bg-transparent border-line text-ink hover:border-faint hover:bg-surface-2",
    ghost:
      "bg-transparent border-transparent text-muted hover:text-ink hover:bg-surface-2",
    danger: "bg-bad text-white border-transparent hover:opacity-90",
  };
  const primaire = variant === "primary";
  const size = primaire
    ? sm
      ? "btn-action-sm"
      : ""
    : sm
      ? "text-[12.4px] px-[11px] py-1.5"
      : "text-[13.4px] px-[15px] py-[9px]";

  const base = primaire
    ? ""
    : "inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border no-underline whitespace-nowrap transition-colors";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${base} disabled:opacity-60 disabled:cursor-wait ${size} ${variants[variant]} ${className}`}
      {...rest}
    >
      {pending ? (pendingLabel ?? "Envoi…") : children}
    </button>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-4 border-t border-line flex justify-end gap-2.5">
      {children}
    </div>
  );
}

export function ModalBody({ children }: { children: ReactNode }) {
  return <div className="px-5 py-5 flex flex-col gap-3.5">{children}</div>;
}

export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-line bg-transparent text-ink hover:bg-surface-2 text-[13.4px] px-[15px] py-[9px]"
    >
      Annuler
    </button>
  );
}
