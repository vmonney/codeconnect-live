from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.invitation import InvitationStatus


class InvitationCreate(BaseModel):
    interview_id: str
    candidate_id: Optional[str] = None
    candidate_email: Optional[str] = None


class InvitationUpdate(BaseModel):
    status: InvitationStatus


class InvitationResponse(BaseModel):
    id: str
    interview_id: str
    interview_title: str
    interviewer_name: str
    scheduled_at: Optional[datetime]
    status: InvitationStatus
    created_at: datetime

    class Config:
        from_attributes = True
