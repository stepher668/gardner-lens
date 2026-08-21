import { useCallback, useState } from "react";
import { getArtwork } from "./api/client";
import { Camera } from "./screens/Camera";
import { Collection } from "./screens/Collection";
import { Landing } from "./screens/Landing";
import { ResultDrawer } from "./screens/ResultDrawer";
import { SessionProvider, useSession } from "./state/SessionContext";
import type { ArtworkDetailOut } from "./api/types";

type Screen = "collection" | "camera";

function AppShell() {
  const { sessionId, setSessionId, collection, refreshCollection, hasSeenLanding, markLandingSeen, resetSession } = useSession();
  const [screen, setScreen] = useState<Screen>("camera");
  const [resultArtwork, setResultArtwork] = useState<ArtworkDetailOut | null>(null);

  const handleResolved = useCallback(
    (artwork: ArtworkDetailOut) => {
      setResultArtwork(artwork);
      setScreen("collection");
      void refreshCollection();
    },
    [refreshCollection],
  );

  const handleCloseDrawer = useCallback(() => setResultArtwork(null), []);

  const handleNewPic = useCallback(() => {
    setResultArtwork(null);
    setScreen("camera");
  }, []);

  const handleGoToCollection = useCallback(() => setScreen("collection"), []);

  const handleSelectCollectionItem = useCallback(async (artworkId: string) => {
    try {
      const artwork = await getArtwork(artworkId);
      setResultArtwork(artwork);
    } catch {
      // Transient failure - the visitor just stays on Collection; nothing
      // destructive happened, so no error UI needed for this pass.
    }
  }, []);

  const handleResetSession = useCallback(() => {
    setResultArtwork(null);
    setScreen("camera");
    resetSession();
  }, [resetSession]);

  if (!hasSeenLanding) {
    return (
      <Landing
        onStart={() => {
          markLandingSeen();
          setScreen("camera");
        }}
      />
    );
  }

  return (
    <>
      {screen === "camera" ? (
        <Camera
          sessionId={sessionId}
          onSessionId={setSessionId}
          onResolved={handleResolved}
          collectionCount={collection?.count ?? 0}
          onGoToCollection={handleGoToCollection}
        />
      ) : (
        <Collection collection={collection} onNewPic={handleNewPic} onResetSession={handleResetSession} onSelectItem={(id) => void handleSelectCollectionItem(id)} />
      )}
      {resultArtwork && <ResultDrawer artwork={resultArtwork} onClose={handleCloseDrawer} onNewPic={handleNewPic} />}
    </>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppShell />
    </SessionProvider>
  );
}
