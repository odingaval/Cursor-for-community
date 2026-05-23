"use client";

import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import { useRoom } from "@/hooks/useRoom";
import { FileExplorer } from "./FileExplorer";
import { ParticipantList } from "./ParticipantList";
import { ChatPanel } from "./ChatPanel";
import { AIPanel } from "./AIPanel";
import { CodeEditor } from "./CodeEditor";

interface RoomWorkspaceProps {
  roomId: string;
  userName: string;
  role: "member" | "mentor";
}

export function RoomWorkspace({ roomId, userName, role }: RoomWorkspaceProps) {
  const {
    connected,
    room,
    participant,
    error,
    yDoc,
    setActiveFile,
    sendChat,
    sendAI,
    createFile,
    deleteFile,
    renameFile,
    updateAwareness,
    ensureFileYText,
    getFileYText,
  } = useRoom(roomId, userName, role);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [sideTab, setSideTab] = useState<"chat" | "ai">("chat");
  const [copied, setCopied] = useState(false);

  const activeFile = room?.activeFile ?? "src/index.ts";
  const [yText, setYText] = useState<Y.Text | null>(null);

  useEffect(() => {
    if (!room) {
      setYText(null);
      return;
    }
    for (const f of room.files) {
      ensureFileYText(f.path, f.content);
    }
    const content = room.files.find((f) => f.path === activeFile)?.content ?? "";
    const text = getFileYText(activeFile) ?? ensureFileYText(activeFile, content);
    setYText(text);
  }, [room, activeFile, ensureFileYText, getFileYText]);

  const handleAI = useCallback(
    async (message: string, opts?: { selectedCode?: string; errorLogs?: string }) => {
      setAiLoading(true);
      setAiError(null);
      try {
        const result = await sendAI(message, { ...opts, activeFile });
        if (!result.ok) {
          setAiError(result.error ?? "AI request failed");
        }
      } finally {
        setAiLoading(false);
      }
    },
    [sendAI, activeFile]
  );

  const copyInvite = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-400 text-sm leading-relaxed">{error}</p>
          <a href="/" className="inline-block text-accent hover:underline">
            ← Back home to create a room
          </a>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        {connected ? "Joining room…" : "Connecting to server…"}
      </div>
    );
  }

  const canEdit = participant?.canEdit !== false;

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      <header className="flex items-center gap-4 px-4 py-2 border-b border-surface-border bg-surface-raised shrink-0">
        <a href="/" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Home
        </a>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{room.name}</h1>
          <p className="text-xs text-gray-500 font-mono">
            Room {roomId}
            <span className={`ml-2 ${connected ? "text-accent" : "text-amber-500"}`}>
              {connected ? "● live" : "○ reconnecting"}
            </span>
          </p>
        </div>
        <button
          onClick={copyInvite}
          className="text-sm px-3 py-1.5 rounded-lg border border-surface-border hover:bg-white/5 transition"
        >
          {copied ? "Copied!" : "Copy invite link"}
        </button>
        <span className="text-sm text-gray-400">
          {participant?.name}
          {participant?.role === "mentor" && (
            <span className="ml-1 text-amber-400">(mentor)</span>
          )}
        </span>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="w-48 shrink-0 flex flex-col">
          <ParticipantList participants={room.participants} />
          <div className="flex-1 min-h-0">
            <FileExplorer
              files={room.files}
              activeFile={activeFile}
              onSelect={setActiveFile}
              onCreate={createFile}
              onDelete={deleteFile}
              onRename={renameFile}
            />
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="px-3 py-1.5 border-b border-surface-border text-xs font-mono text-gray-500 flex items-center gap-2">
            <span>{activeFile}</span>
            {!canEdit && <span className="text-amber-500">(read-only)</span>}
          </div>
          <CodeEditor
            filePath={activeFile}
            yText={yText}
            yDoc={yDoc}
            readOnly={!canEdit}
            onAwarenessChange={updateAwareness}
          />
        </main>

        <aside className="w-80 shrink-0 flex flex-col border-l border-surface-border">
          <div className="flex border-b border-surface-border">
            <button
              onClick={() => setSideTab("chat")}
              className={`flex-1 py-2 text-sm font-medium ${
                sideTab === "chat" ? "text-accent border-b-2 border-accent" : "text-gray-500"
              }`}
            >
              Team
            </button>
            <button
              onClick={() => setSideTab("ai")}
              className={`flex-1 py-2 text-sm font-medium ${
                sideTab === "ai" ? "text-accent border-b-2 border-accent" : "text-gray-500"
              }`}
            >
              AI
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {sideTab === "chat" ? (
              <ChatPanel
                messages={room.humanChat}
                onSend={sendChat}
                currentUserId={participant?.id}
              />
            ) : (
              <AIPanel
                messages={room.aiChat}
                onSend={handleAI}
                loading={aiLoading}
                error={aiError}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
