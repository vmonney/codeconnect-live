# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files for dependency installation
COPY frontend/package.json frontend/package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend to static files (outputs to /app/frontend/dist/)
RUN npm run build

# Stage 2: Backend runtime + serve frontend
FROM python:3.12-slim AS runtime

WORKDIR /app

# Install uv (fast Python package manager)
RUN pip install --no-cache-dir uv

# Copy backend dependency files
COPY backend/pyproject.toml backend/uv.lock ./

# Install Python dependencies (production only, frozen lockfile)
RUN uv sync --frozen --no-dev

# Copy backend source code
COPY backend/ ./

# Copy built frontend from previous stage to /app/static
COPY --from=frontend-builder /app/frontend/dist ./static

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose port 8000 (serves both API and frontend)
EXPOSE 8000

# Environment variables (can be overridden at runtime)
ENV DATABASE_URL="sqlite:///./data/codeview.db" \
    HOST="0.0.0.0" \
    PORT="8000"

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/docs')" || exit 1

# Start command
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
