from sqlalchemy import Column, String, DateTime, Text, JSON, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class CodeTemplate(Base):
    __tablename__ = "code_templates"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    problem = Column(Text, nullable=False)
    examples = Column(Text, nullable=False)
    constraints = Column(Text, nullable=False)
    difficulty = Column(SQLEnum(Difficulty), nullable=False)
    tags = Column(JSON, nullable=False)  # Store as JSON array
    starter_code = Column(JSON, nullable=False)  # {language: code}
    solution = Column(JSON, nullable=True)  # {language: code}
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="templates")
    interviews = relationship("Interview", back_populates="template")
