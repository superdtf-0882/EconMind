export type ConceptId =
  | "incentives"
  | "price_signals"
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

export type Learner = {
  uuid: string;
  name: string;
  context: string[];
  createdAt: string;
  concepts: Record<ConceptId, ConceptStatus>;
  conversation: Message[];
  trailMarkers: TrailMarker[];
};
