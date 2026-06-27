export type ConceptId =
  | "scarcity"
  | "tradeoffs"
  | "price_signals"
  | "incentives"
  | "resource_allocation"
  | "supply_demand"
  | "market_equilibrium"
  | "market_failures"
  | "externalities";

export type ConceptStatus = "locked" | "in_progress" | "complete";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type LessonState = {
  beat: number;
  scenarioVariant: "A" | "B";
  conversation: Message[];
};

export type Learner = {
  uuid: string;
  name: string;
  context: string[];
  createdAt: string;
  concepts: Record<ConceptId, ConceptStatus>;
  lessons: Partial<Record<ConceptId, LessonState>>;
};
