# CodeView - Coding Interview Platform

A professional coding interview platform with real-time collaborative code editing, execution, and communication between interviewers and candidates.

## Features

- Real-time collaborative code editing with Monaco Editor
- Multi-language support (JavaScript and Python with browser-based WASM execution)
- Live code execution (Pyodide for Python, native JS)
- Real-time chat messaging
- Cursor position tracking across participants
- Interview scheduling and management
- Code template library
- Role-based dashboards (Interviewer/Candidate)

## Running Modes

You can run this application in two ways:

### 🐳 **Docker Mode (Production-like)** ✅ Recommended for deployment
- Single containerized application
- Frontend and backend in one container
- Database persistence via volume mount
- Access at: **http://localhost:8000**

### 💻 **Development Mode** ✅ Recommended for coding
- Hot-reload for both frontend and backend
- Frontend: http://localhost:8080
- Backend: http://localhost:8000
- Better for active development

**⚠️ Important**: You cannot run both modes simultaneously as they both use port 8000!

Choose one mode below based on your needs.

---

## 🐳 Quick Start with Docker

Perfect for testing or production deployment:

```bash
# Start the containerized app
docker-compose up -d

# Seed demo data (optional)
docker exec -it codeview uv run python scripts/seed_data.py

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

**Access the app**: http://localhost:8000

---

## 💻 Quick Start for Development

Perfect for coding with hot-reload:

```bash
# Make sure Docker container is stopped first!
docker-compose down

# Install dependencies
npm install
npm run install:all
cd backend && uv sync && cd ..

# Seed demo data
npm run seed

# Start both services with hot-reload
npm run dev
```

**Access the app**:
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api/docs

---

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

### For Docker Mode
- Docker and Docker Compose

### For Development Mode
- Node.js 18+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

## Alternative: Start Services Separately (Development Mode)

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

## Docker Deployment Details

The application is containerized in a single Docker container that serves both the backend and frontend.

### Base Images

- **Frontend Build**: `node:22-alpine` (for building React/Vite app)
- **Backend Runtime**: `python:3.12-slim` (for running FastAPI + serving frontend)

### Docker CLI Alternative

If you prefer not to use Docker Compose:

```bash
# Build the image
docker build -t codeview:latest .

# Create data directory for database persistence
mkdir -p ./data

# Run the container
docker run -d \
  --name codeview \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -e SECRET_KEY="$(openssl rand -hex 32)" \
  codeview:latest

# View logs
docker logs -f codeview

# Stop and remove
docker stop codeview
docker rm codeview
```

### Testing the Containerized Application

#### 1. Build and Start the Container

```bash
docker-compose up -d
```

#### 2. Check Container Health

```bash
# Check if container is running
docker ps

# View container logs
docker logs -f codeview

# Should see: "Application startup complete"
```

#### 3. Test Frontend Access

```bash
# Test that frontend is being served
curl -I http://localhost:8000/

# Should return: HTTP/1.1 200 OK
# Content-Type: text/html
```

Open browser and navigate to:
- **Frontend**: http://localhost:8000/
- **Login Page**: http://localhost:8000/auth
- **Dashboard**: http://localhost:8000/dashboard (after login)

#### 4. Test Backend API

```bash
# Test API documentation endpoint
curl http://localhost:8000/api/docs

# Test health check
curl http://localhost:8000/health

# Should return: {"status":"healthy"}
```

#### 5. Test Authentication Flow

1. Navigate to http://localhost:8000/auth
2. Click "Sign Up" and create a new account
3. Login with your credentials
4. Verify you can access the dashboard

#### 6. Test Database Persistence

```bash
# Create a user account via the UI
# Stop the container
docker-compose down

# Restart the container
docker-compose up -d

# Login with the same account - should work!
# This confirms database is persisted in ./data/codeview.db
```

#### 7. Test Code Execution

1. Login to the application
2. Create or join an interview
3. Select **JavaScript** and run:
   ```javascript
   console.log("Hello from Docker!");
   ```
   Should output: `Hello from Docker!`

4. Select **Python** and run:
   ```python
   print("Hello from Docker!")
   ```
   Should output: `Hello from Docker!`

Both languages use browser-based WASM execution (Pyodide for Python, native for JavaScript).

#### 8. Inspect Container

```bash
# Shell into the running container
docker exec -it codeview sh

# Check if static files exist
ls -la /app/static/

# Should see: index.html, assets/, js-worker.js, etc.

# Check if database directory exists
ls -la /app/data/

# Exit container shell
exit
```

#### 9. Test with Demo Data

```bash
# Seed the database inside the container
docker exec -it codeview uv run python scripts/seed_data.py

# Now you can login with demo accounts:
# Interviewer: interviewer@demo.com / demo123
# Candidate: candidate@demo.com / demo123
```

### Docker Configuration

#### Environment Variables

You can customize the container using environment variables:

```yaml
# docker-compose.yml or docker run -e
environment:
  - DATABASE_URL=sqlite:///./data/codeview.db
  - SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -hex 32
  - ALGORITHM=HS256
  - ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days
  - DEBUG=false
  - CORS_ORIGINS=["http://localhost:8000"]
```

#### Volume Mounts

The SQLite database is persisted using a volume mount:

```bash
# Host: ./data/codeview.db
# Container: /app/data/codeview.db
```

**Important**: Always use volume mounts to prevent data loss when containers are removed.

#### Port Mapping

The container exposes port 8000:

- Host: `http://localhost:8000`
- Container: Port 8000

#### Health Checks

The container includes a health check that runs every 30 seconds:

```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' codeview

# Should return: healthy
```

### Production Deployment

#### Generate Secure Secret Key

```bash
openssl rand -hex 32
```

#### Run in Production Mode

```bash
docker run -d \
  --name codeview \
  -p 8000:8000 \
  -v /var/lib/codeview:/app/data \
  -e SECRET_KEY="your-generated-secret-key" \
  -e DEBUG="false" \
  -e CORS_ORIGINS='["https://yourdomain.com"]' \
  --restart unless-stopped \
  codeview:latest
```

#### Deploy to Cloud Platforms

**Google Cloud Run:**
```bash
gcloud run deploy codeview --source . --platform managed
```

**AWS ECS/Fargate:**
```bash
# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <ecr-url>
docker tag codeview:latest <ecr-url>/codeview:latest
docker push <ecr-url>/codeview:latest
```

**Fly.io:**
```bash
fly launch
fly deploy
```

### Troubleshooting

#### Container won't start

```bash
# Check container logs
docker logs codeview

# Check if port 8000 is already in use
lsof -i :8000

# Use a different port
docker run -p 8080:8000 codeview:latest
```

#### Frontend returns 404

```bash
# Verify static files were copied
docker exec -it codeview ls -la /app/static/

# Rebuild the image
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Database not persisting

```bash
# Ensure data directory exists
mkdir -p ./data

# Check volume mount
docker inspect codeview | grep Mounts -A 10

# Verify database file exists on host
ls -la ./data/codeview.db
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT
