"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorAIService = void 0;
const os_1 = __importDefault(require("os"));
const sdk_1 = require("@cursor/sdk");
const prompts_1 = require("./prompts");
class CursorAIService {
    provider = "cursor";
    apiKey;
    model;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.model = config.model ?? "composer-2.5-fast";
    }
    async chat(ctx) {
        if (!ctx.activeFilePath && !Object.keys(ctx.allFiles).length) {
            return {
                content: "I need code context to help effectively. Open or create a file in the project, then ask your question again.",
                model: this.model,
            };
        }
        const prompt = (0, prompts_1.buildAgentPrompt)(ctx);
        try {
            const result = await sdk_1.Agent.prompt(prompt, {
                apiKey: this.apiKey,
                model: { id: this.model },
                name: `cfc-${ctx.roomName}`.slice(0, 64),
                local: { cwd: os_1.default.tmpdir() },
            });
            if (result.status === "error") {
                throw new Error("Cursor agent run failed. Try again or check your API key plan.");
            }
            const content = result.result?.trim() || "No response generated.";
            return { content, model: this.model };
        }
        catch (err) {
            if (err instanceof sdk_1.CursorAgentError) {
                const hint = err.message.includes("cursor") || err.message.includes("CLI")
                    ? " Install Cursor CLI or set AI_PROVIDER=openai with an OpenAI key."
                    : "";
                throw new Error(`Cursor AI: ${err.message}${hint}`);
            }
            throw err;
        }
    }
}
exports.CursorAIService = CursorAIService;
