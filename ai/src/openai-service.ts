import OpenAI from "openai";
import { buildMessages } from "./prompts";
import type { AIContext } from "./prompts";
import type { AIResponse, AIService } from "./types";

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export class OpenAIService implements AIService {
  readonly provider = "openai" as const;
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.model = config.model ?? "gpt-4o-mini";
  }

  async chat(ctx: AIContext): Promise<AIResponse> {
    if (!ctx.activeFilePath && !Object.keys(ctx.allFiles).length) {
      return {
        content:
          "I need code context to help effectively. Open or create a file in the project, then ask your question again.",
        model: this.model,
      };
    }

    const messages = buildMessages(ctx);
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
    });

    const content =
      completion.choices[0]?.message?.content ??
      "I could not generate a response. Please try again.";

    return { content, model: this.model };
  }
}
