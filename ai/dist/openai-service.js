"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const prompts_1 = require("./prompts");
class OpenAIService {
    provider = "openai";
    client;
    model;
    constructor(config) {
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
        });
        this.model = config.model ?? "gpt-4o-mini";
    }
    async chat(ctx) {
        if (!ctx.activeFilePath && !Object.keys(ctx.allFiles).length) {
            return {
                content: "I need code context to help effectively. Open or create a file in the project, then ask your question again.",
                model: this.model,
            };
        }
        const messages = (0, prompts_1.buildMessages)(ctx);
        const completion = await this.client.chat.completions.create({
            model: this.model,
            messages,
            temperature: 0.3,
            max_tokens: 2048,
        });
        const content = completion.choices[0]?.message?.content ??
            "I could not generate a response. Please try again.";
        return { content, model: this.model };
    }
}
exports.OpenAIService = OpenAIService;
