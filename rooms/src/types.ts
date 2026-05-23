export type UserRole = "member" | "mentor";

export interface Participant {
  id: string;
  name: string;
  color: string;
  role: UserRole;
  canEdit: boolean;
  joinedAt: number;
}

export interface ProjectFile {
  path: string;
  language: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  createdAt: number;
  participants: Map<string, Participant>;
  files: Map<string, ProjectFile>;
  activeFile: string;
  humanChat: ChatMessage[];
  aiChat: AIMessage[];
}

export interface RoomSummary {
  id: string;
  name: string;
  participantCount: number;
  createdAt: number;
}

export interface CreateRoomInput {
  name?: string;
  creatorName?: string;
}

export interface JoinRoomInput {
  roomId: string;
  userName: string;
  role?: UserRole;
}

export interface SerializedRoom {
  id: string;
  name: string;
  createdAt: number;
  activeFile: string;
  participants: Participant[];
  files: ProjectFile[];
  humanChat: ChatMessage[];
  aiChat: AIMessage[];
}
