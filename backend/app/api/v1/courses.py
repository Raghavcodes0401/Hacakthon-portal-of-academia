from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.core.audit import record_audit_log
from app.models import (
    User, UserRole, Course, CourseModule, CourseResource, CourseEnrollment,
    ExternalResource, CourseStatus, EnrollmentStatus, FacultyProfile, StudentProfile
)
from app.schemas import (
    CourseCreate, CourseOut, CourseModuleCreate, CourseResourceCreate,
    CourseEnrollmentOut
)

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("")
def list_courses(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Course).filter(Course.status == CourseStatus.PUBLISHED)
    if category:
        query = query.filter(Course.category.ilike(f"%{category}%"))
    if difficulty:
        query = query.filter(Course.difficulty == difficulty)
    if search:
        query = query.filter(Course.title.ilike(f"%{search}%") | Course.description.ilike(f"%{search}%"))
    
    courses = query.order_by(Course.created_at.desc()).all()
    results = []
    for c in courses:
        results.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "difficulty": c.difficulty.value,
            "duration_weeks": c.duration_weeks,
            "skills_json": c.skills_json or [],
            "status": c.status.value,
            "thumbnail_url": c.thumbnail_url,
            "organization_name": c.organization.name if c.organization else "Autonomous Institute",
            "faculty_name": c.faculty.user.full_name if (c.faculty and c.faculty.user) else "Course Instructor",
            "enrollment_count": len(c.enrollments),
            "modules_count": len(c.modules)
        })
    return results

@router.get("/{course_id}")
def get_course(course_id: str, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    modules_data = []
    for m in course.modules:
        resources_data = [
            {
                "id": r.id,
                "title": r.title,
                "resource_type": r.resource_type.value,
                "url": r.url,
                "description": r.description
            }
            for r in m.resources
        ]
        modules_data.append({
            "id": m.id,
            "module_order": m.module_order,
            "title": m.title,
            "description": m.description,
            "resources": resources_data
        })

    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "category": course.category,
        "difficulty": course.difficulty.value,
        "duration_weeks": course.duration_weeks,
        "skills_json": course.skills_json or [],
        "prerequisites": course.prerequisites,
        "status": course.status.value,
        "thumbnail_url": course.thumbnail_url,
        "organization_name": course.organization.name if course.organization else "Institution",
        "faculty_name": course.faculty.user.full_name if (course.faculty and course.faculty.user) else "Faculty Instructor",
        "enrollment_count": len(course.enrollments),
        "modules": modules_data
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_course(
    req: CourseCreate,
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.INSTITUTION_ADMIN, UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization to create courses")

    faculty_id = current_user.faculty_profile.id if current_user.faculty_profile else None

    new_course = Course(
        organization_id=current_user.organization_id,
        faculty_id=faculty_id,
        title=req.title.strip(),
        description=req.description.strip(),
        category=req.category,
        difficulty=req.difficulty,
        duration_weeks=req.duration_weeks,
        skills_json=req.skills_json,
        prerequisites=req.prerequisites,
        status=req.status
    )
    db.add(new_course)
    db.flush()

    # Add initial modules and resources if supplied
    for idx, mod in enumerate(req.modules, start=1):
        m_obj = CourseModule(
            course_id=new_course.id,
            module_order=mod.module_order or idx,
            title=mod.title.strip(),
            description=mod.description
        )
        db.add(m_obj)
        db.flush()
        for res in mod.resources:
            r_obj = CourseResource(
                module_id=m_obj.id,
                title=res.title.strip(),
                resource_type=res.resource_type,
                url=res.url.strip(),
                description=res.description
            )
            db.add(r_obj)

    record_audit_log(
        db=db,
        action="COURSE_CREATED",
        entity_type="COURSE",
        entity_id=new_course.id,
        user_id=current_user.id,
        details={"title": new_course.title, "modules": len(req.modules)}
    )

    db.commit()
    db.refresh(new_course)

    return {"message": "Course created successfully", "course_id": new_course.id}

@router.post("/{course_id}/modules")
def add_module_to_course(
    course_id: str,
    req: CourseModuleCreate,
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.INSTITUTION_ADMIN, UserRole.PLATFORM_ADMIN])),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    m_obj = CourseModule(
        course_id=course.id,
        module_order=req.module_order or (len(course.modules) + 1),
        title=req.title.strip(),
        description=req.description
    )
    db.add(m_obj)
    db.flush()

    for res in req.resources:
        r_obj = CourseResource(
            module_id=m_obj.id,
            title=res.title.strip(),
            resource_type=res.resource_type,
            url=res.url.strip(),
            description=res.description
        )
        db.add(r_obj)

    db.commit()
    return {"message": "Module added successfully", "module_id": m_obj.id}

@router.post("/{course_id}/enroll")
def enroll_in_course(
    course_id: str,
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == student.id,
        CourseEnrollment.course_id == course_id
    ).first()

    if existing:
        return {"message": "Already enrolled in this course", "enrollment_id": existing.id}

    enrollment = CourseEnrollment(
        student_id=student.id,
        course_id=course_id,
        progress_percentage=0.0,
        status=EnrollmentStatus.ENROLLED,
        enrolled_at=datetime.now(timezone.utc)
    )
    db.add(enrollment)
    db.commit()
    return {"message": "Successfully enrolled in course", "enrollment_id": enrollment.id}

@router.get("/my/enrollments")
def get_my_course_enrollments(
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student:
        return []

    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == student.id).all()
    results = []
    for e in enrollments:
        c = e.course
        results.append({
            "id": e.id,
            "course_id": e.course_id,
            "course_title": c.title if c else "Course",
            "institution": c.organization.name if (c and c.organization) else "Autonomous Institute",
            "category": c.category if c else "Computer Science",
            "progress_percentage": e.progress_percentage,
            "status": e.status.value,
            "enrolled_at": e.enrolled_at,
            "total_modules": len(c.modules) if c else 0
        })
    return results

@router.get("/external/resources")
def list_external_resources(
    skill: Optional[str] = None,
    provider: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ExternalResource)
    if provider:
        query = query.filter(ExternalResource.provider.ilike(f"%{provider}%"))
    resources = query.all()
    results = []
    for r in resources:
        results.append({
            "id": r.id,
            "title": r.title,
            "provider": r.provider,
            "url": r.url,
            "resource_type": r.resource_type,
            "skill": r.skill.name if r.skill else "General Technology",
            "description": r.description
        })
    return results
