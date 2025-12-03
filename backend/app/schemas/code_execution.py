from pydantic import BaseModel
from typing import Optional
from app.models.interview import ProgrammingLanguage


class CodeExecuteRequest(BaseModel):
    code: str
    language: ProgrammingLanguage
    stdin: str = ""


class CodeExecuteResponse(BaseModel):
    output: str
    error: Optional[str] = None
    execution_time: int
