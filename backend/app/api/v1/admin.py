from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_roles
from app.core.audit import record_audit_log
from app.models import (
    User, UserRole, Organization, OrgVerificationStatus,
    Opportunity, Course, Application, AuditLog, Notification, NotificationType
)
from app.schemas import OrganizationVerificationUpdate

router = APIRouter(prefix="/admin", tags=["Platform Admin"])

@router.get("/stats")
def get_platform_stats(
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == UserRole.STUDENT).count()
    total_faculty = db.query(User).filter(User.role == UserRole.FACULTY).count()
    total_institutions = db.query(Organization).filter(Organization.type == "INSTITUTION").count()
    total_industries = db.query(Organization).filter(Organization.type == "INDUSTRY").count()
    pending_verifications = db.query(Organization).filter(Organization.verification_status == OrgVerificationStatus.PENDING).count()
    total_opportunities = db.query(Opportunity).count()
    total_courses = db.query(Course).count()
    total_applications = db.query(Application).count()

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_institutions": total_institutions,
        "total_industries": total_industries,
        "pending_verifications": pending_verifications,
        "total_opportunities": total_opportunities,
        "total_courses": total_courses,
        "total_applications": total_applications
    }

@router.get("/verifications")
def list_pending_verifications(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(Organization)
    if status_filter:
        query = query.filter(Organization.verification_status == status_filter)
    else:
        query = query.order_by(Organization.created_at.desc())

    orgs = query.all()
    results = []
    for o in orgs:
        results.append({
            "id": o.id,
            "name": o.name,
            "type": o.type.value,
            "verification_status": o.verification_status.value,
            "website": o.website,
            "location": o.location,
            "description": o.description,
            "created_at": o.created_at,
            "associated_users_count": len(o.users)
        })
    return results

@router.patch("/verifications/{org_id}")
def update_organization_verification(
    org_id: str,
    req: OrganizationVerificationUpdate,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    old_status = org.verification_status.value
    org.verification_status = req.verification_status
    org.updated_at = datetime.now(timezone.utc)

    # Notify all users belonging to this organization
    for u in org.users:
        note = Notification(
            user_id=u.id,
            type=NotificationType.SYSTEM,
            title="Organization Verification Update",
            message=f"Your organization '{org.name}' status has been updated to: {req.verification_status.value}."
        )
        db.add(note)

    record_audit_log(
        db=db,
        action="ORGANIZATION_VERIFICATION_UPDATED",
        entity_type="ORGANIZATION",
        entity_id=org.id,
        user_id=current_user.id,
        details={"org_name": org.name, "old_status": old_status, "new_status": req.verification_status.value, "reason": req.reason}
    )

    db.commit()
    return {"message": f"Organization status updated to {req.verification_status.value}"}

@router.get("/users")
def list_users(
    role: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    
    users = query.order_by(User.created_at.desc()).all()
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "organization_name": u.organization.name if u.organization else None,
            "created_at": u.created_at
        })
    return results

@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: str,
    is_active: bool,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = is_active
    record_audit_log(
        db=db,
        action="USER_STATUS_TOGGLED",
        entity_type="USER",
        entity_id=user.id,
        user_id=current_user.id,
        details={"email": user.email, "is_active": is_active}
    )
    db.commit()
    return {"message": f"User active status set to {is_active}"}

@router.get("/audit-logs")
def get_audit_logs(
    action: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "user_email": l.user.email if l.user else "System",
            "details_json": l.details_json,
            "created_at": l.created_at
        })
    return results

@router.get("/database/overview")
def get_database_overview(
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    from app.models import StudentProfile, FacultyProfile, IndustryProfile, CompetencyProfile

    # 1. Students Table
    students = db.query(StudentProfile).all()
    students_data = []
    for s in students:
        competencies = db.query(CompetencyProfile).filter(CompetencyProfile.student_id == s.id).all()
        avg_score = (sum(c.score for c in competencies) / len(competencies)) if competencies else 0.0
        students_data.append({
            "id": s.id,
            "user_id": s.user_id,
            "full_name": s.user.full_name if s.user else "Unknown",
            "email": s.user.email if s.user else "Unknown",
            "institution": s.user.organization.name if (s.user and s.user.organization) else "Independent",
            "degree": s.degree,
            "department": s.department,
            "semester": s.semester,
            "cgpa": s.cgpa,
            "target_career": s.target_career,
            "assessed_competencies_count": len(competencies),
            "average_competency": round(avg_score, 1),
            "created_at": s.created_at
        })

    # 2. Faculty Table
    faculty = db.query(FacultyProfile).all()
    faculty_data = []
    for f in faculty:
        faculty_data.append({
            "id": f.id,
            "user_id": f.user_id,
            "full_name": f.user.full_name if f.user else "Unknown",
            "email": f.user.email if f.user else "Unknown",
            "institution": f.user.organization.name if (f.user and f.user.organization) else "Independent",
            "department": f.department,
            "designation": f.designation,
            "research_interests": f.research_interests,
            "orcid_id": f.orcid_id,
            "created_at": f.created_at
        })

    # 3. Institutions Table
    institutions = db.query(Organization).filter(Organization.type == "INSTITUTION").all()
    institutions_data = []
    for inst in institutions:
        students_count = sum(1 for u in inst.users if u.role == UserRole.STUDENT)
        faculty_count = sum(1 for u in inst.users if u.role == UserRole.FACULTY)
        institutions_data.append({
            "id": inst.id,
            "name": inst.name,
            "verification_status": inst.verification_status.value,
            "location": inst.location,
            "website": inst.website,
            "students_count": students_count,
            "faculty_count": faculty_count,
            "created_at": inst.created_at
        })

    # 4. Companies / Industry Table
    companies = db.query(Organization).filter(Organization.type == "INDUSTRY").all()
    companies_data = []
    for comp in companies:
        opps_count = db.query(Opportunity).filter(Opportunity.organization_id == comp.id).count()
        companies_data.append({
            "id": comp.id,
            "name": comp.name,
            "verification_status": comp.verification_status.value,
            "location": comp.location,
            "website": comp.website,
            "opportunities_posted": opps_count,
            "recruiters_count": len(comp.users),
            "created_at": comp.created_at
        })

    # 5. All User Accounts & Logins
    all_users = db.query(User).order_by(User.created_at.desc()).all()
    users_data = []
    for u in all_users:
        last_audit = db.query(AuditLog).filter(AuditLog.user_id == u.id).order_by(AuditLog.created_at.desc()).first()
        users_data.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.value,
            "is_active": u.is_active,
            "organization_name": u.organization.name if u.organization else "Independent",
            "last_action": last_audit.action if last_audit else "REGISTERED",
            "last_active": last_audit.created_at if last_audit else u.created_at,
            "created_at": u.created_at
        })

    return {
        "students": students_data,
        "faculty": faculty_data,
        "institutions": institutions_data,
        "companies": companies_data,
        "users": users_data
    }

