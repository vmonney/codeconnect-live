from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
from app.database import get_db
from app.models.template import CodeTemplate
from app.models.user import User
from app.schemas.template import TemplateCreate, TemplateUpdate, TemplateResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/templates", tags=["Templates"])


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    data: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new template"""
    template = CodeTemplate(
        id=str(uuid4()),
        title=data.title,
        description=data.description,
        problem=data.problem,
        examples=data.examples,
        constraints=data.constraints,
        difficulty=data.difficulty,
        tags=data.tags,
        starter_code=data.starter_code,
        solution=data.solution,
        created_by=current_user.id,
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    return TemplateResponse.from_orm(template)


@router.get("", response_model=List[TemplateResponse])
async def list_templates(
    difficulty: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List templates with optional filters"""
    query = db.query(CodeTemplate)

    # Filter by difficulty
    if difficulty:
        query = query.filter(CodeTemplate.difficulty == difficulty)

    # Filter by search term in title or description
    if search:
        query = query.filter(
            (CodeTemplate.title.contains(search))
            | (CodeTemplate.description.contains(search))
        )

    # TODO: Filter by tags (would need more complex JSON query)

    templates = query.order_by(CodeTemplate.created_at.desc()).all()
    return [TemplateResponse.from_orm(t) for t in templates]


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str, db: Session = Depends(get_db)):
    """Get single template"""
    template = db.query(CodeTemplate).filter(CodeTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )

    return TemplateResponse.from_orm(template)


@router.patch("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    data: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update template"""
    template = db.query(CodeTemplate).filter(CodeTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )

    # Check permissions (only creator can update)
    if template.created_by != current_user.id and template.created_by != "system":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update templates you created",
        )

    # Don't allow updating system templates
    if template.created_by == "system":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update system templates",
        )

    # Update fields
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)

    return TemplateResponse.from_orm(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete template"""
    template = db.query(CodeTemplate).filter(CodeTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )

    # Don't allow deleting system templates
    if template.created_by == "system":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete system templates",
        )

    # Check permissions (only creator can delete)
    if template.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete templates you created",
        )

    db.delete(template)
    db.commit()
