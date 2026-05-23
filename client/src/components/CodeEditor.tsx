"use client";

import { useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import type { AwarenessState } from "@/hooks/useRoom";

function languageFromPath(path: string): string {
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  return "plaintext";
}

interface CodeEditorProps {
  filePath: string;
  yText: Y.Text | null;
  yDoc: Y.Doc;
  readOnly?: boolean;
  onAwarenessChange?: (state: Partial<AwarenessState>) => void;
  remoteCursors?: AwarenessState[];
}

export function CodeEditor({
  filePath,
  yText,
  yDoc,
  readOnly,
  onAwarenessChange,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, []);

  useEffect(() => {
    bindingRef.current?.destroy();
    bindingRef.current = null;

    const ed = editorRef.current;
    if (!ed || !yText) return;

    const model = ed.getModel();
    if (!model) return;

    bindingRef.current = new MonacoBinding(yText, model, new Set([ed]));
  }, [filePath, yText, yDoc]);

  const handleMount: OnMount = (ed) => {
    editorRef.current = ed;

    ed.onDidChangeCursorPosition((e) => {
      onAwarenessChange?.({
        cursor: { line: e.position.lineNumber, column: e.position.column },
      });
    });

    ed.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      onAwarenessChange?.({
        selection: {
          startLine: sel.startLineNumber,
          startColumn: sel.startColumn,
          endLine: sel.endLineNumber,
          endColumn: sel.endColumn,
        },
      });
    });

    if (yText) {
      const model = ed.getModel();
      if (model) {
        bindingRef.current?.destroy();
        bindingRef.current = new MonacoBinding(yText, model, new Set([ed]));
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 relative">
      <Editor
        key={filePath}
        height="100%"
        path={filePath}
        defaultLanguage={languageFromPath(filePath)}
        language={languageFromPath(filePath)}
        theme="vs-dark"
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "var(--font-geist-mono), monospace",
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          wordWrap: "on",
        }}
        onMount={handleMount}
        loading={
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Loading editor…
          </div>
        }
      />
    </div>
  );
}
