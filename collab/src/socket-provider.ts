import * as Y from "yjs";
import { encodeState } from "./document";

export type UpdateListener = (update: Uint8Array, originId?: string) => void;

/**
 * Server-side Yjs document registry per room.
 * Handles CRDT merge so concurrent edits never overwrite each other incorrectly.
 */
export class CollabRegistry {
  private docs = new Map<string, Y.Doc>();
  private listeners = new Map<string, Set<UpdateListener>>();

  getOrCreate(roomId: string, initializer?: () => Y.Doc): Y.Doc {
    let doc = this.docs.get(roomId);
    if (!doc) {
      doc = initializer?.() ?? new Y.Doc();
      this.docs.set(roomId, doc);
      doc.on("update", (update: Uint8Array, origin: unknown) => {
        const originId = typeof origin === "string" ? origin : undefined;
        this.listeners.get(roomId)?.forEach((cb) => cb(update, originId));
      });
    }
    return doc;
  }

  get(roomId: string): Y.Doc | undefined {
    return this.docs.get(roomId);
  }

  subscribe(roomId: string, cb: UpdateListener): () => void {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    this.listeners.get(roomId)!.add(cb);
    return () => this.listeners.get(roomId)?.delete(cb);
  }

  getSyncState(roomId: string): Uint8Array | null {
    const doc = this.docs.get(roomId);
    if (!doc) return null;
    return encodeState(doc);
  }

  mergeUpdate(roomId: string, update: Uint8Array, origin?: string): void {
    const doc = this.getOrCreate(roomId);
    Y.applyUpdate(doc, update, origin);
  }
}

export function uint8ToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export function base64ToUint8(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}
