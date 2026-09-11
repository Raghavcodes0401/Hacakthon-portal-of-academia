from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.core.audit import record_audit_log
from app.models import (
    User, UserRole, Workshop, WorkshopRegistration,
    Notification, NotificationType
)
from app.schemas import WorkshopCreate, WorkshopOut

router = APIRouter(prefix="/workshops", tags=["Workshops"])

@router.get("")
def list_workshops(
    category: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Workshop)
    if category:
        query = query.filter(Workshop.category.ilike(f"%{category}%"))
    
    workshops = query.order_by(Workshop.date_time.asc()).all()
    user_registered_ids = set()
    if current_user:
        user_registered_ids = {
            wr.workshop_id for wr in db.query(WorkshopRegistration).filter(WorkshopRegistration.user_id == current_user.id).all()
        }

    results = []
    for w in workshops:
        results.append({
            "id": w.id,
            "title": w.title,
            "description": w.description,
            "speaker": w.speaker,
            "category": w.category,
            "date_time": w.date_time,
            "duration_hours": w.duration_hours,
            "capacity": w.capacity,
            "mode": w.mode.value,
            "meeting_url": w.meeting_url,
            "organization_name": w.organization.name if w.organization else "Industry Partner",
            "registered_count": len(w.registrations),
            "is_registered": w.id in user_registered_ids
        })
    return results

@router.post("", status_code=status.HTTP_201_CREATED)
def create_workshop(
    req: WorkshopCreate,
    current_user: User = Depends(require_roles([UserRole.INDUSTRY_USER, UserRole.INSTITUTION_ADMIN, UserRole.FACULTY, UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization to create workshops")

    w = Workshop(
        organization_id=current_user.organization_id,
        title=req.title.strip(),
        description=req.description.strip(),
        speaker=req.speaker.strip(),
        category=req.category,
        date_time=req.date_time,
        duration_hours=req.duration_hours,
        capacity=req.capacity,
        mode=req.mode,
        meeting_url=req.meeting_url
    )
    db.add(w)

    record_audit_log(
        db=db,
        action="WORKSHOP_CREATED",
        entity_type="WORKSHOP",
        entity_id=w.id,
        user_id=current_user.id,
        details={"title": w.title, "date": str(w.date_time)}
    )

    db.commit()
    db.refresh(w)
    return {"message": "Workshop created successfully", "workshop_id": w.id}

@router.post("/{workshop_id}/register")
def register_for_workshop(
    workshop_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    w = db.query(Workshop).filter(Workshop.id == workshop_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workshop not found")

    existing = db.query(WorkshopRegistration).filter(
        WorkshopRegistration.workshop_id == workshop_id,
        WorkshopRegistration.user_id == current_user.id
    ).first()

    if existing:
        return {"message": "Already registered for this workshop"}

    if len(w.registrations) >= w.capacity:
        raise HTTPException(status_code=400, detail="Workshop has reached maximum attendee capacity")

    reg = WorkshopRegistration(
        workshop_id=workshop_id,
        user_id=current_user.id,
        registered_at=datetime.now(timezone.utc)
    )
    db.add(reg)

    # Send Notification
    note = Notification(
        user_id=current_user.id,
        type=NotificationType.WORKSHOP,
        title="Workshop Registration Confirmed",
        message=f"You are registered for '{w.title}'. Speaker: {w.speaker}.",
        link=w.meeting_url
    )
    db.add(note)

    db.commit()
    return {"message": "Successfully registered for workshop"}
