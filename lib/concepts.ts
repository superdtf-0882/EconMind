import type { ConceptId } from "./types";

export type ConceptTier = {
  title: string;
  concepts: { id: ConceptId; name: string; description: string }[];
};

export const CONCEPT_SPINE: ConceptTier[] = [
  {
    title: "Foundation",
    concepts: [
      { id: "scarcity", name: "Scarcity", description: "Not enough for everyone" },
      { id: "tradeoffs", name: "Trade-offs", description: "Every choice has a cost" },
    ],
  },
  {
    title: "Signal layer",
    concepts: [
      { id: "price_signals", name: "Price signals", description: "Prices carry information" },
      { id: "incentives", name: "Incentives", description: "Why people do what they do" },
    ],
  },
  {
    title: "Allocation",
    concepts: [
      { id: "resource_allocation", name: "Resource allocation", description: "Who gets what, and how" },
      { id: "supply_demand", name: "Supply & demand", description: "How markets find a price" },
    ],
  },
  {
    title: "Market limits",
    concepts: [
      { id: "market_equilibrium", name: "Market equilibrium", description: "When price settles" },
      { id: "market_failures", name: "Market failures", description: "When prices get it wrong" },
    ],
  },
  {
    title: "Payoff",
    concepts: [
      { id: "externalities", name: "Externalities", description: "Why the park makes your house worth more" },
    ],
  },
];

export const ALL_CONCEPT_IDS: ConceptId[] = CONCEPT_SPINE.flatMap((tier) =>
  tier.concepts.map((c) => c.id)
);

export function conceptName(id: ConceptId): string {
  for (const tier of CONCEPT_SPINE) {
    const found = tier.concepts.find((c) => c.id === id);
    if (found) return found.name;
  }
  return id;
}

export function conceptDescription(id: ConceptId): string {
  for (const tier of CONCEPT_SPINE) {
    const found = tier.concepts.find((c) => c.id === id);
    if (found) return found.description;
  }
  return "";
}
