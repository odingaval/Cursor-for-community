"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIConfigSummary = getAIConfigSummary;
exports.createAIServiceFromEnv = createAIServiceFromEnv;
const cursor_service_1 = require("./cursor-service");
const openai_service_1 = require("./openai-service");
function isCursorKey(key) {
    return key.startsWith("crsr_");
}
function getAIConfigSummary() {
    const service = createAIServiceFromEnv();
    return {
        configured: Boolean(service),
        provider: service?.provider,
    };
}
function createAIServiceFromEnv() {
    const mode = (process.env.AI_PROVIDER ?? "auto").toLowerCase();
    const cursorKey = process.env.CURSOR_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    if (mode === "cursor" || (mode === "auto" && cursorKey)) {
        const key = cursorKey ?? (openaiKey && isCursorKey(openaiKey) ? openaiKey : undefined);
        if (key) {
            return new cursor_service_1.CursorAIService({
                apiKey: key,
                model: process.env.CURSOR_MODEL ?? "composer-2.5-fast",
            });
        }
    }
    if (mode === "openai" || mode === "auto") {
        if (openaiKey && !isCursorKey(openaiKey)) {
            return new openai_service_1.OpenAIService({
                apiKey: openaiKey,
                baseURL: process.env.OPENAI_BASE_URL,
                model: process.env.OPENAI_MODEL,
            });
        }
        if (mode === "auto" && openaiKey && isCursorKey(openaiKey)) {
            return new cursor_service_1.CursorAIService({
                apiKey: openaiKey,
                model: process.env.CURSOR_MODEL ?? "composer-2.5-fast",
            });
        }
    }
    return null;
}
