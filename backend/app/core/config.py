from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union, Optional
from pydantic import Field, field_validator
import json
import re

MANDATORY_CORS_ORIGINS: List[str] = [
    "https://campusbite-web-nine.vercel.app",
    "https://admin.campusbite.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusBite"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development")  # development, staging, production
    
    # JWT & Authentication settings
    SECRET_KEY: str = Field(default="supersecretkeychangeinproduction12345")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=10080)  # 7 days (in minutes)
    ALGORITHM: str = Field(default="HS256")
    
    # PostgreSQL Database settings
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/campusbite")
    
    # CORS configuration (Allowed frontend web/mobile origins)
    BACKEND_CORS_ORIGINS: Union[List[str], str] = Field(default=MANDATORY_CORS_ORIGINS)


    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql://", 1)
            if "ep-sweet-cell-avse0t8c" in v and "/neondb" in v:
                v = re.sub(r'/neondb(\?|$)', r'/campusbite\1', v)
        return v

    # Optional Production Gateway & Provider Keys
    PAYMENT_GATEWAY_KEY: Optional[str] = Field(default=None)
    PAYMENT_GATEWAY_SECRET: Optional[str] = Field(default=None)
    MAPS_API_KEY: Optional[str] = Field(default=None)
    PUSH_NOTIFICATION_KEY: Optional[str] = Field(default=None)

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        origins_list: List[str] = []
        if isinstance(v, str):
            cleaned_str = v.strip().strip('"').strip("'")
            if cleaned_str.startswith("[") and cleaned_str.endswith("]"):
                try:
                    parsed = json.loads(cleaned_str)
                    origins_list = [str(i) for i in parsed]
                except Exception:
                    origins_list = [cleaned_str]
            else:
                origins_list = cleaned_str.split(",")
        elif isinstance(v, list):
            origins_list = [str(i) for i in v]

        sanitized = set()
        for item in origins_list:
            cleaned = item.strip().strip('"').strip("'").rstrip("/")
            if cleaned:
                sanitized.add(cleaned)

        # Unconditionally guarantee essential production origins
        for mandatory in MANDATORY_CORS_ORIGINS:
            sanitized.add(mandatory)

        return sorted(list(sanitized))



    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
