from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
from datetime import datetime
from app.database import get_db
from app.models.interview import Interview, ProgrammingLanguage
from app.models.user import User
from app.models.chat_message import ChatMessage
from app.models.template import CodeTemplate
from app.schemas.interview import (
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    InterviewStats,
)
from app.schemas.chat import ChatMessageResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])


def get_starter_code(
    language: ProgrammingLanguage, template_id: Optional[str], db: Session
) -> str:
    """Get starter code for a language, optionally from a template"""
    if template_id:
        template = db.query(CodeTemplate).filter(CodeTemplate.id == template_id).first()
        if template and template.starter_code:
            return template.starter_code.get(language.value, _get_default_starter_code(language))
    return _get_default_starter_code(language)


def _get_default_starter_code(language: ProgrammingLanguage) -> str:
    """Default starter code for each language"""
    starters = {
        ProgrammingLanguage.JAVASCRIPT: """// Welcome to CodeView Interview Platform
// Write your solution below

function solution(input) {
  // Your code here
  return input;
}

// Test your solution
console.log(solution("Hello, World!"));
""",
        ProgrammingLanguage.PYTHON: """# Welcome to CodeView Interview Platform
# Write your solution below

def solution(input):
    # Your code here
    return input

# Test your solution
print(solution("Hello, World!"))
""",
        ProgrammingLanguage.JAVA: """// Welcome to CodeView Interview Platform
// Write your solution below

public class Solution {
    public static void main(String[] args) {
        System.out.println(solution("Hello, World!"));
    }

    public static String solution(String input) {
        // Your code here
        return input;
    }
}
""",
        ProgrammingLanguage.CPP: """// Welcome to CodeView Interview Platform
// Write your solution below

#include <iostream>
#include <string>
using namespace std;

string solution(string input) {
    // Your code here
    return input;
}

int main() {
    cout << solution("Hello, World!") << endl;
    return 0;
}
""",
        ProgrammingLanguage.GO: """// Welcome to CodeView Interview Platform
// Write your solution below

package main

import "fmt"

func solution(input string) string {
    // Your code here
    return input
}

func main() {
    fmt.Println(solution("Hello, World!"))
}
""",
        ProgrammingLanguage.RUBY: """# Welcome to CodeView Interview Platform
# Write your solution below

def solution(input)
  # Your code here
  input
end

# Test your solution
puts solution("Hello, World!")
""",
    }
    return starters.get(language, "// Start coding here...")


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new interview"""
    # Get starter code based on language and template
    starter_code = get_starter_code(data.language, data.template_id, db)

    interview_id = str(uuid4())
    interview = Interview(
        id=interview_id,
        title=data.title,
        description=data.description,
        interviewer_id=current_user.id,
        interviewer_name=current_user.name,
        language=data.language,
        template_id=data.template_id,
        code=starter_code,
        share_link=f"/interview/{interview_id}",
        scheduled_at=data.scheduled_at,
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return InterviewResponse.from_orm(interview)


@router.get("", response_model=List[InterviewResponse])
async def list_interviews(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's interviews with optional filters"""
    query = db.query(Interview)

    # Filter by role
    if role == "interviewer":
        query = query.filter(Interview.interviewer_id == current_user.id)
    elif role == "candidate":
        query = query.filter(Interview.candidate_id == current_user.id)
    else:
        # Return all interviews where user is either interviewer or candidate
        query = query.filter(
            (Interview.interviewer_id == current_user.id)
            | (Interview.candidate_id == current_user.id)
        )

    # Filter by status
    if status:
        query = query.filter(Interview.status == status)

    interviews = query.order_by(Interview.created_at.desc()).all()
    return [InterviewResponse.from_orm(i) for i in interviews]


@router.get("/stats/{user_id}", response_model=InterviewStats)
async def get_interviewer_stats(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get interviewer statistics"""
    interviews = db.query(Interview).filter(Interview.interviewer_id == user_id).all()

    completed = [i for i in interviews if i.status.value == "completed"]
    total_duration = sum(i.duration for i in completed if i.duration)
    avg_duration = total_duration / len(completed) if completed else 0

    return InterviewStats(
        total=len(interviews), completed=len(completed), avg_duration=avg_duration
    )


@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get single interview"""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found"
        )

    # Check if user has access
    if (
        interview.interviewer_id != current_user.id
        and interview.candidate_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this interview",
        )

    return InterviewResponse.from_orm(interview)


@router.patch("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: str,
    data: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update interview"""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found"
        )

    # Check permissions (only interviewer can update)
    if interview.interviewer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the interviewer can update this interview",
        )

    # Update fields
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(interview, field, value)

    interview.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interview)

    return InterviewResponse.from_orm(interview)


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete interview"""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found"
        )

    if interview.interviewer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the interviewer can delete this interview",
        )

    db.delete(interview)
    db.commit()


@router.get("/{interview_id}/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    interview_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get chat messages for an interview with pagination"""
    # Verify user has access to interview
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if (
        interview.interviewer_id != current_user.id
        and interview.candidate_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.interview_id == interview_id)
        .order_by(ChatMessage.timestamp.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    return [ChatMessageResponse.from_orm(m) for m in messages]


@router.get("/{interview_id}/participants")
async def get_participants(interview_id: str, current_user: User = Depends(get_current_user)):
    """Get active participants in interview (from WebSocket manager)"""
    from app.services.websocket_manager import manager

    participants = manager.get_participants(interview_id)
    return {"participants": participants}
