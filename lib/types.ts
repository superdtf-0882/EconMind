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

export type ThreadType =
  | "main"
  | "fairness"
  | "fix-it"
  | "connection"
  | "philosophy"
  | "jump-ahead";

export type TrailMarker = {
  thread: Exclude<ThreadType, "main">;
  exchangeIndex: number;
  preview: string;
};

export type LessonState = {
  // 1 = opening scenario only, 2 = conversation in progress, 3 = unlocked
  beat: number;
  scenarioVariant: "A" | "B";
  conversation: Message[];
  trailMarkers: TrailMarker[];
};

export type Learner = {
  uuid: string;
  name: string;
  context: string[];
  createdAt: string;
  concepts: Record<ConceptId, ConceptStatus>;
  lessons: Partial<Record<ConceptId, LessonState>>;
};
