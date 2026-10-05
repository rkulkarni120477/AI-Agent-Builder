from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    debug: bool = True

    # AWS
    aws_region: str = "us-east-1"
    aws_profile: str | None = None

    # Bedrock Models
    bedrock_model_opus: str = "claude-opus-5-5-sonnet-20241022"
    bedrock_model_sonnet: str = "claude-opus-5-5-sonnet-20241022"
    bedrock_model_haiku: str = "claude-haiku-4-5-20241022"
    bedrock_embedding_model: str = "amazon.titan-embed-text-v2:0"
    bedrock_guardrail_id: str | None = None
    bedrock_guardrail_version: str | None = None
    bedrock_max_concurrency: int = 8

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/app.db"

    # Vector Store
    vector_dir: str = "./data/vectors"

    # Frontend
    frontend_origin: str = "http://localhost:3001"

    # Auth
    jwt_secret: str = "your-secret-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
