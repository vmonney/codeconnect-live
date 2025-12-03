from pydantic import BaseModel
from datetime import datetime


class ChatMessageResponse(BaseModel):
    id: str
    interview_id: str
    user_id: str
    user_name: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True
