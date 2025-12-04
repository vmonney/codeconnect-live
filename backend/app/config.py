from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "CodeView Backend"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./codeview.db"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # CORS
    CORS_ORIGINS: str = '["http://localhost:8080", "http://127.0.0.1:8080"]'

    # Codespaces environment detection
    CODESPACE_NAME: str = ""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS JSON string into list, adding Codespaces URLs if applicable"""
        origins = []
        try:
            origins = json.loads(self.CORS_ORIGINS)
        except json.JSONDecodeError:
            origins = ["http://localhost:8080", "http://127.0.0.1:8080"]

        # Add Codespaces URL if running in GitHub Codespaces
        if self.CODESPACE_NAME:
            codespace_url = f"https://{self.CODESPACE_NAME}-8080.app.github.dev"
            origins.append(codespace_url)

        return origins


settings = Settings()
