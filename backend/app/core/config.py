from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union, Optional
from pydantic import Field, field_validator
import json

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
    
    # CORS configuration
    BACKEND_CORS_ORIGINS: Union[List[str], str] = Field(default=["*"])

    # Optional Production Gateway & Provider Keys
    PAYMENT_GATEWAY_KEY: Optional[str] = Field(default=None)
    PAYMENT_GATEWAY_SECRET: Optional[str] = Field(default=None)
    MAPS_API_KEY: Optional[str] = Field(default=None)
    PUSH_NOTIFICATION_KEY: Optional[str] = Field(default=None)

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
