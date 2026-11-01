from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    app_name: str = "FormPilot AI API"
    environment: str = "production"
    model_base_url: str = "https://YOUR-INFERENCE-ENDPOINT/v1"
    model_api_key: str = "not-needed-for-local-endpoint"
    model_name: str = "goasty/Qwen3-4B-Indian-Law"
    model_timeout_seconds: float = 90
    model_max_tokens: int = 1200
    model_temperature: float = 0.1
    max_concurrent_generations: int = 2
    cors_origins: str = "http://localhost:3000"
    rate_limit_per_minute: int = 30

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
