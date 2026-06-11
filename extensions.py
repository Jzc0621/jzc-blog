"""Flask extension instances. Kept separate from app.py to avoid circular imports."""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
