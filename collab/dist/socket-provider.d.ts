import * as Y from "yjs";
export type SyncHandler = (roomId: string, update: Uint8Array, originSocketId?: string) => void;
/**
 * Server-side Yjs document registry per room.
 * Handles CRDT merge so concurrent edits never overwrite each other incorrectly.
 */
export declare class CollabRegistry {
    private docs;
    private listeners;
    getOrCreate(roomId: string, initializer?: () => Y.Doc): Y.Doc;
    get(roomId: string): Y.Doc | undefined;
    subscribe(roomId: string, cb: (update: Uint8Array, origin?: string) => void): () => void;
    getSyncState(roomId: string): Uint8Array | null;
    mergeUpdate(roomId: string, update: Uint8Array, origin?: string): void;
}
export declare function uint8ToBase64(bytes: Uint8Array): string;
export declare function base64ToUint8(b64: string): Uint8Array;
