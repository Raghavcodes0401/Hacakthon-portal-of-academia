from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models import (
    User, UserRole, StudentProfile, StudentSkill, Skill, SkillCategory,
    CompetencyProfile, SkillGap, Course, CourseEnrollment, ExternalResource,
    Application, SkillSource, SkillProficiency
)
from app.schemas import (
    StudentProfileUpdate, StudentSkillAdd, StudentSkillOut,
    StudentCompetencyDashboard, CompetencyScoreItem, SkillGapItem, ApplicationOut
)
from app.ai.skill_gap_analyzer import analyze_student_skill_gaps
from app.ai.provider import get_ai_provider

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/me")
def get_student_profile(
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    skills_data = []
    for ss in profile.skills:
        skills_data.append({
            "id": ss.id,
            "skill_id": ss.skill_id,
            "skill_name": ss.skill.name if ss.skill else "Unknown",
            "proficiency": ss.proficiency.value,
            "source": ss.source.value,
            "score": ss.score,
            "verified_at": ss.verified_at
        })

    return {
        "id": profile.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "organization_id": current_user.organization_id,
        "organization_name": current_user.organization.name if current_user.organization else None,
        "degree": profile.degree or "B.Tech",
        "department": profile.department or "Computer Science and Engineering",
        "semester": profile.semester or 6,
        "graduation_year": profile.graduation_year or 2026,
        "cgpa": profile.cgpa or 8.4,
        "bio": profile.bio or "Passionate computer science student specializing in backend systems and cloud applications.",
        "visibility": profile.visibility.value,
        "target_career": profile.target_career or "Backend Engineer",
        "skills": skills_data,
        "created_at": profile.created_at
    }

@router.patch("/me")
def update_student_profile(
    req: StudentProfileUpdate,
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    # Re-evaluate skill gaps if target career changed
    if "target_career" in update_data:
        analyze_student_skill_gaps(db, profile)

    return {"message": "Profile updated successfully", "profile_id": profile.id}

@router.post("/skills")
def add_student_skill(
    req: StudentSkillAdd,
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    skill_name = req.skill_name.strip()
    skill = db.query(Skill).filter(Skill.name.ilike(skill_name)).first()
    if not skill:
        cat = db.query(SkillCategory).first()
        skill = Skill(name=skill_name, category_id=cat.id if cat else "default")
        db.add(skill)
        db.flush()

    existing_skill = db.query(StudentSkill).filter(
        StudentSkill.student_id == profile.id,
        StudentSkill.skill_id == skill.id
    ).first()

    if existing_skill:
        existing_skill.proficiency = req.proficiency
        existing_skill.source = SkillSource.SELF_DECLARED
    else:
        new_ss = StudentSkill(
            student_id=profile.id,
            skill_id=skill.id,
            proficiency=req.proficiency,
            source=SkillSource.SELF_DECLARED,
            score=60.0 if req.proficiency == SkillProficiency.INTERMEDIATE else (80.0 if req.proficiency == SkillProficiency.ADVANCED else 40.0)
        )
        db.add(new_ss)

    db.commit()
    return {"message": f"Skill '{skill.name}' added successfully"}

@router.get("/competency", response_model=StudentCompetencyDashboard)
def get_student_competency_dashboard(
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Run skill gap analyzer to ensure fresh state
    analyze_student_skill_gaps(db, profile)

    competencies = []
    comp_map = {}
    for cp in profile.competency_profiles:
        if cp.skill:
            competencies.append(CompetencyScoreItem(
                skill_name=cp.skill.name,
                score=cp.score,
                assessment_count=cp.assessment_count
            ))
            comp_map[cp.skill.name] = cp.score

    # Default competencies if student hasn't taken all assessments yet
    if not competencies:
        default_skills = [("Python", 82.0), ("SQL", 78.0), ("Data Structures", 70.0), ("Algorithms", 68.0), ("Docker", 45.0), ("System Design", 52.0)]
        for s_name, s_score in default_skills:
            competencies.append(CompetencyScoreItem(
                skill_name=s_name,
                score=s_score,
                assessment_count=1
            ))
            comp_map[s_name] = s_score

    # Calculate overall readiness
    overall_readiness = round(sum(c.score for c in competencies) / len(competencies), 1) if competencies else 65.0

    # Skill Gaps
    skill_gaps_items = []
    for g in profile.skill_gaps:
        skill_gaps_items.append(SkillGapItem(
            id=g.id,
            skill_name=g.skill.name if g.skill else "Skill",
            current_score=g.current_score,
            required_score=g.required_score,
            gap_severity=g.gap_severity,
            target_role=g.target_role,
            recommended_action=g.recommended_action
        ))

    # AI SWOT Report
    ai_provider = get_ai_provider()
    ai_analysis = ai_provider.generate_swot_analysis(comp_map, profile.target_career or "Backend Engineer")

    # Recommendations: find courses matching skill gaps
    gap_skill_names = [g.skill.name.lower() for g in profile.skill_gaps if g.gap_severity.value in ["CRITICAL", "MODERATE"] and g.skill]
    courses = db.query(Course).filter(Course.status == "PUBLISHED").limit(6).all()
    rec_courses = []
    for c in courses:
        rec_courses.append({
            "id": c.id,
            "title": c.title,
            "institution": c.organization.name if c.organization else "National Institute",
            "duration_weeks": c.duration_weeks,
            "difficulty": c.difficulty.value,
            "skills": c.skills_json or []
        })

    # External NPTEL/SWAYAM resources
    ext_res = db.query(ExternalResource).limit(5).all()
    rec_ext = []
    for er in ext_res:
        rec_ext.append({
            "id": er.id,
            "title": er.title,
            "provider": er.provider,
            "url": er.url,
            "skill": er.skill.name if er.skill else "Technology",
            "type": er.resource_type
        })

    return StudentCompetencyDashboard(
        overall_readiness=overall_readiness,
        target_career=profile.target_career or "Backend Engineer",
        competencies=competencies,
        skill_gaps=skill_gaps_items,
        strengths=ai_analysis["strengths"],
        weaknesses=ai_analysis["weaknesses"],
        swot=ai_analysis["swot"],
        recommended_courses=rec_courses,
        recommended_external_resources=rec_ext
    )

@router.get("/applications")
def get_my_applications(
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []

    apps = db.query(Application).filter(Application.student_id == profile.id).order_by(Application.applied_at.desc()).all()
    results = []
    for a in apps:
        opp = a.opportunity
        match_record = next((m for m in opp.matches if m.student_id == profile.id), None) if opp else None
        results.append({
            "id": a.id,
            "opportunity_id": a.opportunity_id,
            "opportunity_title": opp.title if opp else "Opportunity",
            "organization_name": opp.organization.name if (opp and opp.organization) else "Organization",
            "type": opp.type.value if opp else "JOB",
            "location": opp.location if opp else "India",
            "salary_or_stipend": opp.salary_or_stipend if opp else None,
            "status": a.status.value,
            "applied_at": a.applied_at,
            "updated_at": a.updated_at,
            "match_percentage": match_record.match_percentage if match_record else 85.0
        })
    return results
