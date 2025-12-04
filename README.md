# CodeView - Coding Interview Platform

A professional coding interview platform with real-time collaborative code editing, execution, and communication between interviewers and candidates.

## Features

- Real-time collaborative code editing with Monaco Editor
- Multi-language support (JavaScript, Python, Java, C++, Go, Ruby)
- Live code execution
- Real-time chat messaging
- Cursor position tracking across participants
- Interview scheduling and management
- Code template library
- Role-based dashboards (Interviewer/Candidate)

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Zustand (State Management)
- Tailwind CSS + shadcn/ui
- Monaco Editor
- React Router v6

### Backend
- FastAPI (Python)
- SQLite + SQLAlchemy
- JWT Authentication
- WebSocket support

## Prerequisites

- Node.js 18+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

## Quick Start

### 1. Install Dependencies

```bash
cd codeconnect-live

# Install root dependencies (concurrently)
npm install

# Install frontend dependencies
npm run install:all

# Install backend dependencies
cd backend && uv sync && cd ..
```

### 2. Seed Demo Data

```bash
npm run seed
```

### 3. Start Both Services

```bash
npm run dev
```

This runs both the backend (http://localhost:8000) and frontend (http://localhost:8080) concurrently.

### Alternative: Start Services Separately

**Backend:**
```bash
npm run dev:backend
# or: cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
npm run dev:frontend
# or: cd frontend && npm run dev
```

## Demo Accounts

After running the seed script, you can log in with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Interviewer | interviewer@demo.com | demo123 |
| Candidate | candidate@demo.com | demo123 |

## API Documentation

When the backend is running, you can access:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## Running Tests

### Frontend Tests

```bash
cd frontend

# Run tests once
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Backend Tests

```bash
cd backend

# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/test_auth.py
```

## Development Commands

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 8080) |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |

### Backend

| Command | Description |
|---------|-------------|
| `uv sync` | Install/sync dependencies |
| `uv add <pkg>` | Add a new package |
| `uv run uvicorn main:app --reload` | Start dev server |
| `uv run python scripts/seed_data.py` | Seed demo data |
| `uv run pytest` | Run tests |

## Project Structure

```
codeconnect-live/
├── frontend/
│   ├── src/
│   │   ├── api/              # HTTP client and API types
│   │   ├── components/       # React components
│   │   │   ├── dashboard/    # Dashboard components
│   │   │   ├── interview/    # Interview room components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── pages/            # Route pages
│   │   ├── stores/           # Zustand state stores
│   │   ├── types/            # TypeScript types
│   │   └── __tests__/        # Integration tests
│   ├── package.json
│   └── vitest.config.ts
│
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routers/          # FastAPI routers
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities
│   ├── scripts/              # Management scripts
│   ├── main.py               # Application entry point
│   └── pyproject.toml
│
└── README.md
```

## Architecture

### Frontend State Management

The frontend uses Zustand for state management with three main stores:

- **authStore**: User authentication, session management
- **interviewStore**: Interview CRUD, real-time collaboration via WebSocket
- **templateStore**: Code template management

### Backend API

The backend provides:

- **REST API**: CRUD operations for interviews, templates, users
- **WebSocket**: Real-time code sync, cursor positions, chat messages
- **JWT Auth**: Secure token-based authentication

### Real-time Features

WebSocket events for live collaboration:

| Event | Description |
|-------|-------------|
| `code_update` | Sync code changes |
| `cursor_update` | Track cursor positions |
| `chat_message` | Real-time chat |
| `typing` | Typing indicators |
| `language_change` | Language switching |
| `interview_status` | Status updates |
| `participant_joined/left` | Participant tracking |

## Interview Flow

1. **Interviewer** creates an interview session
2. System generates a unique share link
3. **Candidate** joins via the share link
4. Both collaborate in real-time:
   - Edit code together
   - See each other's cursors
   - Chat via built-in messaging
   - Run code and see results
5. **Interviewer** ends the session and can rate/add notes

## Environment Configuration

### Backend Environment Variables

Create `.env` in `backend/`:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./codeview.db
```

### Frontend Environment Variables

The frontend uses the following defaults:

- API Base URL: `http://localhost:8000/api`
- WebSocket URL: `ws://localhost:8000/api`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT
