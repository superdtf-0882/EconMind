import Anthropic from "@anthropic-ai/sdk";
import { buildTeachingPrompt, buildEvaluatorPrompt, buildLandingPrompt } from "@/lib/prompts";
import type { Message } from "@/lib/types";

const client = new Anthropic();

function textOf(block: { type: string; text?: string }): string {
  return block.type === "text" && block.text ? block.text : "";
}

export async function POST(req: Request) {
  const { messages, learnerName, concept, learnerContext } = (await req.json()) as {
    messages: Message[];
    learnerName: string;
    concept?: string;
    learnerContext?: string[];
  };

  const conversationHistory = messages
    .map((m) => `${m.role === "user" ? learnerName : "Tutor"}: ${m.content}`)
    .join("\n\n");

  try {
    const [teachingResponse, evaluatorResponse] = await Promise.all([
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: buildTeachingPrompt(learnerName, conversationHistory, concept, learnerContext),
        messages,
      }),
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 150,
        system: buildEvaluatorPrompt(concept),
        messages: [
          {
            role: "user",
            content: `Here is the full conversation:\n\n${conversationHistory}`,
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
      // annotation missing — use full text, thread stays "main"
    }

    const evaluatorText = textOf(evaluatorResponse.content[0]).trim();
    const understood = evaluatorText.toUpperCase().startsWith("YES");
    const evaluatorReasoning = evaluatorText.replace(/^(YES|NO)[.,:\s]*/i, "").trim();

    if (understood) {
      const landingResponse = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        system: buildLandingPrompt(learnerName, evaluatorReasoning),
        messages,
      });
      const landingText = textOf(landingResponse.content[0]).replace("[ADVANCE]", "").trim();

      return Response.json({
        text: landingText,
        thread,
        advance: true,
        unlockSummary: evaluatorReasoning,
      });
    }

    return Response.json({
      text: teachingText,
      thread,
      advance: false,
      unlockSummary: null,
    });
  } catch (err) {
    console.error("Claude API error:", err);
    return Response.json({ error: "chat_failed" }, { status: 502 });
  }
}
