"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const crypto_1 = require("crypto");
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
function defaultFiles() {
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
function languageFromPath(path) {
    if (path.endsWith(".ts") || path.endsWith(".tsx"))
        return "typescript";
    if (path.endsWith(".js") || path.endsWith(".jsx"))
        return "javascript";
    if (path.endsWith(".py"))
        return "python";
    if (path.endsWith(".md"))
        return "markdown";
    if (path.endsWith(".json"))
        return "json";
    if (path.endsWith(".css"))
        return "css";
    if (path.endsWith(".html"))
        return "html";
    return "plaintext";
}
class RoomManager {
    rooms = new Map();
    colorIndex = 0;
    createRoom(input = {}) {
        const id = (0, crypto_1.randomUUID)().slice(0, 8);
        const room = {
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
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    listRooms() {
        return Array.from(this.rooms.values()).map((r) => ({
            id: r.id,
            name: r.name,
            participantCount: r.participants.size,
            createdAt: r.createdAt,
        }));
    }
    joinRoom(input) {
        const room = this.rooms.get(input.roomId);
        if (!room)
            return null;
        const role = input.role ?? "member";
        const participant = {
            id: (0, crypto_1.randomUUID)(),
            name: input.userName,
            color: CURSOR_COLORS[this.colorIndex++ % CURSOR_COLORS.length],
            role,
            canEdit: role === "mentor" ? true : true,
            joinedAt: Date.now(),
        };
        room.participants.set(participant.id, participant);
        return { room, participant };
    }
    leaveRoom(roomId, participantId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.participants.delete(participantId);
        if (room.participants.size === 0) {
            // Keep room alive for rejoin; MVP does not garbage-collect
        }
    }
    setActiveFile(roomId, path) {
        const room = this.rooms.get(roomId);
        if (!room || !room.files.has(path))
            return false;
        room.activeFile = path;
        return true;
    }
    createFile(roomId, path, content = "") {
        const room = this.rooms.get(roomId);
        if (!room || room.files.has(path))
            return null;
        const file = {
            path,
            language: languageFromPath(path),
            content,
        };
        room.files.set(path, file);
        return file;
    }
    deleteFile(roomId, path) {
        const room = this.rooms.get(roomId);
        if (!room || !room.files.has(path))
            return false;
        room.files.delete(path);
        if (room.activeFile === path) {
            const first = room.files.keys().next().value;
            room.activeFile = first ?? "";
        }
        return true;
    }
    renameFile(roomId, oldPath, newPath) {
        const room = this.rooms.get(roomId);
        if (!room || !room.files.has(oldPath) || room.files.has(newPath))
            return null;
        const existing = room.files.get(oldPath);
        room.files.delete(oldPath);
        const file = {
            ...existing,
            path: newPath,
            language: languageFromPath(newPath),
        };
        room.files.set(newPath, file);
        if (room.activeFile === oldPath)
            room.activeFile = newPath;
        return file;
    }
    updateFileContent(roomId, path, content) {
        const room = this.rooms.get(roomId);
        const file = room?.files.get(path);
        if (!file)
            return false;
        file.content = content;
        return true;
    }
    serializeRoom(room) {
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
exports.RoomManager = RoomManager;
