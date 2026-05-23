import { CursorAIService } from "./cursor-service";
import { OpenAIService } from "./openai-service";
import type { AIService } from "./types";

function isCursorKey(key: string): boolean {
  return key.startsWith("crsr_");
}

export function getAIConfigSummary(): { configured: boolean; provider?: string } {
  const service = createAIServiceFromEnv();
  return {
    configured: Boolean(service),
    provider: service?.provider,
  };
}

export function createAIServiceFromEnv(): AIService | null {
  const mode = (process.env.AI_PROVIDER ?? "auto").toLowerCase();
  const cursorKey = process.env.CURSOR_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (mode === "cursor" || (mode === "auto" && cursorKey)) {
    const key = cursorKey ?? (openaiKey && isCursorKey(openaiKey) ? openaiKey : undefined);
    if (key) {
      return new CursorAIService({
        apiKey: key,
        model: process.env.CURSOR_MODEL ?? "composer-2.5-fast",
      });
    }
  }

  if (mode === "openai" || mode === "auto") {
    if (openaiKey && !isCursorKey(openaiKey)) {
      return new OpenAIService({
        apiKey: openaiKey,
        baseURL: process.env.OPENAI_BASE_URL,
        model: process.env.OPENAI_MODEL,
      });
    }
    if (mode === "auto" && openaiKey && isCursorKey(openaiKey)) {
      return new CursorAIService({
        apiKey: openaiKey,
        model: process.env.CURSOR_MODEL ?? "composer-2.5-fast",
      });
    }
  }

  return null;
}
