// src/lib/ai.ts
// Shared AI client using Groq (Llama 3.3 70B, OpenAI-compatible API).
// Groq free tier: 30 req/min, 14,400 req/day — plenty for a dev project.

import Groq from "groq-sdk";

function getClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

const MODEL = "llama-3.3-70b-versatile";

/**
 * Simple text generation.
 * Returns the generated text, or null if Groq is not configured.
 */
export async function generateText(
  prompt: string,
  systemInstruction?: string,
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  const res = await client.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: 2048,
    temperature: 0.7,
  });

  return res.choices[0]?.message?.content ?? null;
}

/**
 * Multi-turn chat completion.
 * Returns the assistant reply, or null if Groq is not configured.
 */
export async function chatCompletion(
  messages: { role: "user" | "assistant"; content: string }[],
  systemInstruction: string,
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemInstruction },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: groqMessages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  return res.choices[0]?.message?.content ?? null;
}
