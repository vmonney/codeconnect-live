# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Backend (FastAPI)

**Location**: `/backend` directory
**Tech Stack**: FastAPI + SQLite + SQLAlchemy + JWT + WebSockets
**Server**: http://localhost:8000
**API Docs**: http://localhost:8000/api/docs

### Backend Commands

```bash
cd backend

# Sync dependencies from lockfile
uv sync

# Add a new package
uv add <PACKAGE-NAME>

# Run development server (with auto-reload)
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Run seed data script (populate demo users & templates)
uv run python scripts/seed_data.py
```

### Demo Users
- **Interviewer**: interviewer@demo.com / demo123
- **Candidate**: candidate@demo.com / demo123

### Backend Architecture

**Database Models** (`backend/app/models/`):
- `User` - Authentication with bcrypt hashing
- `Interview` - Interview sessions with code tracking
- `CodeTemplate` - Problem templates with multi-language starter code
- `ChatMessage` - Persistent chat history
- `Invitation` - Interview invitations

**API Routers** (`backend/app/routers/`):
- `auth.py` - Signup, login, JWT authentication
- `interviews.py` - Interview CRUD + stats + messages + participants
- `templates.py` - Template CRUD with filtering
- `invitations.py` - Invitation management
- `users.py` - User profile updates
- `code_execution.py` - Mock code execution (6 languages)
- `websocket.py` - Real-time WebSocket endpoint

**WebSocket Events**:
- `code_update` - Sync code changes
- `cursor_update` - Real-time cursor positions
- `chat_message` - Persistent chat
- `typing` - Typing indicators
- `language_change` - Switch languages
- `interview_status` - Status updates
- `participant_joined/left` - Participant tracking

## Project Overview

CodeView is a professional coding interview platform with a React frontend and FastAPI backend. It enables real-time collaborative technical interviews with live code editing, execution, and communication between interviewers and candidates.

**Current State**: Full-stack application with FastAPI backend and React frontend. Backend provides REST APIs, WebSocket support, and mock code execution.

## Development Commands

```bash
# Start development server on port 8080
npm run dev

# Production build
npm run build

# Development build (with dev mode flags)
npm run build:dev

# Lint codebase
npm run lint

# Preview production build
npm run preview
```

## Core Architecture

### State Management (Zustand Stores in `src/stores/`)

**`authStore.ts`**: User authentication with localStorage persistence
- Mock user database for development
- Handles login, signup, and session management
- Role-based routing (interviewer vs candidate)

**`interviewStore.ts`**: Interview session lifecycle and real-time collaboration
- Interview creation, scheduling, and status management
- Live code synchronization across participants
- Participant tracking with cursor positions and colors
- Chat messaging system with typing indicators
- Code execution orchestration
- Share link generation for candidate invites

**`templateStore.ts`**: Code templates and interview problem sets
- Pre-built coding problems with starter code
- Template management for reusable interview questions

### Mock Services (`src/api/codeService.ts`)

The `apiService` object provides placeholders for all backend operations:
- Authentication endpoints (`login`, `signup`)
- Interview CRUD operations
- Code execution via `mockCodeExecution(code, language)`
- WebSocket simulation for future real-time features

**Mock Code Execution**: Simulates running code in 6 languages (JavaScript, Python, Java, C++, Go, Ruby)
- Network delay simulation (500-1500ms)
- Syntax error detection (mismatched braces, typos like `cosole.log`)
- Output pattern matching for console/print statements
- Language-specific starter code templates

When implementing real backend: Replace mock functions in `apiService` with actual HTTP/WebSocket calls.

### Component Organization

**`components/interview/`**: Core interview session UI
- `CodeEditor.tsx`: Monaco editor with multi-user cursor tracking (uses cursor colors from `interviewStore`)
- `OutputConsole.tsx`: Code execution results display
- `ChatPanel.tsx`: Real-time messaging between participants
- `ProblemPanel.tsx`: Interview problem/requirements display
- `VideoPanel.tsx`: Placeholder for video call integration
- `InterviewControls.tsx`: Start/end session, run code

**`components/dashboard/`**: Role-specific dashboards
- `InterviewerDashboard.tsx`: Create interviews, manage templates, view analytics
- `CandidateDashboard.tsx`: View invitations, access interview history

**`components/ui/`**: 30+ shadcn-ui components (buttons, dialogs, forms, etc.)
- Generated via shadcn CLI, customizable via `components.json`
- Styled with Tailwind CSS utility classes

**`pages/`**: Route-level components
- `InterviewRoom.tsx`: Main interview workspace (combines CodeEditor, Chat, Console, etc.)
- `Lobby.tsx`: Pre-interview waiting room
- `Dashboard.tsx`: Routes to role-specific dashboard
- `Auth.tsx`: Login/signup with role selection

### Path Aliases

TypeScript and Vite are configured with `@/*` pointing to `src/*`:
```typescript
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
```

### Routing (React Router v6)

Main routes defined in `src/App.tsx`:
- `/` - Landing page
- `/auth` - Login/signup
- `/dashboard` - Role-based dashboard (requires auth)
- `/interview/:id` - Live interview room (requires auth)
- `/lobby/:id` - Pre-interview lobby
- `/templates` - Browse interview templates
- `/profile` - User profile management

### Interview Session Flow

1. **Create**: Interviewer creates interview via `createInterview()` in `interviewStore`
2. **Share**: System generates share link (`/interview/{uuid}`)
3. **Join**: Candidate clicks link, joins via `joinInterview()` with participant object
4. **Collaborate**:
   - Code changes sync via `updateCode(interviewId, code)`
   - Cursor positions tracked via `updateCursorPosition()`
   - Chat messages via `sendMessage()`
   - Code execution via `executeCode(code, language)`
5. **Complete**: Interview status updated to 'completed'

### Supported Languages

6 languages with Monaco editor syntax highlighting and mock execution:
- `javascript`, `python`, `java`, `cpp`, `go`, `ruby`

Each has starter code template in `interviewStore.ts:getStarterCode()`.

## Styling & Theming

- **Tailwind CSS**: Utility-first styling with custom theme in `tailwind.config.ts`
- **CSS Variables**: HSL color system in `src/index.css` for dynamic theming
- **Dark Mode**: Implemented via `next-themes` with class-based theme switching
- **Component Styling**: shadcn-ui components use `class-variance-authority` for variant management

## TypeScript Types (`src/types/index.ts`)

Key interfaces:
- `User`: Authentication and profile data
- `Interview`: Session metadata, status, code, participants
- `Participant`: Real-time user info with cursor position/color
- `CodeTemplate`: Problem definitions with starter code
- `ChatMessage`: Message objects for chat panel
- `ProgrammingLanguage`: Union type of 6 supported languages
- `CodeExecution`: Result object from code execution (output, error, executionTime)

## Frontend-Backend Integration

The backend is now implemented! To connect the frontend:

1. **Update `frontend/src/api/codeService.ts`** - Replace mock functions with HTTP calls:
   ```typescript
   const API_BASE = 'http://localhost:8000/api';

   export const apiService = {
     login: async (email, password) => {
       const res = await fetch(`${API_BASE}/auth/login`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, password })
       });
       return res.json();
     },
     // ... implement other endpoints
   };
   ```

2. **Update Zustand Stores** - Call real APIs instead of mocking local state:
   - `authStore.ts` - Call `/api/auth/*` endpoints, store JWT in localStorage
   - `interviewStore.ts` - Call `/api/interviews/*` endpoints
   - `templateStore.ts` - Call `/api/templates/*` endpoints

3. **WebSocket Integration**:
   ```typescript
   const token = localStorage.getItem('auth_token');
   const ws = new WebSocket(`ws://localhost:8000/api/interviews/${id}/ws?token=${token}`);

   ws.onmessage = (event) => {
     const data = JSON.parse(event.data);
     // Handle: code_update, cursor_update, chat_message, etc.
   };

   ws.send(JSON.stringify({ type: 'code_update', code: newCode }));
   ```

## Key Development Notes

- **Monaco Editor**: Loaded via CDN, configured in `CodeEditor.tsx` with language-specific settings
- **Lovable Integration**: Component tagger plugin enabled in dev mode (`vite.config.ts`)
- **Resizable Panels**: Interview room uses `react-resizable-panels` for adjustable layout
- **Form Validation**: `react-hook-form` + `zod` for type-safe form handling
- **Toast Notifications**: `sonner` library for user feedback
- **UUID Generation**: Used for all entity IDs (interviews, messages, invitations)

## Testing Interview Features Locally

Since backend is mocked, you can test full interview flow in single browser:

1. Start dev server: `npm run dev`
2. Open two browser tabs at http://localhost:8080
3. Tab 1: Login as interviewer → Create interview → Copy share link
4. Tab 2: Login as candidate → Paste share link → Join interview
5. Edit code in either tab, run code, send chat messages

Changes sync via Zustand store (shared across tabs in same browser instance).
