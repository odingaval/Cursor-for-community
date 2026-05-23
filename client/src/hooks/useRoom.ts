"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { RoomData } from "@/lib/api";
import { FILES_MAP_KEY } from "@/lib/collab-constants";
import { base64ToUint8, uint8ToBase64 } from "@/lib/encoding";

export interface AwarenessState {
  socketId: string;
  participantId: string;
  userName: string;
  cursor?: { line: number; column: number };
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
  color?: string;
}

export function useRoom(roomId: string, userName: string, role: "member" | "mentor" = "member") {
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [participant, setParticipant] = useState<RoomData["participants"][0] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [awareness, setAwareness] = useState<Record<string, AwarenessState>>({});
  const yDocRef = useRef<Y.Doc | null>(null);
  const joinedRef = useRef(false);

  const getYDoc = useCallback(() => {
    if (!yDocRef.current) yDocRef.current = new Y.Doc();
    return yDocRef.current;
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", () => {
      setError("Cannot connect to server. Run npm run dev (port 4000).");
    });

    if (!joinedRef.current) {
      joinedRef.current = true;
      socket.emit(
        "room:join",
        { roomId, userName, role },
        (res: {
          ok: boolean;
          error?: string;
          room?: RoomData;
          participant?: RoomData["participants"][0];
          syncState?: string | null;
        }) => {
          if (!res) {
            setError("No response from server. Check that the API is running.");
            return;
          }
          if (!res.ok) {
            setError(
              res.error === "Room not found"
                ? `Room "${roomId}" does not exist. Create a new room on the home page and use the Room ID shown in the URL (e.g. 79f3474e).`
                : (res.error ?? "Failed to join room")
            );
            return;
          }
          setRoom(res.room!);
          setParticipant(res.participant!);

          const doc = getYDoc();
          if (res.syncState) {
            Y.applyUpdate(doc, base64ToUint8(res.syncState), "remote");
          }
        }
      );
    }

    socket.on("yjs:update", (payload: { update: string; origin: string }) => {
      if (payload.origin === socket.id) return;
      Y.applyUpdate(getYDoc(), base64ToUint8(payload.update), "remote");
    });

    socket.on("participants:update", (payload: { participants: RoomData["participants"] }) => {
      setRoom((r) => (r ? { ...r, participants: payload.participants } : r));
    });

    socket.on("chat:message", (msg: RoomData["humanChat"][0]) => {
      setRoom((r) => (r ? { ...r, humanChat: [...r.humanChat, msg] } : r));
    });

    socket.on("ai:message", (msg: RoomData["aiChat"][0]) => {
      setRoom((r) => (r ? { ...r, aiChat: [...r.aiChat, msg] } : r));
    });

    socket.on("file:active", (payload: { path: string }) => {
      setRoom((r) => (r ? { ...r, activeFile: payload.path } : r));
    });

    socket.on("files:changed", (payload: { files: RoomData["files"] }) => {
      setRoom((r) => (r ? { ...r, files: payload.files } : r));
    });

    socket.on("awareness:update", (state: AwarenessState) => {
      setAwareness((prev) => ({ ...prev, [state.socketId]: state }));
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      disconnectSocket();
      joinedRef.current = false;
    };
  }, [roomId, userName, role, getYDoc]);

  const broadcastYjsUpdate = useCallback((update: Uint8Array) => {
    getSocket().emit("yjs:sync", { update: uint8ToBase64(update) });
  }, []);

  useEffect(() => {
    const doc = getYDoc();
    const handler = (update: Uint8Array, origin: unknown) => {
      if (origin === "remote") return;
      broadcastYjsUpdate(update);
    };
    doc.on("update", handler);
    return () => doc.off("update", handler);
  }, [getYDoc, broadcastYjsUpdate]);

  const setActiveFile = useCallback((path: string) => {
    getSocket().emit("file:set-active", { path });
    setRoom((r) => (r ? { ...r, activeFile: path } : r));
  }, []);

  const sendChat = useCallback((content: string) => {
    getSocket().emit("chat:message", { content });
  }, []);

  const sendAI = useCallback(
    (
      message: string,
      opts?: { selectedCode?: string; errorLogs?: string; activeFile?: string }
    ) =>
      new Promise<{ ok: boolean; error?: string }>((resolve) => {
        getSocket().emit("ai:chat", { message, ...opts }, resolve);
      }),
    []
  );

  const createFile = useCallback((path: string, content?: string) => {
    return new Promise<boolean>((resolve) => {
      getSocket().emit("file:create", { path, content }, (res: { ok: boolean }) => {
        resolve(res?.ok ?? false);
      });
    });
  }, []);

  const deleteFile = useCallback((path: string) => {
    return new Promise<boolean>((resolve) => {
      getSocket().emit("file:delete", { path }, (res: { ok: boolean }) => {
        resolve(res?.ok ?? false);
      });
    });
  }, []);

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    return new Promise<boolean>((resolve) => {
      getSocket().emit("file:rename", { oldPath, newPath }, (res: { ok: boolean }) => {
        resolve(res?.ok ?? false);
      });
    });
  }, []);

  const updateAwareness = useCallback(
    (state: Partial<AwarenessState>) => {
      const socket = getSocket();
      getSocket().emit("awareness:update", {
        ...state,
        socketId: socket.id,
        participantId: participant?.id,
        userName: participant?.name,
        color: participant?.color,
      });
    },
    [participant]
  );

  const getFileYText = useCallback(
    (path: string): Y.Text | null => {
      const doc = getYDoc();
      const filesMap = doc.getMap<Y.Text>(FILES_MAP_KEY);
      return filesMap.get(path) ?? null;
    },
    [getYDoc]
  );

  const ensureFileYText = useCallback(
    (path: string, initial: string): Y.Text => {
      const doc = getYDoc();
      const filesMap = doc.getMap<Y.Text>(FILES_MAP_KEY);
      let yText = filesMap.get(path);
      if (!yText) {
        yText = new Y.Text(initial);
        filesMap.set(path, yText);
      }
      return yText;
    },
    [getYDoc]
  );

  return {
    connected,
    room,
    participant,
    error,
    awareness,
    yDoc: getYDoc(),
    setActiveFile,
    sendChat,
    sendAI,
    createFile,
    deleteFile,
    renameFile,
    updateAwareness,
    getFileYText,
    ensureFileYText,
  };
}
