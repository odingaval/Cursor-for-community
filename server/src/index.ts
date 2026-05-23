import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { randomUUID } from "crypto";
import { RoomManager } from "@cfc/rooms";
import * as Y from "yjs";
import {
  CollabRegistry,
  createRoomDocument,
  FILES_MAP_KEY,
  getOrCreateFileText,
  readAllFiles,
  uint8ToBase64,
  base64ToUint8,
} from "@cfc/collab";
import { createAIServiceFromEnv, getAIConfigSummary } from "@cfc/ai";

function getFilesMap(doc: Y.Doc): Y.Map<Y.Text> {
  return doc.getMap(FILES_MAP_KEY);
}

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const app = express();
app.use(cors({ origin: [CLIENT_URL, "http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "2mb" }));

const roomManager = new RoomManager();
const collabRegistry = new CollabRegistry();
const aiService = createAIServiceFromEnv();

// ─── REST API ───────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.redirect(CLIENT_URL);
});

app.get("/health", (_req, res) => {
  const ai = getAIConfigSummary();
  res.json({ ok: true, ai: ai.configured, aiProvider: ai.provider ?? null });
});

app.post("/api/rooms", (req, res) => {
  const { name } = req.body ?? {};
  const room = roomManager.createRoom({ name });
  initCollabDoc(room.id, roomManager.serializeRoom(room).files);
  res.status(201).json({
    room: roomManager.serializeRoom(room),
    joinUrl: `/room/${room.id}`,
  });
});

app.get("/api/rooms", (_req, res) => {
  res.json({ rooms: roomManager.listRooms() });
});

app.get("/api/rooms/:id", (req, res) => {
  const room = roomManager.getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({ room: roomManager.serializeRoom(room) });
});

function initCollabDoc(
  roomId: string,
  files: Array<{ path: string; content: string }>
) {
  collabRegistry.getOrCreate(roomId, () => {
    const { doc } = createRoomDocument(
      files.map((f) => ({ path: f.path, language: "", content: f.content })),
      files[0]?.path ?? "src/index.ts"
    );
    return doc;
  });
}

function syncRoomFilesFromYjs(roomId: string) {
  const room = roomManager.getRoom(roomId);
  const doc = collabRegistry.get(roomId);
  if (!room || !doc) return;

  const filesMap = getFilesMap(doc);
  const all = readAllFiles(filesMap);

  for (const [filePath, content] of Object.entries(all)) {
    if (room.files.has(filePath)) {
      room.files.get(filePath)!.content = content;
    } else {
      roomManager.createFile(roomId, filePath, content);
    }
  }
}

// ─── WebSocket / Socket.io ──────────────────────────────────────────────────

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: [CLIENT_URL, "http://localhost:3000"], methods: ["GET", "POST"] },
  maxHttpBufferSize: 5e6,
});

interface SocketMeta {
  roomId: string;
  participantId: string;
  userName: string;
}

const socketMeta = new Map<string, SocketMeta>();

io.on("connection", (socket) => {
  socket.on("room:join", (payload, ack) => {
    const { roomId, userName, role } = payload ?? {};
    if (!roomId || !userName) {
      ack?.({ ok: false, error: "roomId and userName required" });
      return;
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      ack?.({ ok: false, error: "Room not found" });
      return;
    }

    const joinResult = roomManager.joinRoom({ roomId, userName, role });
    if (!joinResult) {
      ack?.({ ok: false, error: "Could not join room" });
      return;
    }

    const { participant } = joinResult;
    socketMeta.set(socket.id, {
      roomId,
      participantId: participant.id,
      userName: participant.name,
    });
    socket.join(roomId);

    if (!collabRegistry.get(roomId)) {
      initCollabDoc(roomId, roomManager.serializeRoom(room).files);
    }

    const syncState = collabRegistry.getSyncState(roomId);
    const serialized = roomManager.serializeRoom(roomManager.getRoom(roomId)!);

    ack?.({
      ok: true,
      participant,
      room: serialized,
      syncState: syncState ? uint8ToBase64(syncState) : null,
    });

    socket.to(roomId).emit("participants:update", {
      participants: serialized.participants,
    });
  });

  socket.on("yjs:sync", (payload) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const { update } = payload ?? {};
    if (!update) return;

    const bytes = base64ToUint8(update);
    collabRegistry.mergeUpdate(meta.roomId, bytes, socket.id);
    syncRoomFilesFromYjs(meta.roomId);

    socket.to(meta.roomId).emit("yjs:update", {
      update,
      origin: socket.id,
    });
  });

  socket.on("yjs:request-sync", (_payload, ack) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const state = collabRegistry.getSyncState(meta.roomId);
    ack?.({ syncState: state ? uint8ToBase64(state) : null });
  });

  socket.on("awareness:update", (payload) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    socket.to(meta.roomId).emit("awareness:update", {
      ...payload,
      socketId: socket.id,
      participantId: meta.participantId,
      userName: meta.userName,
    });
  });

  socket.on("file:set-active", (payload) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const { path: filePath } = payload ?? {};
    if (!filePath) return;

    roomManager.setActiveFile(meta.roomId, filePath);
    const doc = collabRegistry.get(meta.roomId);
    if (doc) {
      const activeText = doc.getText("activeFile");
      doc.transact(() => {
        activeText.delete(0, activeText.length);
        activeText.insert(0, filePath);
      });
    }
    io.to(meta.roomId).emit("file:active", { path: filePath });
  });

  socket.on("file:create", (payload, ack) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const { path: filePath, content } = payload ?? {};
    const file = roomManager.createFile(meta.roomId, filePath, content ?? "");
    if (!file) {
      ack?.({ ok: false, error: "File exists or invalid path" });
      return;
    }
    const doc = collabRegistry.get(meta.roomId);
    if (doc) {
      getOrCreateFileText(getFilesMap(doc), filePath, content ?? "");
    }
    io.to(meta.roomId).emit("files:changed", {
      files: roomManager.serializeRoom(roomManager.getRoom(meta.roomId)!).files,
    });
    ack?.({ ok: true, file });
  });

  socket.on("file:delete", (payload, ack) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const { path: filePath } = payload ?? {};
    const ok = roomManager.deleteFile(meta.roomId, filePath);
    if (!ok) {
      ack?.({ ok: false });
      return;
    }
    const doc = collabRegistry.get(meta.roomId);
    if (doc) {
      getFilesMap(doc).delete(filePath);
    }
    io.to(meta.roomId).emit("files:changed", {
      files: roomManager.serializeRoom(roomManager.getRoom(meta.roomId)!).files,
    });
    ack?.({ ok: true });
  });

  socket.on("file:rename", (payload, ack) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const { oldPath, newPath } = payload ?? {};
    const file = roomManager.renameFile(meta.roomId, oldPath, newPath);
    if (!file) {
      ack?.({ ok: false });
      return;
    }
    const doc = collabRegistry.get(meta.roomId);
    if (doc) {
      const filesMap = getFilesMap(doc);
      const yText = filesMap.get(oldPath);
      if (yText) {
        filesMap.set(newPath, yText);
        filesMap.delete(oldPath);
      }
    }
    io.to(meta.roomId).emit("files:changed", {
      files: roomManager.serializeRoom(roomManager.getRoom(meta.roomId)!).files,
    });
    ack?.({ ok: true, file });
  });

  socket.on("chat:message", (payload) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const room = roomManager.getRoom(meta.roomId);
    if (!room) return;

    const msg = {
      id: randomUUID(),
      roomId: meta.roomId,
      userId: meta.participantId,
      userName: meta.userName,
      content: String(payload?.content ?? "").slice(0, 4000),
      timestamp: Date.now(),
    };
    room.humanChat.push(msg);
    if (room.humanChat.length > 200) room.humanChat.shift();
    io.to(meta.roomId).emit("chat:message", msg);
  });

  socket.on("ai:chat", async (payload, ack) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }

    const room = roomManager.getRoom(meta.roomId);
    if (!room) {
      ack?.({ ok: false, error: "Room not found" });
      return;
    }

    if (!aiService) {
      ack?.({
        ok: false,
        error:
          "AI not configured. Set CURSOR_API_KEY (crsr_…) or OPENAI_API_KEY in project root .env, then restart the server.",
      });
      return;
    }

    syncRoomFilesFromYjs(meta.roomId);
    const serialized = roomManager.serializeRoom(room);
    const activePath = payload?.activeFile ?? serialized.activeFile;
    const activeFile = serialized.files.find((f) => f.path === activePath);

    const userMsg = {
      id: randomUUID(),
      role: "user" as const,
      content: String(payload?.message ?? ""),
      timestamp: Date.now(),
    };
    room.aiChat.push(userMsg);
    io.to(meta.roomId).emit("ai:message", userMsg);

    try {
      const response = await aiService.chat({
        roomName: room.name,
        activeFilePath: activePath,
        activeFileContent: activeFile?.content ?? "",
        selectedCode: payload?.selectedCode,
        allFiles: Object.fromEntries(serialized.files.map((f) => [f.path, f.content])),
        humanChatHistory: serialized.humanChat.map((m) => ({
          userName: m.userName,
          content: m.content,
        })),
        aiChatHistory: room.aiChat.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        errorLogs: payload?.errorLogs,
        userRequest: userMsg.content,
      });

      const assistantMsg = {
        id: randomUUID(),
        role: "assistant" as const,
        content: response.content,
        timestamp: Date.now(),
      };
      room.aiChat.push(assistantMsg);
      io.to(meta.roomId).emit("ai:message", assistantMsg);
      ack?.({ ok: true, message: assistantMsg });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed";
      ack?.({ ok: false, error: message });
    }
  });

  socket.on("disconnect", () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    roomManager.leaveRoom(meta.roomId, meta.participantId);
    socketMeta.delete(socket.id);
    const room = roomManager.getRoom(meta.roomId);
    if (room) {
      io.to(meta.roomId).emit("participants:update", {
        participants: roomManager.serializeRoom(room).participants,
      });
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Cursor for Communities API on http://localhost:${PORT}`);
  const aiInfo = getAIConfigSummary();
  console.log(
    aiInfo.configured
      ? `AI assistant: enabled (${aiInfo.provider})`
      : "AI assistant: disabled — set CURSOR_API_KEY or OPENAI_API_KEY in .env"
  );
});
