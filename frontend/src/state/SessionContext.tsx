import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getCollection } from "../api/client";
import type { CollectionOut } from "../api/types";

const SESSION_ID_KEY = "gardner-lens.session-id";
const LANDING_SEEN_KEY = "gardner-lens.landing-seen";

interface SessionContextValue {
  sessionId: string | null;
  setSessionId: (id: string) => void;
  collection: CollectionOut | null;
  refreshCollection: () => Promise<void>;
  hasSeenLanding: boolean;
  markLandingSeen: () => void;
  /** "Start Over" (Collection screen tease). Forgets the session_id and
   * the landing-seen flag client-side - the server-side Visit row is left
   * to expire on its own 24h TTL rather than needing a delete endpoint,
   * matching how the Claude Design export's own resetDemo works (it has
   * no backend to reset either). */
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function readStoredSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_ID_KEY);
  } catch {
    // Private browsing / storage disabled - the app still works, it just
    // won't remember the visitor's collection across a reload.
    return null;
  }
}

function readLandingSeen(): boolean {
  try {
    return localStorage.getItem(LANDING_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionIdState] = useState<string | null>(() => readStoredSessionId());
  const [collection, setCollection] = useState<CollectionOut | null>(null);
  const [hasSeenLanding, setHasSeenLanding] = useState<boolean>(() => readLandingSeen());

  const setSessionId = useCallback((id: string) => {
    setSessionIdState(id);
    try {
      localStorage.setItem(SESSION_ID_KEY, id);
    } catch {
      // ignore - session still works for this page lifetime
    }
  }, []);

  const markLandingSeen = useCallback(() => {
    setHasSeenLanding(true);
    try {
      localStorage.setItem(LANDING_SEEN_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  const refreshCollection = useCallback(async () => {
    if (!sessionId) {
      setCollection(null);
      return;
    }
    try {
      const result = await getCollection(sessionId);
      setCollection(result);
    } catch {
      // A stale/expired session_id (24h TTL) - the empty-state Collection
      // screen renders fine with collection === null.
      setCollection(null);
    }
  }, [sessionId]);

  useEffect(() => {
    void refreshCollection();
  }, [refreshCollection]);

  const resetSession = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_ID_KEY);
      localStorage.removeItem(LANDING_SEEN_KEY);
    } catch {
      // ignore
    }
    setSessionIdState(null);
    setCollection(null);
    setHasSeenLanding(false);
  }, []);

  const value = useMemo(
    () => ({ sessionId, setSessionId, collection, refreshCollection, hasSeenLanding, markLandingSeen, resetSession }),
    [sessionId, setSessionId, collection, refreshCollection, hasSeenLanding, markLandingSeen, resetSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
