"""App configuration. All values read from environment variables."""
import os


class Config:
    # Neon PostgreSQL in production, SQLite for local dev
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(os.path.dirname(__file__), "blog.db"),
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
