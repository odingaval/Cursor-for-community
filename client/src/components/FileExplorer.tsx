"use client";

import { useState } from "react";
import clsx from "clsx";

interface FileExplorerProps {
  files: Array<{ path: string }>;
  activeFile: string;
  onSelect: (path: string) => void;
  onCreate: (path: string) => Promise<boolean>;
  onDelete: (path: string) => Promise<boolean>;
  onRename: (oldPath: string, newPath: string) => Promise<boolean>;
}

export function FileExplorer({
  files,
  activeFile,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: FileExplorerProps) {
  const [newPath, setNewPath] = useState("");
  const [showNew, setShowNew] = useState(false);

  const handleCreate = async () => {
    if (!newPath.trim()) return;
    const ok = await onCreate(newPath.trim());
    if (ok) {
      setNewPath("");
      setShowNew(false);
      onSelect(newPath.trim());
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-surface-border bg-surface">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Files</span>
        <button
          onClick={() => setShowNew(!showNew)}
          className="text-accent text-lg leading-none hover:opacity-80"
          title="New file"
        >
          +
        </button>
      </div>

      {showNew && (
        <div className="p-2 border-b border-surface-border flex gap-1">
          <input
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            placeholder="src/app.ts"
            className="flex-1 text-xs px-2 py-1 rounded bg-surface-raised border border-surface-border focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button onClick={handleCreate} className="text-xs text-accent px-2">
            Add
          </button>
        </div>
      )}

      <ul className="flex-1 overflow-y-auto py-1 text-sm">
        {files.map((f) => (
          <li key={f.path} className="group flex items-center">
            <button
              onClick={() => onSelect(f.path)}
              className={clsx(
                "flex-1 text-left px-3 py-1.5 truncate font-mono text-xs",
                activeFile === f.path
                  ? "bg-accent/10 text-accent border-r-2 border-accent"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              )}
            >
              {f.path.split("/").pop()}
            </button>
            <button
              onClick={async () => {
                const name = prompt("Rename to:", f.path);
                if (name && name !== f.path) await onRename(f.path, name);
              }}
              className="opacity-0 group-hover:opacity-100 px-1 text-gray-500 hover:text-gray-300 text-xs"
              title="Rename"
            >
              ✎
            </button>
            <button
              onClick={async () => {
                if (confirm(`Delete ${f.path}?`)) await onDelete(f.path);
              }}
              className="opacity-0 group-hover:opacity-100 px-2 text-red-400/70 hover:text-red-400 text-xs"
              title="Delete"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
