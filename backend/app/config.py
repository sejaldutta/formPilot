from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FormPilot AI API"
    app_version: str = "0.1.0"

    # Development configuration: local Ollama model
    model_provider: str = "ollama"
    model_name: str = "saicharan1010/SmolLM2-FT-legal-india"
    model_base_url: str = "http://localhost:11434"

    model_timeout_seconds: int = 120

    allowed_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        ]


settings = Settings()
