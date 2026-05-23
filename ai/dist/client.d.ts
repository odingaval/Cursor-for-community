import { type AIContext } from "./prompts";
export interface AIConfig {
    apiKey: string;
    baseURL?: string;
    model?: string;
}
export interface AIResponse {
    content: string;
    model: string;
}
export declare class AIService {
    private client;
    private model;
    constructor(config: AIConfig);
    chat(ctx: AIContext): Promise<AIResponse>;
    isConfigured(): boolean;
}
export declare function createAIServiceFromEnv(): AIService | null;
