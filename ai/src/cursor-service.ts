import os from "os";
import { Agent, CursorAgentError } from "@cursor/sdk";
import { buildAgentPrompt } from "./prompts";
import type { AIContext } from "./prompts";
import type { AIResponse, AIService } from "./types";

export interface CursorAIConfig {
  apiKey: string;
  model?: string;
}

export class CursorAIService implements AIService {
  readonly provider = "cursor" as const;
  private apiKey: string;
  private model: string;

  constructor(config: CursorAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "composer-2.5-fast";
  }

  async chat(ctx: AIContext): Promise<AIResponse> {
    if (!ctx.activeFilePath && !Object.keys(ctx.allFiles).length) {
      return {
        content:
          "I need code context to help effectively. Open or create a file in the project, then ask your question again.",
        model: this.model,
      };
    }

    const prompt = buildAgentPrompt(ctx);

    try {
      const result = await Agent.prompt(prompt, {
        apiKey: this.apiKey,
        model: { id: this.model },
        name: `cfc-${ctx.roomName}`.slice(0, 64),
        local: { cwd: os.tmpdir() },
      });

      if (result.status === "error") {
        throw new Error("Cursor agent run failed. Try again or check your API key plan.");
      }

      const content = result.result?.trim() || "No response generated.";
      return { content, model: this.model };
    } catch (err) {
      if (err instanceof CursorAgentError) {
        const hint =
          err.message.includes("cursor") || err.message.includes("CLI")
            ? " Install Cursor CLI or set AI_PROVIDER=openai with an OpenAI key."
            : "";
        throw new Error(`Cursor AI: ${err.message}${hint}`);
      }
      throw err;
    }
  }
}
