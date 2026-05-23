export interface AIContext {
    roomName: string;
    activeFilePath: string;
    activeFileContent: string;
    selectedCode?: string;
    allFiles: Record<string, string>;
    humanChatHistory: Array<{
        userName: string;
        content: string;
    }>;
    aiChatHistory: Array<{
        role: "user" | "assistant";
        content: string;
    }>;
    errorLogs?: string;
    userRequest: string;
}
export declare function buildSystemPrompt(ctx: AIContext): string;
export declare function buildUserPrompt(ctx: AIContext): string;
export declare function buildMessages(ctx: AIContext): Array<{
    role: "system" | "user" | "assistant";
    content: string;
}>;
/** Single prompt for Cursor SDK Agent.prompt (includes full project context). */
export declare function buildAgentPrompt(ctx: AIContext): string;
