"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollabRegistry = void 0;
exports.uint8ToBase64 = uint8ToBase64;
exports.base64ToUint8 = base64ToUint8;
const Y = __importStar(require("yjs"));
const document_1 = require("./document");
/**
 * Server-side Yjs document registry per room.
 * Handles CRDT merge so concurrent edits never overwrite each other incorrectly.
 */
class CollabRegistry {
    docs = new Map();
    listeners = new Map();
    getOrCreate(roomId, initializer) {
        let doc = this.docs.get(roomId);
        if (!doc) {
            doc = initializer?.() ?? new Y.Doc();
            this.docs.set(roomId, doc);
            doc.on("update", (update, origin) => {
                const originId = typeof origin === "string" ? origin : undefined;
                this.listeners.get(roomId)?.forEach((cb) => cb(update, originId));
            });
        }
        return doc;
    }
    get(roomId) {
        return this.docs.get(roomId);
    }
    subscribe(roomId, cb) {
        if (!this.listeners.has(roomId)) {
            this.listeners.set(roomId, new Set());
        }
        this.listeners.get(roomId).add(cb);
        return () => this.listeners.get(roomId)?.delete(cb);
    }
    getSyncState(roomId) {
        const doc = this.docs.get(roomId);
        if (!doc)
            return null;
        return (0, document_1.encodeState)(doc);
    }
    mergeUpdate(roomId, update, origin) {
        const doc = this.getOrCreate(roomId);
        Y.applyUpdate(doc, update, origin);
    }
}
exports.CollabRegistry = CollabRegistry;
function uint8ToBase64(bytes) {
    return Buffer.from(bytes).toString("base64");
}
function base64ToUint8(b64) {
    return new Uint8Array(Buffer.from(b64, "base64"));
}
