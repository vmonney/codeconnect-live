from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.interview import InterviewStatus, ProgrammingLanguage


class InterviewCreate(BaseModel):
    title: str
    description: Optional[str] = None
    language: ProgrammingLanguage
    template_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class InterviewUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[InterviewStatus] = None
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None
    language: Optional[ProgrammingLanguage] = None
    code: Optional[str] = None
    rating: Optional[float] = None
    notes: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration: Optional[int] = None


class InterviewResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    interviewer_id: str
    interviewer_name: str
    candidate_id: Optional[str]
    candidate_name: Optional[str]
    status: InterviewStatus
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    duration: Optional[int]
    language: ProgrammingLanguage
    template_id: Optional[str]
    code: str
    rating: Optional[float]
    notes: Optional[str]
    share_link: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InterviewStats(BaseModel):
    total: int
    completed: int
    avg_duration: float
