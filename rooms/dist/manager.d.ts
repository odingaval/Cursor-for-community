import type { CreateRoomInput, JoinRoomInput, Participant, ProjectFile, Room, RoomSummary } from "./types";
export declare class RoomManager {
    private rooms;
    private colorIndex;
    createRoom(input?: CreateRoomInput): Room;
    getRoom(roomId: string): Room | undefined;
    listRooms(): RoomSummary[];
    joinRoom(input: JoinRoomInput): {
        room: Room;
        participant: Participant;
    } | null;
    leaveRoom(roomId: string, participantId: string): void;
    setActiveFile(roomId: string, path: string): boolean;
    createFile(roomId: string, path: string, content?: string): ProjectFile | null;
    deleteFile(roomId: string, path: string): boolean;
    renameFile(roomId: string, oldPath: string, newPath: string): ProjectFile | null;
    updateFileContent(roomId: string, path: string, content: string): boolean;
    serializeRoom(room: Room): {
        id: string;
        name: string;
        createdAt: number;
        activeFile: string;
        participants: Participant[];
        files: ProjectFile[];
        humanChat: import("./types").ChatMessage[];
        aiChat: import("./types").AIMessage[];
    };
}
