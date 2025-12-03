from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProgrammingLanguage(str, enum.Enum):
    JAVASCRIPT = "javascript"
    PYTHON = "python"
    JAVA = "java"
    CPP = "cpp"
    GO = "go"
    RUBY = "ruby"


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    interviewer_id = Column(String, ForeignKey("users.id"), nullable=False)
    interviewer_name = Column(String, nullable=False)
    candidate_id = Column(String, ForeignKey("users.id"), nullable=True)
    candidate_name = Column(String, nullable=True)
    status = Column(SQLEnum(InterviewStatus), default=InterviewStatus.SCHEDULED)
    scheduled_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # in minutes
    language = Column(SQLEnum(ProgrammingLanguage), nullable=False)
    template_id = Column(String, ForeignKey("code_templates.id"), nullable=True)
    code = Column(Text, nullable=False)
    rating = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    share_link = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    interviewer = relationship(
        "User", back_populates="interviews_as_interviewer", foreign_keys=[interviewer_id]
    )
    candidate = relationship(
        "User", back_populates="interviews_as_candidate", foreign_keys=[candidate_id]
    )
    template = relationship("CodeTemplate", back_populates="interviews")
    messages = relationship("ChatMessage", back_populates="interview", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="interview", cascade="all, delete-orphan")
