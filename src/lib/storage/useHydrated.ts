"use client";

/**
 * True once the persisted profile store has finished rehydrating on the
 * client. Prevents hydration mismatches for anything rendered from persisted
 * state (static-export pages prerender with the empty profile).
 */

import { useEffect, useState } from "react";
import { useProfileStore } from "./profile";

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useProfileStore.persist.onFinishHydration(() => setHydrated(true));
    if (useProfileStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);
  return hydrated;
}
