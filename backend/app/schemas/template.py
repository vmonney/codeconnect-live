from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
from app.models.template import Difficulty


class TemplateCreate(BaseModel):
    title: str
    description: str
    problem: str
    examples: str
    constraints: str
    difficulty: Difficulty
    tags: list[str]
    starter_code: Dict[str, str]
    solution: Optional[Dict[str, str]] = None


class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    problem: Optional[str] = None
    examples: Optional[str] = None
    constraints: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    tags: Optional[list[str]] = None
    starter_code: Optional[Dict[str, str]] = None
    solution: Optional[Dict[str, str]] = None


class TemplateResponse(BaseModel):
    id: str
    title: str
    description: str
    problem: str
    examples: str
    constraints: str
    difficulty: Difficulty
    tags: list[str]
    starter_code: Dict[str, str]
    solution: Optional[Dict[str, str]]
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
