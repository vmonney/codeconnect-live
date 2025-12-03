from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    INTERVIEWER = "interviewer"
    CANDIDATE = "candidate"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    interviews_as_interviewer = relationship(
        "Interview",
        back_populates="interviewer",
        foreign_keys="Interview.interviewer_id",
        cascade="all, delete-orphan",
    )
    interviews_as_candidate = relationship(
        "Interview",
        back_populates="candidate",
        foreign_keys="Interview.candidate_id",
    )
    templates = relationship("CodeTemplate", back_populates="creator")
    invitations = relationship("Invitation", back_populates="candidate")
