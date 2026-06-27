import type { ConceptId, ConceptStatus, Learner } from "./types";

export function seedLearner(uuid: string, name: string, context: string[]): Learner {
  const concepts: Record<ConceptId, ConceptStatus> = {
    incentives: "locked",
    price_signals: "locked",
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
    conversation: [],
    trailMarkers: [],
  };
}
