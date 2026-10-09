"use client";

import { useEffect, type ReactNode } from "react";

export function ProtectionDocument({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const bloquer = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "c", "a"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", bloquer);
    return () => window.removeEventListener("keydown", bloquer);
  }, []);

  const empecher = (e: { preventDefault: () => void }) => e.preventDefault();

  return (
    <div
      className={`select-none [&_img]:pointer-events-none [&_img]:select-none ${className}`}
      onContextMenu={empecher}
      onDragStart={empecher}
      onCopy={empecher}
      onCut={empecher}
    >
      {children}
    </div>
  );
}
