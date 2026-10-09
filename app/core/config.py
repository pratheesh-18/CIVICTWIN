import json
from typing import List, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicTwin Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./civictwin.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://civictwin-puce.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> Any:
        if isinstance(v, str):
            if v.strip().startswith("["):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # AI & VLM Inspection (read securely from .env or environment variables)
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GOOGLE_MAPS_API_KEY: str = ""

    # Authentication & Security
    SECRET_KEY: str = "civictwin-secret-key-change-in-prod-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    SESSION_COOKIE_NAME: str = "civictwin_session"

    # OTP Provider ("mock" | "twilio_verify")
    OTP_PROVIDER: str = "mock"
    DEMO_MODE: bool = True
    DEMO_DEPT_PASSWORD: str = "CivicAdmin@2026"

    # Twilio (optional)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_SERVICE_SID: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
