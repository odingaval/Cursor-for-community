"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface AIMsg {
  id: string;
  role: string;
  content: string;
  timestamp: number;
}

export function AIPanel({
  messages,
  onSend,
  loading,
  error,
}: {
  messages: AIMsg[];
  onSend: (message: string, opts?: { selectedCode?: string; errorLogs?: string }) => Promise<void>;
  loading: boolean;
  error?: string | null;
}) {
  const [text, setText] = useState("");
  const [errorLogs, setErrorLogs] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || loading) return;
    const msg = text.trim();
    setText("");
    const selected = window.getSelection()?.toString();
    await onSend(msg, {
      selectedCode: selected || undefined,
      errorLogs: errorLogs.trim() || undefined,
    });
  };

  return (
    <div className="flex flex-col h-full border-l border-surface-border bg-[#0c0e14]">
      <div className="px-3 py-2 border-b border-surface-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="text-accent">✦</span> AI Assistant
        </h3>
        <p className="text-xs text-gray-500">Context-aware · sees your code</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Ask me to explain, debug, or generate code. I use your current file and project
            context.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-sm ${m.role === "user" ? "text-right" : ""}`}
          >
            <div
              className={`inline-block max-w-full text-left rounded-lg px-3 py-2 ${
                m.role === "user"
                  ? "bg-accent/15 text-gray-200 ml-auto"
                  : "bg-surface-raised border border-surface-border"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {loading && (
          <p className="text-sm text-gray-500 animate-pulse">Thinking with project context…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 border-t border-surface-border space-y-2">
        <textarea
          value={errorLogs}
          onChange={(e) => setErrorLogs(e.target.value)}
          placeholder="Paste error logs (optional)…"
          rows={2}
          className="w-full text-xs px-2 py-1.5 rounded bg-surface border border-surface-border focus:outline-none resize-none font-mono"
        />
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI… (⌘/Ctrl+Enter)"
            rows={2}
            className="flex-1 text-sm px-3 py-2 rounded-lg bg-surface border border-surface-border focus:outline-none resize-none"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="self-end px-3 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50 text-sm font-medium"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
