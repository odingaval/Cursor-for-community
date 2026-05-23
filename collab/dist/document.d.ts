import * as Y from "yjs";
import type { ProjectFile } from "@cfc/rooms";
export declare const FILES_MAP_KEY = "files";
export declare const ACTIVE_FILE_KEY = "activeFile";
export interface RoomDocument {
    doc: Y.Doc;
    filesMap: Y.Map<Y.Text>;
    activeFile: Y.Text;
}
export declare function createRoomDocument(initialFiles: ProjectFile[], activePath: string): RoomDocument;
export declare function getOrCreateFileText(filesMap: Y.Map<Y.Text>, path: string, initial?: string): Y.Text;
export declare function readAllFiles(filesMap: Y.Map<Y.Text>): Record<string, string>;
export declare function encodeState(doc: Y.Doc): Uint8Array;
export declare function applyUpdate(doc: Y.Doc, update: Uint8Array): void;
