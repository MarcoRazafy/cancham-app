"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export function LienAncre({
  href,
  className,
  actif = false,
  children,
}: {
  href: string;
  className?: string;
  actif?: boolean;
  children: ReactNode;
}) {
  const chemin = usePathname();
  const [page, ancre] = href.split("#");
  const surPlace = !!ancre && (page === "" || page === chemin);

  const cliquer = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!surPlace || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const cible = document.getElementById(ancre);
    if (!cible) return;
    e.preventDefault();
    cible.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    history.replaceState(null, "", `#${ancre}`);
  };

  return (
    <Link
      href={href}
      className={className}
      aria-current={actif ? "page" : undefined}
      onClick={cliquer}
    >
      {children}
    </Link>
  );
}
