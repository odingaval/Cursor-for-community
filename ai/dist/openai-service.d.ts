import { type AIContext } from "./prompts";
import type { AIResponse, AIService } from "./types";
export interface OpenAIConfig {
    apiKey: string;
    baseURL?: string;
    model?: string;
}
export declare class OpenAIService implements AIService {
    readonly provider: "openai";
    private client;
    private model;
    constructor(config: OpenAIConfig);
    chat(ctx: AIContext): Promise<AIResponse>;
}
