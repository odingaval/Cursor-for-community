import type { AIService } from "./types";
export type AIProviderMode = "auto" | "openai" | "cursor";
export declare function getAIConfigSummary(): {
    configured: boolean;
    provider?: "openai" | "cursor";
};
export declare function createAIServiceFromEnv(): AIService | null;
