import * as Y from "yjs";

export const FILES_MAP_KEY = "files";
export const ACTIVE_FILE_KEY = "activeFile";

export interface InitialFile {
  path: string;
  language: string;
  content: string;
}

export function createRoomDocument(initialFiles: InitialFile[], activePath: string) {
  const doc = new Y.Doc();
  const filesMap = doc.getMap<Y.Text>(FILES_MAP_KEY);
  const activeFile = doc.getText(ACTIVE_FILE_KEY);

  for (const file of initialFiles) {
    const yText = new Y.Text(file.content);
    filesMap.set(file.path, yText);
  }
  activeFile.insert(0, activePath);

  return { doc, filesMap, activeFile };
}

export function getOrCreateFileText(
  filesMap: Y.Map<Y.Text>,
  path: string,
  initial = ""
): Y.Text {
  let yText = filesMap.get(path);
  if (!yText) {
    yText = new Y.Text(initial);
    filesMap.set(path, yText);
  }
  return yText;
}

export function readAllFiles(filesMap: Y.Map<Y.Text>): Record<string, string> {
  const result: Record<string, string> = {};
  filesMap.forEach((yText, path) => {
    result[path] = yText.toString();
  });
  return result;
}

export function encodeState(doc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(doc);
}

export function applyUpdate(doc: Y.Doc, update: Uint8Array): void {
  Y.applyUpdate(doc, update);
}
