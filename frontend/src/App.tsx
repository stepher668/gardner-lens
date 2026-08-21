import { useCallback, useState } from "react";
import { Camera } from "./screens/Camera";
import { Collection } from "./screens/Collection";
import { Landing } from "./screens/Landing";
import { ResultDrawer } from "./screens/ResultDrawer";
import { SessionProvider, useSession } from "./state/SessionContext";
import type { ArtworkDetailOut } from "./api/types";

type Screen = "collection" | "camera";

function AppShell() {
  const { sessionId, setSessionId, collection, refreshCollection, hasSeenLanding, markLandingSeen } = useSession();
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
        <Camera sessionId={sessionId} onSessionId={setSessionId} onResolved={handleResolved} />
      ) : (
        <Collection collection={collection} onNewPic={handleNewPic} />
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
