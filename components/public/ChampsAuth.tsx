"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Champs des écrans d'identification.
 *
 * L'icône vit dans le champ, à gauche, et prend la couleur de la charte au
 * focus : le regard sait tout de suite où il écrit. Le mot de passe se montre
 * d'un clic — sur un téléphone, ressaisir à l'aveugle est la première cause
 * d'abandon.
 */

const CADRE =
  "w-full min-w-0 rounded-lg border border-line bg-white text-ink placeholder:text-faint py-3 text-[14px] outline-none transition-[border-color,box-shadow] focus:border-marque-vert focus:ring-2 focus:ring-marque-vert/15";

export function ChampAuth({
  label,
  hint,
  icone,
  children,
}: {
  label: string;
  hint?: string;
  icone?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block group">
      <span className="block text-[12.5px] font-semibold text-ink mb-1.5">
        {label}
      </span>
      <span className="relative block">
        {icone ? (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint transition-colors group-focus-within:text-marque-vert pointer-events-none">
            {icone}
          </span>
        ) : null}
        {children}
      </span>
      {hint ? (
        <span className="block text-[11.5px] text-faint mt-1">{hint}</span>
      ) : null}
    </label>
  );
}

/** Champ ordinaire, avec ou sans icône. */
export function Saisie({
  avecIcone = false,
  className = "",
  ...rest
}: ComponentProps<"input"> & { avecIcone?: boolean }) {
  return (
    <input
      {...rest}
      className={`${CADRE} ${avecIcone ? "pl-11 pr-3.5" : "px-3.5"} ${className}`}
    />
  );
}

/** Mot de passe, avec l'œil qui le dévoile. */
export function ChampMotDePasse({
  label,
  hint,
  icone,
  ...rest
}: ComponentProps<"input"> & {
  label: string;
  hint?: string;
  icone?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <ChampAuth label={label} hint={hint} icone={icone}>
      <>
        <input
          {...rest}
          id={rest.id ?? id}
          type={visible ? "text" : "password"}
          className={`${CADRE} ${icone ? "pl-11" : "pl-3.5"} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-surface-2 cursor-pointer bg-transparent border-0"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </>
    </ChampAuth>
  );
}

export const CHAMP_AUTH = CADRE;
