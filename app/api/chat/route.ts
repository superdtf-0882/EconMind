import Anthropic from "@anthropic-ai/sdk";
import { buildTeachingPrompt, buildEvaluatorPrompt } from "@/lib/prompts";
import type { Message } from "@/lib/types";

const client = new Anthropic();

function textOf(block: { type: string; text?: string }): string {
  return block.type === "text" && block.text ? block.text : "";
}

function isColdOpenSeed(messages: Message[]): boolean {
  return messages.length === 1 && messages[0].role === "user" && messages[0].content.trim() === "Hi";
}

export async function POST(req: Request) {
  const { messages, learnerName, learnerContext } = (await req.json()) as {
    messages: Message[];
    learnerName: string;
    learnerContext?: string[];
  };

  // The client seeds a fresh conversation with a throwaway "Hi" turn just to satisfy
  // the API's at-least-one-message requirement. Treat it as no history at all so the
  // teaching prompt's first-message instruction actually fires.
  const conversationHistory = isColdOpenSeed(messages)
    ? ""
    : messages.map((m) => `${m.role === "user" ? learnerName : "Professor"}: ${m.content}`).join("\n\n");

  try {
    const [teachingResponse, evaluatorResponse] = await Promise.all([
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: buildTeachingPrompt(learnerName, conversationHistory, learnerContext),
        messages,
      }),
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 100,
        system: buildEvaluatorPrompt(),
        messages: [
          {
            role: "user",
            content: conversationHistory || "No conversation yet.",
          },
        ],
      }),
    ]);

    const rawTeaching = textOf(teachingResponse.content[0]);
    let thread = "main";
    let teachingText = rawTeaching;
    const firstLine = rawTeaching.split("\n")[0].trim();
    try {
      const parsed = JSON.parse(firstLine);
      if (parsed.thread) {
        thread = parsed.thread;
        teachingText = rawTeaching.slice(firstLine.length).trim();
      }
    } catch {
      // annotation missing — use full text
    }

    let demonstratedConcepts: string[] = [];
    try {
      demonstratedConcepts = JSON.parse(textOf(evaluatorResponse.content[0]).trim());
    } catch {
      // malformed — no concepts marked this turn
    }

    return Response.json({
      text: teachingText,
      thread,
      demonstratedConcepts,
    });
  } catch (err) {
    console.error("Claude API error:", err);
    return Response.json({ error: "chat_failed" }, { status: 502 });
  }
}
