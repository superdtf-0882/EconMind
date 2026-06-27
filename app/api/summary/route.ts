import Anthropic from "@anthropic-ai/sdk";
import { buildSummaryPrompt } from "@/lib/prompts";
import type { Message, TrailMarker } from "@/lib/types";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages, learnerName, trailMarkers } = (await req.json()) as {
    messages: Message[];
    learnerName: string;
    trailMarkers: TrailMarker[];
  };

  const conversationHistory = messages
    .map((m) => `${m.role === "user" ? learnerName : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const systemPrompt = buildSummaryPrompt(
    learnerName,
    conversationHistory,
    trailMarkers.map((m) => m.thread)
  );

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: "user", content: "Write the summary now." }],
    });

    const block = response.content[0];
    const summary = block.type === "text" ? block.text.trim() : "";
    return Response.json({ summary });
  } catch (err) {
    console.error("Summary API error:", err);
    return Response.json({ error: "summary_failed" }, { status: 502 });
  }
}
