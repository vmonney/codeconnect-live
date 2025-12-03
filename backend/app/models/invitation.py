from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String, primary_key=True)
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False)
    interview_title = Column(String, nullable=False)
    interviewer_name = Column(String, nullable=False)
    candidate_id = Column(String, ForeignKey("users.id"), nullable=True)
    candidate_email = Column(String, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(InvitationStatus), default=InvitationStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="invitations")
    candidate = relationship("User", back_populates="invitations")
