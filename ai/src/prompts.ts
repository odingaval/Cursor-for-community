export interface AIContext {
  roomName: string;
  activeFilePath: string;
  activeFileContent: string;
  selectedCode?: string;
  allFiles: Record<string, string>;
  humanChatHistory: Array<{ userName: string; content: string }>;
  aiChatHistory: Array<{ role: "user" | "assistant"; content: string }>;
  errorLogs?: string;
  userRequest: string;
}

export function buildSystemPrompt(ctx: AIContext): string {
  const fileList = Object.keys(ctx.allFiles).join(", ") || "(none)";
  return `You are an expert coding assistant embedded in "Cursor for Communities" — a real-time collaborative IDE for hackathons and developer teams.

RULES:
- ALWAYS ground answers in the provided code context. Never invent files or APIs not shown.
- If context is insufficient, say what is missing and ask a focused question.
- Prefer concise, actionable answers with code snippets when helpful.
- Use markdown for formatting. Wrap code in fenced blocks with language tags.
- For debugging, reference specific lines from the current file when possible.
- You help with: explaining code, debugging, generating functions/components, and suggesting improvements.

ROOM: ${ctx.roomName}
ACTIVE FILE: ${ctx.activeFilePath}
PROJECT FILES: ${fileList}
${ctx.errorLogs ? `\nERROR LOGS:\n${ctx.errorLogs}\n` : ""}`;
}

export function buildUserPrompt(ctx: AIContext): string {
  const sections: string[] = [];

  sections.push(
    `## Current file: ${ctx.activeFilePath}\n\`\`\`\n${ctx.activeFileContent}\n\`\`\``
  );

  if (ctx.selectedCode?.trim()) {
    sections.push(`## Selected code\n\`\`\`\n${ctx.selectedCode}\n\`\`\``);
  }

  const otherFiles = Object.entries(ctx.allFiles).filter(([p]) => p !== ctx.activeFilePath);
  if (otherFiles.length > 0) {
    const preview = otherFiles
      .slice(0, 8)
      .map(
        ([path, content]) =>
          `### ${path}\n\`\`\`\n${content.slice(0, 2000)}${content.length > 2000 ? "\n...(truncated)" : ""}\n\`\`\``
      )
      .join("\n\n");
    sections.push(`## Other project files\n${preview}`);
  }

  if (ctx.humanChatHistory.length > 0) {
    const chat = ctx.humanChatHistory
      .slice(-10)
      .map((m) => `${m.userName}: ${m.content}`)
      .join("\n");
    sections.push(`## Recent team chat (for collaboration context)\n${chat}`);
  }

  sections.push(`## User request\n${ctx.userRequest}`);
  return sections.join("\n\n");
}

export function buildMessages(
  ctx: AIContext
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: buildSystemPrompt(ctx) },
  ];

  for (const msg of ctx.aiChatHistory.slice(-6)) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: "user", content: buildUserPrompt(ctx) });
  return messages;
}

/** Single prompt for Cursor SDK Agent.prompt (includes full project context). */
export function buildAgentPrompt(ctx: AIContext): string {
  const messages = buildMessages(ctx);
  return messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join("\n\n---\n\n");
}
