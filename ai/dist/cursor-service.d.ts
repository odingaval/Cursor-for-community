import { type AIContext } from "./prompts";
import type { AIResponse, AIService } from "./types";
export interface CursorConfig {
    apiKey: string;
    model?: string;
}
export declare class CursorAIService implements AIService {
    readonly provider: "cursor";
    private apiKey;
    private model;
    constructor(config: CursorConfig);
    chat(ctx: AIContext): Promise<AIResponse>;
}
