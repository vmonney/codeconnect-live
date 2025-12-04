from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
from app.config import settings
from app.database import init_db
from app.routers import (
    auth,
    users,
    interviews,
    invitations,
    templates,
    code_execution,
    websocket,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("Initializing database...")
    init_db()
    print("Database initialized!")
    print(f"\nAPI Documentation: http://localhost:8000/api/docs")
    print(f"ReDoc: http://localhost:8000/api/redoc\n")

    yield

    # Shutdown
    print("Application shutdown")


app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time collaborative coding interview platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static assets (JS/CSS bundles)
# Only mount if static directory exists (Docker environment)
if os.path.exists("static/assets"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(interviews.router)
app.include_router(invitations.router)
app.include_router(templates.router)
app.include_router(code_execution.router)
app.include_router(websocket.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CodeView Backend API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    Serve React SPA for all non-API routes.
    Handles client-side routing by falling back to index.html.
    """
    # Only serve frontend if static directory exists (Docker environment)
    if not os.path.exists("static"):
        return {
            "message": "CodeView Backend API",
            "version": "1.0.0",
            "docs": "/api/docs",
        }

    # Try to serve static file if it exists (e.g., favicon.ico, robots.txt, js-worker.js)
    file_path = os.path.join("static", full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    # Fallback to index.html for SPA routing (React Router handles the rest)
    return FileResponse("static/index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
