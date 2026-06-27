import type { ConceptId, ConceptStatus, Learner } from "./types";

export function seedLearner(uuid: string, name: string, context: string[]): Learner {
  const concepts: Record<ConceptId, ConceptStatus> = {
    scarcity: "complete",
    tradeoffs: "complete",
    price_signals: "locked",
    incentives: "in_progress",
    resource_allocation: "locked",
    supply_demand: "locked",
    market_equilibrium: "locked",
    market_failures: "locked",
    externalities: "locked",
  };

  return {
    uuid,
    name,
    context,
    createdAt: new Date().toISOString(),
    concepts,
    lessons: {
      incentives: {
        beat: 1,
        scenarioVariant: context.includes("sports") ? "B" : "A",
        conversation: [],
        trailMarkers: [],
      },
    },
  };
}
