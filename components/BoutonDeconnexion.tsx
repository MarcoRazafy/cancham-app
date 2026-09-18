"use client";

import { LogOut } from "lucide-react";
import { deconnexion } from "@/lib/actions/auth";

/** Sortie de session, au pied des deux barres latérales. */
export function BoutonDeconnexion() {
  return (
    <form action={deconnexion} className="mx-3.5 mb-5">
      <button
        type="submit"
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-white/65 hover:text-white hover:bg-white/[0.08] bg-transparent border-0 cursor-pointer"
      >
        <LogOut size={17} className="shrink-0" />
        Se déconnecter
      </button>
    </form>
  );
}
