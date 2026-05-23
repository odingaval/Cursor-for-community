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
exports.ACTIVE_FILE_KEY = exports.FILES_MAP_KEY = void 0;
exports.createRoomDocument = createRoomDocument;
exports.getOrCreateFileText = getOrCreateFileText;
exports.readAllFiles = readAllFiles;
exports.encodeState = encodeState;
exports.applyUpdate = applyUpdate;
const Y = __importStar(require("yjs"));
exports.FILES_MAP_KEY = "files";
exports.ACTIVE_FILE_KEY = "activeFile";
function createRoomDocument(initialFiles, activePath) {
    const doc = new Y.Doc();
    const filesMap = doc.getMap(exports.FILES_MAP_KEY);
    const activeFile = doc.getText(exports.ACTIVE_FILE_KEY);
    for (const file of initialFiles) {
        const yText = new Y.Text(file.content);
        filesMap.set(file.path, yText);
    }
    activeFile.insert(0, activePath);
    return { doc, filesMap, activeFile };
}
function getOrCreateFileText(filesMap, path, initial = "") {
    let yText = filesMap.get(path);
    if (!yText) {
        yText = new Y.Text(initial);
        filesMap.set(path, yText);
    }
    return yText;
}
function readAllFiles(filesMap) {
    const result = {};
    filesMap.forEach((yText, path) => {
        result[path] = yText.toString();
    });
    return result;
}
function encodeState(doc) {
    return Y.encodeStateAsUpdate(doc);
}
function applyUpdate(doc, update) {
    Y.applyUpdate(doc, update);
}
