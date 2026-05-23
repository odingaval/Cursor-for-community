import type { AIContext } from "./prompts";

export interface AIResponse {
  content: string;
  model: string;
}

export interface AIService {
  readonly provider: "openai" | "cursor";
  chat(ctx: AIContext): Promise<AIResponse>;
}
