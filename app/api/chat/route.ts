import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const block = response.content[0];
    const text = block.type === "text" ? block.text : "";
    return Response.json({ content: text });
  } catch (err) {
    console.error("Claude API error:", err);
    return Response.json({ error: "chat_failed" }, { status: 502 });
  }
}
