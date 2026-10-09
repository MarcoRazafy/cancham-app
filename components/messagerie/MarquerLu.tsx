"use client";

import { useEffect } from "react";
import { markThreadRead } from "@/lib/actions/messages";
import type { Space } from "@/lib/types";

export function MarquerLu({
  threadId,
  space,
  nonLus,
  choixExplicite,
}: {
  threadId: string;
  space: Space;
  nonLus: number;
  choixExplicite: boolean;
}) {
  useEffect(() => {
    if (nonLus === 0) return;
    if (!choixExplicite && !window.matchMedia("(min-width: 768px)").matches)
      return;
    markThreadRead(threadId, space);
  }, [threadId, space, nonLus, choixExplicite]);
  return null;
}
