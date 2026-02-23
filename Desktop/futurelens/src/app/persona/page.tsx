import { Suspense } from "react";
import PersonaDetail from "@/components/persona/PersonaDetail";

export const metadata = {
  title: "FutureLens — Meet Your Future Self",
  description: "Explore your future self's personality, memories, and life before starting the conversation.",
};

export default function PersonaPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
          }}
        >
          Loading persona...
        </div>
      }
    >
      <PersonaDetail />
    </Suspense>
  );
}
