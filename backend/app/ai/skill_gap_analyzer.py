from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import StudentProfile, CompetencyProfile, SkillGap, Skill, GapSeverity

CAREER_REQUIREMENTS: Dict[str, Dict[str, float]] = {
    "Backend Engineer": {
        "Python": 80.0,
        "SQL": 75.0,
        "FastAPI": 75.0,
        "Data Structures": 75.0,
        "Docker": 70.0,
        "System Design": 65.0,
        "Git": 75.0
    },
    "Data Scientist": {
        "Python": 85.0,
        "Machine Learning": 80.0,
        "SQL": 75.0,
        "Statistics": 75.0,
        "Data Structures": 65.0,
        "Deep Learning": 60.0
    },
    "Full Stack Developer": {
        "JavaScript": 85.0,
        "TypeScript": 80.0,
        "React": 80.0,
        "Node.js": 75.0,
        "SQL": 70.0,
        "Git": 75.0
    },
    "Cloud & DevOps Engineer": {
        "Linux": 85.0,
        "Docker": 80.0,
        "Kubernetes": 75.0,
        "CI/CD": 75.0,
        "Python": 70.0,
        "Git": 80.0
    }
}

def analyze_student_skill_gaps(db: Session, student: StudentProfile) -> List[SkillGap]:
    target_role = student.target_career or "Backend Engineer"
    required_skills = CAREER_REQUIREMENTS.get(target_role, CAREER_REQUIREMENTS["Backend Engineer"])

    # Fetch current competencies
    competencies = {
        cp.skill.name: cp.score
        for cp in student.competency_profiles
        if cp.skill
    }

    # Remove existing gaps for clean refresh
    db.query(SkillGap).filter(SkillGap.student_id == student.id).delete()

    created_gaps = []
    for skill_name, req_score in required_skills.items():
        curr_score = competencies.get(skill_name, 0.0)
        gap_diff = req_score - curr_score

        if curr_score >= req_score:
            severity = GapSeverity.SUFFICIENT
            rec_action = f"Maintain strong proficiency with advanced projects."
        elif curr_score >= (req_score - 15.0):
            severity = GapSeverity.MINOR
            rec_action = f"Review intermediate concepts and complete 1-2 practical exercises."
        elif curr_score >= (req_score - 35.0):
            severity = GapSeverity.MODERATE
            rec_action = f"Enroll in foundational coursework and complete structured lab modules."
        else:
            severity = GapSeverity.CRITICAL
            rec_action = f"Critical requirement for {target_role}. Begin comprehensive guided learning immediately."

        skill_obj = db.query(Skill).filter(Skill.name == skill_name).first()
        if not skill_obj:
            # Create skill on the fly if needed
            from app.models import SkillCategory
            cat = db.query(SkillCategory).first()
            skill_obj = Skill(name=skill_name, category_id=cat.id if cat else "default")
            db.add(skill_obj)
            db.flush()

        gap = SkillGap(
            student_id=student.id,
            skill_id=skill_obj.id,
            current_score=curr_score,
            required_score=req_score,
            gap_severity=severity,
            target_role=target_role,
            recommended_action=rec_action
        )
        db.add(gap)
        created_gaps.append(gap)

    db.commit()
    return created_gaps
