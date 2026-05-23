"use client";

interface Participant {
  id: string;
  name: string;
  color: string;
  role: string;
}

export function ParticipantList({ participants }: { participants: Participant[] }) {
  return (
    <div className="px-3 py-2 border-b border-surface-border">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        In session ({participants.length})
      </p>
      <ul className="space-y-1.5">
        {participants.map((p) => (
          <li key={p.id} className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="truncate">{p.name}</span>
            {p.role === "mentor" && (
              <span className="ml-auto text-[10px] uppercase tracking-wide text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded">
                Mentor
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
