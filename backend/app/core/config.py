import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Root .env holds shared secrets (e.g. AWS_BEARER_TOKEN_BEDROCK); export so boto3 sees them.
_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(_ROOT / ".env")
# Empty values (e.g. AWS_PROFILE=) would make boto3 look for a profile named "".
for _k in ("AWS_PROFILE", "AWS_DEFAULT_PROFILE"):
    if not os.environ.get(_k):
        os.environ.pop(_k, None)


class Settings(BaseSettings):
    environment: str = "development"
    debug: bool = True

    # AWS
    aws_region: str = "us-east-1"
    aws_profile: str | None = None

    # Bedrock Models
    bedrock_model_opus: str = "us.anthropic.claude-opus-4-5-20251101-v1:0"
    bedrock_model_sonnet: str = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
    bedrock_model_haiku: str = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
    bedrock_embedding_model: str = "amazon.titan-embed-text-v2:0"
    bedrock_guardrail_id: str | None = None
    bedrock_guardrail_version: str | None = None
    bedrock_max_concurrency: int = 8

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/app.db"

    # Vector Store
    vector_dir: str = "./data/vectors"

    # Frontend
    frontend_origin: str = "http://localhost:3000"

    # Auth
    jwt_secret: str = "your-secret-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    class Config:
        env_file = (str(_ROOT / ".env"), ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


settings = Settings()
