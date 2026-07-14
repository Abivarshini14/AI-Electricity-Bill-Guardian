import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-insecure-secret-change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./electricity_guardian.db")

    GROK_API_KEY: str = os.getenv("GROK_API_KEY", "")
    GROK_API_URL: str = os.getenv("GROK_API_URL", "https://api.x.ai/v1/chat/completions")
    GROK_MODEL: str = os.getenv("GROK_MODEL", "grok-2-latest")

    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587") or 587)
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    DEMO_ADMIN_EMAIL: str = os.getenv("DEMO_ADMIN_EMAIL", "admin@guardianapp.com")
    DEMO_ADMIN_PASSWORD: str = os.getenv("DEMO_ADMIN_PASSWORD", "Admin@12345")
    DEMO_ADMIN_NAME: str = os.getenv("DEMO_ADMIN_NAME", "System Admin")

    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
