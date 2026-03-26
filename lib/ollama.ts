import { z } from "zod";

type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
};

type OllamaChatPayload = {
  model: string;
  messages: OllamaMessage[];
  format?: object | "json";
  stream?: boolean;
  options?: {
    temperature?: number;
  };
};

function getOllamaBaseUrl() {
  return process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
}

export function getVisionModel() {
  return process.env.OLLAMA_VISION_MODEL || "gemma3";
}

export function getTextModel() {
  return process.env.OLLAMA_TEXT_MODEL || getVisionModel();
}

export async function chatWithOllama<T>({
  model,
  messages,
  schema
}: {
  model: string;
  messages: OllamaMessage[];
  schema: z.ZodType<T>;
}) {
  const payload: OllamaChatPayload = {
    model,
    messages,
    format: z.toJSONSchema(schema),
    stream: false,
    options: {
      temperature: 0
    }
  };

  const response = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const rawText = await response.text();
  let raw: unknown = null;

  try {
    raw = rawText ? JSON.parse(rawText) : null;
  } catch {
    raw = null;
  }

  if (!response.ok) {
    const errorMessage =
      raw && typeof raw === "object" && "error" in raw && typeof raw.error === "string"
        ? raw.error
        : "Ollama request failed. Make sure Ollama is running and the model is installed.";
    throw new Error(errorMessage);
  }

  const content =
    raw && typeof raw === "object" && "message" in raw && raw.message && typeof raw.message === "object" && "content" in raw.message
      ? raw.message.content
      : undefined;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Ollama returned an empty response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Ollama did not return valid JSON.");
  }

  return schema.parse(parsed);
}
