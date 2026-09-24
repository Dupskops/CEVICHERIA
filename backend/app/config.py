"""
Configuración centralizada del backend.
Carga las variables de entorno desde .env usando pydantic-settings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configuración de la aplicación cargada desde variables de entorno."""

    # --- Aplicación ---
    APP_NAME: str = "Cevichería D'Peñas - API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # --- Base de Datos (PostgreSQL / Supabase) ---
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/cevicheria_db"

    # --- Google Gemini API ---
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # --- Seguridad ---
    SECRET_KEY: str = ""

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Retorna la instancia de Settings cacheada (singleton)."""
    return Settings()
