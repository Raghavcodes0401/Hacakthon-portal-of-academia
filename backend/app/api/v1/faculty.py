from typing import List, Optional
import os
import shutil
import uuid
import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.permissions import get_current_user, require_roles
from app.core.audit import record_audit_log
from app.models import (
    User, UserRole, FacultyProfile, ResearchPaper, ResearchProject,
    ResearchCollaboration, Grant, GrantBookmark, CollaborationStatus,
    Notification, NotificationType
)
from app.schemas import (
    FacultyProfileUpdate, FacultyProfileOut, ResearchPaperCreate,
    CollaborationRequestCreate
)
from app.ai.research_recommender import recommend_collaborators_for_faculty

router = APIRouter(prefix="/faculty", tags=["Faculty"])

@router.get("/me")
def get_faculty_profile(
    current_user: User = Depends(require_roles([UserRole.FACULTY])),
    db: Session = Depends(get_db)
):
    profile = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
    if not profile:
        profile = FacultyProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "id": profile.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "organization_id": current_user.organization_id,
        "organization_name": current_user.organization.name if current_user.organization else "Autonomous Institute",
        "department": profile.department or "Computer Science and Engineering",
        "designation": profile.designation or "Associate Professor",
        "research_interests": profile.research_interests or "Distributed Computing, Machine Learning, Cloud Architecture",
        "orcid_id": profile.orcid_id or "0000-0002-1825-0097",
        "scholar_url": profile.scholar_url,
        "bio": profile.bio or "Senior researcher and educator with over a decade of experience in systems research.",
        "is_mentor": profile.is_mentor,
        "publications_count": len(profile.papers),
        "courses_count": len(profile.courses)
    }

@router.patch("/me")
def update_faculty_profile(
    req: FacultyProfileUpdate,
    current_user: User = Depends(require_roles([UserRole.FACULTY])),
    db: Session = Depends(get_db)
):
    profile = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
    if not profile:
        profile = FacultyProfile(user_id=current_user.id)
        db.add(profile)

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    return {"message": "Faculty profile updated successfully"}

@router.get("/research-papers")
def list_research_papers(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ResearchPaper)
    if search:
        query = query.filter(ResearchPaper.title.ilike(f"%{search}%") | ResearchPaper.abstract.ilike(f"%{search}%"))
    
    papers = query.order_by(ResearchPaper.created_at.desc()).all()
    results = []
    for p in papers:
        fac = p.faculty
        results.append({
            "id": p.id,
            "title": p.title,
            "abstract": p.abstract,
            "authors": p.authors,
            "journal": p.journal,
            "publication_date": p.publication_date,
            "doi": p.doi,
            "pdf_url": p.pdf_url,
            "keywords": p.keywords_json or [],
            "status": p.status.value,
            "faculty_name": fac.user.full_name if (fac and fac.user) else "Faculty Researcher",
            "institution_name": fac.user.organization.name if (fac and fac.user and fac.user.organization) else "Autonomous Institute"
        })
    return results

@router.post("/research-papers", status_code=status.HTTP_201_CREATED)
def publish_research_paper(
    req: ResearchPaperCreate,
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.INSTITUTION_ADMIN])),
    db: Session = Depends(get_db)
):
    profile = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
    if not profile:
        profile = FacultyProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    paper = ResearchPaper(
        faculty_id=profile.id,
        title=req.title.strip(),
        abstract=req.abstract.strip(),
        authors=req.authors.strip(),
        journal=req.journal,
        publication_date=req.publication_date or datetime.now(timezone.utc),
        doi=req.doi,
        pdf_url=req.pdf_url,
        keywords_json=req.keywords_json
    )
    db.add(paper)

    record_audit_log(
        db=db,
        action="RESEARCH_PAPER_PUBLISHED",
        entity_type="RESEARCH_PAPER",
        entity_id=paper.id,
        user_id=current_user.id,
        details={"title": paper.title, "doi": paper.doi}
    )

    db.commit()
    return {"message": "Research paper metadata published successfully", "paper_id": paper.id}

@router.post("/research-papers/upload")
async def upload_research_paper_document(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.INSTITUTION_ADMIN, UserRole.PLATFORM_ADMIN]))
):
    """
    Upload a research paper document (PDF, DOCX, TXT) to the platform.
    Returns the accessible file_url so students, faculty, and industry can view/read it.
    """
    filename = file.filename or "paper.pdf"
    ext = os.path.splitext(filename)[1].lower()
    allowed_extensions = {".pdf", ".docx", ".doc", ".txt", ".odt"}
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, DOCX, DOC, TXT"
        )

    upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)

    # Sanitize and create unique file path
    safe_name = re.sub(r'[^a-zA-Z0-9_\.-]', '_', filename)
    unique_suffix = uuid.uuid4().hex[:12]
    saved_filename = f"research_{unique_suffix}_{safe_name}"
    dest_path = os.path.join(upload_dir, saved_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(dest_path)
    file_url = f"/uploads/{saved_filename}"

    return {
        "file_url": file_url,
        "filename": filename,
        "size_bytes": file_size,
        "message": "Research document uploaded successfully"
    }

@router.get("/recommendations/collaborators")
def get_collaborator_recommendations(
    current_user: User = Depends(require_roles([UserRole.FACULTY])),
    db: Session = Depends(get_db)
):
    profile = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
    if not profile:
        return []
    
    return recommend_collaborators_for_faculty(db, profile)

@router.post("/collaborations")
def send_collaboration_request(
    req: CollaborationRequestCreate,
    current_user: User = Depends(require_roles([UserRole.FACULTY])),
    db: Session = Depends(get_db)
):
    sender = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender faculty profile not found")

    recipient = db.query(FacultyProfile).filter(FacultyProfile.id == req.recipient_faculty_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient faculty profile not found")

    collab = ResearchCollaboration(
        sender_id=sender.id,
        recipient_id=recipient.id,
        project_title=req.project_title.strip(),
        message=req.message.strip(),
        status=CollaborationStatus.PENDING
    )
    db.add(collab)

    # Notify recipient
    if recipient.user:
        note = Notification(
            user_id=recipient.user.id,
            type=NotificationType.COLLABORATION_REQUEST,
            title="New Research Collaboration Request",
            message=f"{current_user.full_name} from {current_user.organization.name if current_user.organization else 'Institution'} invited you to collaborate on '{req.project_title}'.",
            link="/faculty/collaborations"
        )
        db.add(note)

    db.commit()
    return {"message": "Collaboration request sent successfully", "collaboration_id": collab.id}

@router.get("/collaborations")
def get_my_collaborations(
    current_user: User = Depends(require_roles([UserRole.FACULTY])),
    db: Session = Depends(get_db)
):
    profile = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
    if not profile:
        return {"sent": [], "received": []}

    sent = db.query(ResearchCollaboration).filter(ResearchCollaboration.sender_id == profile.id).all()
    received = db.query(ResearchCollaboration).filter(ResearchCollaboration.recipient_id == profile.id).all()

    def format_collab(c):
        return {
            "id": c.id,
            "project_title": c.project_title,
            "message": c.message,
            "status": c.status.value,
            "sender_name": c.sender.user.full_name if (c.sender and c.sender.user) else "Faculty",
            "sender_institution": c.sender.user.organization.name if (c.sender and c.sender.user and c.sender.user.organization) else "Institution",
            "recipient_name": c.recipient.user.full_name if (c.recipient and c.recipient.user) else "Faculty",
            "recipient_institution": c.recipient.user.organization.name if (c.recipient and c.recipient.user and c.recipient.user.organization) else "Institution",
            "created_at": c.created_at
        }

    return {
        "sent": [format_collab(c) for c in sent],
        "received": [format_collab(c) for c in received]
    }

@router.patch("/collaborations/{collab_id}/status")
def update_collaboration_status(
    collab_id: str,
    status_str: str,
    current_user: User = Depends(require_roles([UserRole.FACULTY])),
    db: Session = Depends(get_db)
):
    profile = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
    collab = db.query(ResearchCollaboration).filter(
        ResearchCollaboration.id == collab_id,
        ResearchCollaboration.recipient_id == profile.id
    ).first()

    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration request not found")

    if status_str.upper() in ["ACCEPTED", "REJECTED"]:
        collab.status = CollaborationStatus(status_str.upper())
        collab.updated_at = datetime.now(timezone.utc)
        
        # Notify sender
        if collab.sender and collab.sender.user:
            note = Notification(
                user_id=collab.sender.user.id,
                type=NotificationType.COLLABORATION_REQUEST,
                title=f"Collaboration Request {status_str.upper()}",
                message=f"{current_user.full_name} has {status_str.lower()} your collaboration request for '{collab.project_title}'.",
                link="/faculty/collaborations"
            )
            db.add(note)

        db.commit()
        return {"message": f"Collaboration {status_str.lower()} successfully"}
    
    raise HTTPException(status_code=400, detail="Invalid status")

@router.get("/grants")
def list_grants(
    domain: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Grant)
    if domain:
        query = query.filter(Grant.domain.ilike(f"%{domain}%"))

    grants = query.order_by(Grant.deadline.asc()).all()

    bookmarked_ids = set()
    if current_user and current_user.faculty_profile:
        bookmarked_ids = {
            gb.grant_id for gb in db.query(GrantBookmark).filter(GrantBookmark.faculty_id == current_user.faculty_profile.id).all()
        }

    results = []
    for g in grants:
        results.append({
            "id": g.id,
            "title": g.title,
            "funding_agency": g.funding_agency,
            "domain": g.domain,
            "funding_amount": g.funding_amount,
            "deadline": g.deadline,
            "description": g.description,
            "eligibility": g.eligibility,
            "application_url": g.application_url,
            "is_bookmarked": g.id in bookmarked_ids
        })
    return results

@router.post("/grants/{grant_id}/bookmark")
def toggle_grant_bookmark(
    grant_id: str,
    current_user: User = Depends(require_roles([UserRole.FACULTY])),
    db: Session = Depends(get_db)
):
    profile = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    existing = db.query(GrantBookmark).filter(
        GrantBookmark.faculty_id == profile.id,
        GrantBookmark.grant_id == grant_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Grant removed from bookmarks", "is_bookmarked": False}
    else:
        bm = GrantBookmark(faculty_id=profile.id, grant_id=grant_id)
        db.add(bm)
        db.commit()
        return {"message": "Grant bookmarked successfully", "is_bookmarked": True}
