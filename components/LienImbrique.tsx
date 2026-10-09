"use client";

import type { ReactNode } from "react";

export function LienImbrique({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const ouvrir = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(
      href,
      href.startsWith("mailto:") ? "_self" : "_blank",
      "noopener,noreferrer",
    );
  };
  return (
    <span
      role="link"
      tabIndex={0}
      onClick={ouvrir}
      onKeyDown={(e) => {
        if (e.key === "Enter") ouvrir(e);
      }}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </span>
  );
}
