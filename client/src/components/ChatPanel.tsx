"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  userName: string;
  content: string;
  timestamp: number;
}

export function ChatPanel({
  messages,
  onSend,
  currentUserId,
}: {
  messages: Message[];
  onSend: (content: string) => void;
  currentUserId?: string;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-surface-border">
        <h3 className="text-sm font-semibold">Team chat</h3>
        <p className="text-xs text-gray-500">Collaborate with your team</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium text-accent/90">{m.userName}</span>
            <span className="text-gray-600 text-xs ml-2">
              {new Date(m.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <p className="text-gray-300 mt-0.5 whitespace-pre-wrap break-words">{m.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t border-surface-border flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Message the team…"
          className="flex-1 text-sm px-3 py-2 rounded-lg bg-surface border border-surface-border focus:outline-none focus:border-accent/40"
        />
        <button
          onClick={handleSend}
          className="px-3 py-2 rounded-lg bg-surface-border hover:bg-gray-600 text-sm font-medium transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
