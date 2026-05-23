# Cursor for Communities

A collaborative, AI-powered coding workspace for hackathons, bootcamps, and developer communities.

**Google Docs + VS Code + AI pair programmer** — multiple users code together in real time with context-aware AI assistance and mentor supervision.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  client/          Next.js 15 + React 19 + Monaco + Tailwind     │
│  - Landing, room workspace, file explorer, team + AI chat       │
│  - Yjs client doc + y-monaco bindings                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST /api/* (proxied) + Socket.io
┌───────────────────────────▼─────────────────────────────────────┐
│  server/          Express + Socket.io (port 4000)                 │
│  - Room REST API, WebSocket events, AI orchestration            │
└───────┬─────────────────┬─────────────────┬─────────────────────┘
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│  rooms/      │  │  collab/     │  │  ai/         │
│  Room state  │  │  Yjs CRDT    │  │  OpenAI +    │
│  participants│  │  registry    │  │  Cursor SDK  │
│  files, chat │  │  merge/sync  │  │  prompts     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Modules

| Package | Role |
|---------|------|
| `@cfc/rooms` | In-memory room manager: files, participants, human/AI chat |
| `@cfc/collab` | Yjs document per room; CRDT prevents lost concurrent edits |
| `@cfc/ai` | Context-aware prompts; OpenAI-compatible or Cursor Agent API |
| `@cfc/server` | HTTP + WebSocket gateway wiring all packages |
| `@cfc/client` | Browser IDE UI |

### Real-time sync

- Each file is a `Y.Text` in a shared `Y.Doc` per room
- Edits merge via Yjs CRDT (not last-write-wins)
- `y-monaco` binds Monaco to `Y.Text` for live multi-cursor editing
- Socket.io broadcasts encoded Yjs updates with origin filtering

### AI behavior

The AI **never responds without code context**. Prompts include:

- Active file + selection
- Up to 8 other project files (truncated)
- Recent team chat
- Optional error logs

## Quick start

### Prerequisites

- Node.js 20+
- An API key: `OPENAI_API_KEY` or `CURSOR_API_KEY`

### Setup

```bash
cd "cursor for community"
cp .env.example .env
# Edit .env and add your API key

npm install
npm run build
npm run dev
```

- **App:** http://localhost:3000
- **API:** http://localhost:4000

### Usage

1. Open http://localhost:3000
2. Enter your name → **Create new room**
3. Share the room URL with teammates (2–10 users)
4. Use **Team** tab for human chat, **AI** tab for coding help
5. Mentors: join with **Join as mentor** (same room ID)

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4000`) |
| `CLIENT_URL` | CORS origin (default `http://localhost:3000`) |
| `OPENAI_API_KEY` | OpenAI or compatible API key |
| `OPENAI_BASE_URL` | Optional custom base URL |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `CURSOR_API_KEY` | Cursor API key (`crsr_…`) |
| `CURSOR_MODEL` | Default `composer-2.5-fast` |
| `AI_PROVIDER` | `auto`, `openai`, or `cursor` |

## Scripts

```bash
npm run dev          # API + frontend concurrently
npm run dev:server   # API only
npm run dev:client   # Frontend only
npm run build        # Build all workspaces
```

## MVP features

- [x] Real-time collaborative Monaco editor (Yjs + y-monaco)
- [x] Project rooms with unique IDs
- [x] File explorer (create / delete / rename)
- [x] Separate team chat and AI assistant panels
- [x] Context-aware AI (file, selection, project, chat, errors)
- [x] Mentor join mode
- [x] Live participant list and cursor awareness
- [x] Multiple simultaneous rooms

## License

MIT
