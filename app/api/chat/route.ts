import Anthropic from "@anthropic-ai/sdk";
import { buildTeachingPrompt, buildEvaluatorPrompt, buildLandingPrompt } from "@/lib/prompts";
import type { Message } from "@/lib/types";

const client = new Anthropic();

function textOf(block: { type: string; text?: string }): string {
  return block.type === "text" && block.text ? block.text : "";
}

function parseThread(raw: string): { thread: string; text: string } {
  let thread = "main";
  let text = raw;
  const firstLine = raw.split("\n")[0].trim();
  try {
    const parsed = JSON.parse(firstLine);
    if (parsed.thread) {
      thread = parsed.thread;
      text = raw.slice(firstLine.length).trim();
    }
  } catch {
    // annotation missing — use full text, thread stays "main"
  }
  return { thread, text };
}

export async function POST(req: Request) {
  const { messages, learnerName, concept, learnerContext, opening, postUnlock } =
    (await req.json()) as {
      messages: Message[];
      learnerName: string;
      concept?: string;
      learnerContext?: string[];
      opening?: boolean;
      postUnlock?: boolean;
    };

  try {
    // Cold open: the learner hasn't said anything real yet. `messages` carries a
    // throwaway seed turn just to satisfy the API's "at least one message" rule —
    // conversationHistory stays empty so the prompt's first-message instruction fires.
    //
    // Post-unlock: the concept is already complete. The learner can keep talking
    // with the professor, but there's nothing left to evaluate or land — just teach.
    if (opening || postUnlock) {
      const history = opening
        ? ""
        : messages.map((m) => `${m.role === "user" ? learnerName : "Tutor"}: ${m.content}`).join("\n\n");

      const teachingResponse = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: buildTeachingPrompt(learnerName, history, concept, learnerContext),
        messages,
      });
      const { thread, text } = parseThread(textOf(teachingResponse.content[0]));
      return Response.json({ text, thread, advance: false, unlockSummary: null });
    }

    const conversationHistory = messages
      .map((m) => `${m.role === "user" ? learnerName : "Tutor"}: ${m.content}`)
      .join("\n\n");

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

    const { thread, text: teachingText } = parseThread(textOf(teachingResponse.content[0]));

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
