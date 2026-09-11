from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles, require_verified_org
from app.core.audit import record_audit_log
from app.models import (
    User, UserRole, Opportunity, Application, CandidateMatch,
    StudentProfile, OpportunityStatus, ApplicationStatus, OrgVerificationStatus,
    Notification, NotificationType
)
from app.schemas import (
    OpportunityCreate, OpportunityOut, AnalyzeRequirementsRequest,
    AnalyzedRequirementsResponse, ApplicationCreate, ApplicationStatusUpdate,
    ApplicationOut, CandidateMatchExplainableOut
)
from app.ai.requirement_extractor import extract_requirements_from_text
from app.ai.candidate_matcher import match_candidates_for_opportunity, calculate_candidate_match

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

@router.get("")
def list_opportunities(
    type: Optional[str] = None,
    work_mode: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Opportunity).filter(Opportunity.status == OpportunityStatus.OPEN)
    if type:
        query = query.filter(Opportunity.type == type)
    if work_mode:
        query = query.filter(Opportunity.work_mode == work_mode)
    if search:
        query = query.filter(Opportunity.title.ilike(f"%{search}%") | Opportunity.description.ilike(f"%{search}%"))

    opportunities = query.order_by(Opportunity.created_at.desc()).all()
    
    # Check student application status
    applied_opp_ids = set()
    if current_user and current_user.role == UserRole.STUDENT and current_user.student_profile:
        applied_opp_ids = {
            a.opportunity_id for a in current_user.student_profile.applications
        }

    results = []
    for o in opportunities:
        results.append({
            "id": o.id,
            "organization_id": o.organization_id,
            "organization_name": o.organization.name if o.organization else "Enterprise Partner",
            "organization_verified": (o.organization.verification_status == OrgVerificationStatus.VERIFIED) if o.organization else False,
            "type": o.type.value,
            "title": o.title,
            "description": o.description,
            "raw_job_description": o.raw_job_description,
            "location": o.location,
            "work_mode": o.work_mode.value,
            "salary_or_stipend": o.salary_or_stipend,
            "min_cgpa": o.min_cgpa,
            "eligible_branches": o.eligible_branches,
            "required_skills_json": o.required_skills_json or [],
            "preferred_skills_json": o.preferred_skills_json or [],
            "experience_required": o.experience_required,
            "deadline": o.deadline,
            "status": o.status.value,
            "created_at": o.created_at,
            "has_applied": o.id in applied_opp_ids
        })
    return results

@router.get("/{opp_id}")
def get_opportunity(opp_id: str, db: Session = Depends(get_db)):
    o = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    return {
        "id": o.id,
        "organization_id": o.organization_id,
        "organization_name": o.organization.name if o.organization else "Enterprise Partner",
        "organization_verified": (o.organization.verification_status == OrgVerificationStatus.VERIFIED) if o.organization else False,
        "type": o.type.value,
        "title": o.title,
        "description": o.description,
        "raw_job_description": o.raw_job_description,
        "location": o.location,
        "work_mode": o.work_mode.value,
        "salary_or_stipend": o.salary_or_stipend,
        "min_cgpa": o.min_cgpa,
        "eligible_branches": o.eligible_branches,
        "required_skills_json": o.required_skills_json or [],
        "preferred_skills_json": o.preferred_skills_json or [],
        "experience_required": o.experience_required,
        "deadline": o.deadline,
        "status": o.status.value,
        "created_at": o.created_at
    }

@router.post("/analyze-requirements", response_model=AnalyzedRequirementsResponse)
def analyze_job_requirements(
    req: AnalyzeRequirementsRequest,
    current_user: User = Depends(require_roles([UserRole.INDUSTRY_USER, UserRole.PLATFORM_ADMIN]))
):
    if not req.raw_job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty")
    
    result = extract_requirements_from_text(req.raw_job_description)
    return AnalyzedRequirementsResponse(
        title=result.get("title"),
        type=result.get("type", "INTERNSHIP"),
        required_skills=result.get("required_skills", []),
        preferred_skills=result.get("preferred_skills", []),
        eligible_branches=result.get("eligible_branches", "Computer Science, IT"),
        min_cgpa=result.get("min_cgpa", 7.0),
        experience_required=result.get("experience_required", "Fresher / 0-1 Year"),
        work_mode=result.get("work_mode", "HYBRID"),
        summary=result.get("summary", "Requirements extracted successfully.")
    )

@router.post("", status_code=status.HTTP_201_CREATED)
def create_opportunity(
    req: OpportunityCreate,
    current_user: User = Depends(require_verified_org),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.INDUSTRY_USER, UserRole.PLATFORM_ADMIN]:
        raise HTTPException(status_code=403, detail="Only verified industry organizations or admins can post opportunities")

    opp = Opportunity(
        organization_id=current_user.organization_id,
        type=req.type,
        title=req.title.strip(),
        description=req.description.strip(),
        raw_job_description=req.raw_job_description,
        location=req.location,
        work_mode=req.work_mode,
        salary_or_stipend=req.salary_or_stipend,
        min_cgpa=req.min_cgpa,
        eligible_branches=req.eligible_branches,
        required_skills_json=req.required_skills_json,
        preferred_skills_json=req.preferred_skills_json,
        experience_required=req.experience_required,
        deadline=req.deadline,
        status=OpportunityStatus.OPEN
    )
    db.add(opp)
    db.flush()

    # Pre-calculate candidate matches
    match_candidates_for_opportunity(db, opp)

    record_audit_log(
        db=db,
        action="OPPORTUNITY_PUBLISHED",
        entity_type="OPPORTUNITY",
        entity_id=opp.id,
        user_id=current_user.id,
        details={"title": opp.title, "type": opp.type.value}
    )

    db.commit()
    db.refresh(opp)

    return {"message": "Opportunity published successfully", "opportunity_id": opp.id}

@router.get("/{opp_id}/matches", response_model=List[CandidateMatchExplainableOut])
def get_opportunity_candidate_matches(
    opp_id: str,
    current_user: User = Depends(require_roles([UserRole.INDUSTRY_USER, UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    matches = db.query(CandidateMatch).filter(CandidateMatch.opportunity_id == opp.id).order_by(CandidateMatch.match_percentage.desc()).all()
    if not matches:
        matches = match_candidates_for_opportunity(db, opp)

    results = []
    for m in matches:
        st = m.student
        if not st or not st.user:
            continue
        
        # Check if student applied
        app = db.query(Application).filter(
            Application.opportunity_id == opp.id,
            Application.student_id == st.id
        ).first()

        expl = m.explanation_json or {}
        results.append(CandidateMatchExplainableOut(
            student_id=st.id,
            student_name=st.user.full_name,
            student_email=st.user.email,
            degree=st.degree,
            department=st.department,
            cgpa=st.cgpa,
            match_percentage=m.match_percentage,
            skill_score=m.skill_score,
            eligibility_score=m.eligibility_score,
            assessment_score=m.assessment_score,
            strong_matches=expl.get("strong_matches", []),
            skill_gaps=expl.get("skill_gaps", []),
            evidence_explanation=expl.get("evidence_explanation", "Candidate matches based on academic and skill criteria."),
            application_status=app.status if app else None,
            application_id=app.id if app else None
        ))
    return results

@router.post("/{opp_id}/apply")
def apply_to_opportunity(
    opp_id: str,
    req: ApplicationCreate,
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp or opp.status != OpportunityStatus.OPEN:
        raise HTTPException(status_code=404, detail="Opportunity not available for application")

    existing = db.query(Application).filter(
        Application.opportunity_id == opp.id,
        Application.student_id == student.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this opportunity")

    app = Application(
        opportunity_id=opp.id,
        student_id=student.id,
        status=ApplicationStatus.APPLIED,
        cover_letter=req.cover_letter,
        resume_url=req.resume_url or student.resume_url,
        applied_at=datetime.now(timezone.utc)
    )
    db.add(app)

    # Notify student
    note = Notification(
        user_id=current_user.id,
        type=NotificationType.APPLICATION_UPDATE,
        title="Application Submitted",
        message=f"You successfully applied for {opp.title} at {opp.organization.name if opp.organization else 'Partner'}.",
        link="/student/applications"
    )
    db.add(note)

    record_audit_log(
        db=db,
        action="APPLICATION_SUBMITTED",
        entity_type="APPLICATION",
        entity_id=app.id,
        user_id=current_user.id,
        details={"opportunity_title": opp.title}
    )

    db.commit()
    return {"message": "Application submitted successfully", "application_id": app.id}

@router.get("/{opp_id}/applications", response_model=List[ApplicationOut])
def get_opportunity_applications(
    opp_id: str,
    current_user: User = Depends(require_roles([UserRole.INDUSTRY_USER, UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    apps = db.query(Application).filter(Application.opportunity_id == opp.id).order_by(Application.applied_at.desc()).all()
    results = []
    for a in apps:
        st = a.student
        match_rec = next((m for m in opp.matches if m.student_id == st.id), None)
        results.append(ApplicationOut(
            id=a.id,
            opportunity_id=a.opportunity_id,
            opportunity_title=opp.title,
            organization_name=opp.organization.name if opp.organization else "Organization",
            student_id=st.id,
            student_name=st.user.full_name if (st and st.user) else "Student",
            student_email=st.user.email if (st and st.user) else "",
            student_cgpa=st.cgpa if st else 0.0,
            student_department=st.department if st else "",
            status=a.status,
            cover_letter=a.cover_letter,
            applied_at=a.applied_at,
            match_percentage=match_rec.match_percentage if match_rec else 85.0
        ))
    return results

@router.patch("/applications/{app_id}/status")
def update_application_status(
    app_id: str,
    req: ApplicationStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.INDUSTRY_USER, UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = app.status.value
    app.status = req.status
    app.updated_at = datetime.now(timezone.utc)

    # Notify student
    student_user_id = app.student.user_id if app.student else None
    if student_user_id:
        note = Notification(
            user_id=student_user_id,
            type=NotificationType.APPLICATION_UPDATE,
            title="Application Status Updated",
            message=f"Your application for {app.opportunity.title} is now: {req.status.value.replace('_', ' ').title()}.",
            link="/student/applications"
        )
        db.add(note)

    record_audit_log(
        db=db,
        action="APPLICATION_STATUS_CHANGED",
        entity_type="APPLICATION",
        entity_id=app.id,
        user_id=current_user.id,
        details={"old_status": old_status, "new_status": req.status.value}
    )

    db.commit()
    return {"message": f"Application status updated to {req.status.value}"}
