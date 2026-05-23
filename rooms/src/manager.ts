import { randomUUID } from "crypto";
import type {
  CreateRoomInput,
  JoinRoomInput,
  Participant,
  ProjectFile,
  Room,
  RoomSummary,
  SerializedRoom,
  UserRole,
} from "./types";

const CURSOR_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
];

function defaultFiles(): ProjectFile[] {
  return [
    {
      path: "src/index.ts",
      language: "typescript",
      content: `// Welcome to Cursor for Communities!\n// Start coding together.\n\nexport function greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("team"));\n`,
    },
    {
      path: "README.md",
      language: "markdown",
      content: `# Team Project\n\nCollaborate in real time with your team and AI assistant.\n`,
    },
  ];
}

function languageFromPath(path: string): string {
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  return "plaintext";
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  private colorIndex = 0;

  createRoom(input: CreateRoomInput = {}): Room {
    const id = randomUUID().slice(0, 8);
    const room: Room = {
      id,
      name: input.name ?? `Room ${id}`,
      createdAt: Date.now(),
      participants: new Map(),
      files: new Map(),
      activeFile: "src/index.ts",
      humanChat: [],
      aiChat: [],
    };

    for (const file of defaultFiles()) {
      room.files.set(file.path, file);
    }

    this.rooms.set(id, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  listRooms(): RoomSummary[] {
    return Array.from(this.rooms.values()).map((r) => ({
      id: r.id,
      name: r.name,
      participantCount: r.participants.size,
      createdAt: r.createdAt,
    }));
  }

  joinRoom(input: JoinRoomInput): { room: Room; participant: Participant } | null {
    const room = this.rooms.get(input.roomId);
    if (!room) return null;

    const role: UserRole = input.role ?? "member";
    const participant: Participant = {
      id: randomUUID(),
      name: input.userName,
      color: CURSOR_COLORS[this.colorIndex++ % CURSOR_COLORS.length],
      role,
      canEdit: true,
      joinedAt: Date.now(),
    };

    room.participants.set(participant.id, participant);
    return { room, participant };
  }

  leaveRoom(roomId: string, participantId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.participants.delete(participantId);
  }

  setActiveFile(roomId: string, path: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.files.has(path)) return false;
    room.activeFile = path;
    return true;
  }

  createFile(roomId: string, path: string, content = ""): ProjectFile | null {
    const room = this.rooms.get(roomId);
    if (!room || room.files.has(path)) return null;

    const file: ProjectFile = {
      path,
      language: languageFromPath(path),
      content,
    };
    room.files.set(path, file);
    return file;
  }

  deleteFile(roomId: string, path: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.files.has(path)) return false;

    room.files.delete(path);
    if (room.activeFile === path) {
      const first = room.files.keys().next().value;
      room.activeFile = first ?? "";
    }
    return true;
  }

  renameFile(roomId: string, oldPath: string, newPath: string): ProjectFile | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.files.has(oldPath) || room.files.has(newPath)) return null;

    const existing = room.files.get(oldPath)!;
    room.files.delete(oldPath);
    const file: ProjectFile = {
      ...existing,
      path: newPath,
      language: languageFromPath(newPath),
    };
    room.files.set(newPath, file);
    if (room.activeFile === oldPath) room.activeFile = newPath;
    return file;
  }

  updateFileContent(roomId: string, path: string, content: string): boolean {
    const room = this.rooms.get(roomId);
    const file = room?.files.get(path);
    if (!file) return false;
    file.content = content;
    return true;
  }

  serializeRoom(room: Room): SerializedRoom {
    return {
      id: room.id,
      name: room.name,
      createdAt: room.createdAt,
      activeFile: room.activeFile,
      participants: Array.from(room.participants.values()),
      files: Array.from(room.files.values()),
      humanChat: room.humanChat,
      aiChat: room.aiChat,
    };
  }
}
