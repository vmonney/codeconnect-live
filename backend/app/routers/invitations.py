from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
from app.database import get_db
from app.models.invitation import Invitation
from app.models.interview import Interview
from app.models.user import User
from app.schemas.invitation import InvitationCreate, InvitationUpdate, InvitationResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/invitations", tags=["Invitations"])


@router.post("", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    data: InvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new invitation"""
    # Verify interview exists
    interview = db.query(Interview).filter(Interview.id == data.interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Verify current user is the interviewer
    if interview.interviewer_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the interviewer can send invitations"
        )

    invitation = Invitation(
        id=str(uuid4()),
        interview_id=data.interview_id,
        interview_title=interview.title,
        interviewer_name=interview.interviewer_name,
        candidate_id=data.candidate_id,
        candidate_email=data.candidate_email,
        scheduled_at=interview.scheduled_at,
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return InvitationResponse.from_orm(invitation)


@router.get("", response_model=List[InvitationResponse])
async def list_invitations(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's invitations"""
    query = db.query(Invitation).filter(Invitation.candidate_id == current_user.id)

    if status:
        query = query.filter(Invitation.status == status)

    invitations = query.order_by(Invitation.created_at.desc()).all()
    return [InvitationResponse.from_orm(i) for i in invitations]


@router.patch("/{invitation_id}", response_model=InvitationResponse)
async def update_invitation(
    invitation_id: str,
    data: InvitationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update invitation status (accept/decline)"""
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # Verify current user is the candidate
    if invitation.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    invitation.status = data.status
    db.commit()
    db.refresh(invitation)

    return InvitationResponse.from_orm(invitation)
