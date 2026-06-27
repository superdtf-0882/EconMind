import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/prompts";
import type { Message } from "@/lib/types";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages, learnerName } = (await req.json()) as {
    messages: Message[];
    learnerName: string;
  };

  const conversationHistory = messages
    .map((m) => `${m.role === "user" ? learnerName : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const systemPrompt = buildSystemPrompt(learnerName, conversationHistory);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const block = response.content[0];
    const raw = block.type === "text" ? block.text : "";

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
      // annotation missing or malformed — treat as main, use full text
    }

    const advance = text.includes("[ADVANCE]");
    text = text.replace("[ADVANCE]", "").trim();

    return Response.json({ text, thread, advance });
  } catch (err) {
    console.error("Claude API error:", err);
    return Response.json({ error: "chat_failed" }, { status: 502 });
  }
}
