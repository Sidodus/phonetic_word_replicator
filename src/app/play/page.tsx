import { Suspense } from "react";
import GamePage from "@/components/game/GamePage";

// useSearchParams requires a Suspense boundary for static prerendering.
export default function PlayRoute() {
  return (
    <Suspense fallback={null}>
      <GamePage />
    </Suspense>
  );
}
