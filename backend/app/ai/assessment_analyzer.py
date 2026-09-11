from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import (
    Assessment, AssessmentAttempt, AssessmentResponse, Question, QuestionOption,
    CompetencyProfile, StudentSkill, Skill, SkillSource, SkillProficiency
)
from app.ai.provider import get_ai_provider

def evaluate_attempt_responses(
    db: Session,
    attempt: AssessmentAttempt,
    submissions: List[Dict[str, Any]]
) -> Tuple[float, float, float, Dict[str, float], Dict[str, Any]]:
    """
    Deterministically evaluates student assessment responses.
    Calculates total score, percentage, and per-skill competency breakdown.
    Generates grounded AI feedback report.
    """
    total_score = 0.0
    max_score = 0.0
    skill_points_earned: Dict[str, float] = {}
    skill_points_max: Dict[str, float] = {}

    sub_map = {s["question_id"]: s for s in submissions}

    # Fetch all questions for this assessment
    questions = db.query(Question).filter(Question.assessment_id == attempt.assessment_id).all()
    
    for q in questions:
        max_score += q.points
        skill_name = q.skill.name if q.skill else "General"
        skill_points_max[skill_name] = skill_points_max.get(skill_name, 0.0) + q.points

        sub = sub_map.get(q.id)
        is_correct = False
        points_awarded = 0.0
        selected_option_ids = []
        code_sub = None
        time_taken = 0

        if sub:
            selected_option_ids = sub.get("selected_option_ids", [])
            code_sub = sub.get("code_submission")
            time_taken = sub.get("time_taken_seconds", 0)

            # Check correct options
            correct_opts = [opt.id for opt in q.options if opt.is_correct]
            if set(selected_option_ids) == set(correct_opts) and len(correct_opts) > 0:
                is_correct = True
                points_awarded = float(q.points)
            elif code_sub and q.question_type.value in ["CODE_OUTPUT", "SQL"]:
                # Basic code submission verification
                if len(code_sub.strip()) > 10:
                    is_correct = True
                    points_awarded = float(q.points)

        total_score += points_awarded
        skill_points_earned[skill_name] = skill_points_earned.get(skill_name, 0.0) + points_awarded

        # Record response
        resp = AssessmentResponse(
            attempt_id=attempt.id,
            question_id=q.id,
            selected_option_ids=selected_option_ids,
            code_submission=code_sub,
            is_correct=is_correct,
            points_awarded=points_awarded,
            time_taken_seconds=time_taken
        )
        db.add(resp)

    score_percentage = (total_score / max_score * 100.0) if max_score > 0 else 0.0
    
    # Calculate percentage per skill
    skill_breakdown = {}
    for skill, max_p in skill_points_max.items():
        earned = skill_points_earned.get(skill, 0.0)
        skill_breakdown[skill] = round((earned / max_p * 100.0), 1) if max_p > 0 else 0.0

    # Update or insert CompetencyProfile and StudentSkill for the student
    for skill_name, score in skill_breakdown.items():
        skill_obj = db.query(Skill).filter(Skill.name == skill_name).first()
        if skill_obj:
            comp = db.query(CompetencyProfile).filter(
                CompetencyProfile.student_id == attempt.student_id,
                CompetencyProfile.skill_id == skill_obj.id
            ).first()
            if comp:
                # Weighted average with historical attempts
                comp.score = round((comp.score * comp.assessment_count + score) / (comp.assessment_count + 1), 1)
                comp.assessment_count += 1
            else:
                comp = CompetencyProfile(
                    student_id=attempt.student_id,
                    skill_id=skill_obj.id,
                    score=score,
                    assessment_count=1
                )
                db.add(comp)

            # Update student skill entry as AI_ASSESSED
            stud_skill = db.query(StudentSkill).filter(
                StudentSkill.student_id == attempt.student_id,
                StudentSkill.skill_id == skill_obj.id
            ).first()
            prof = SkillProficiency.BEGINNER if score < 50 else (SkillProficiency.INTERMEDIATE if score < 80 else SkillProficiency.ADVANCED)
            if stud_skill:
                stud_skill.source = SkillSource.AI_ASSESSED
                stud_skill.score = comp.score
                stud_skill.proficiency = prof
            else:
                stud_skill = StudentSkill(
                    student_id=attempt.student_id,
                    skill_id=skill_obj.id,
                    proficiency=prof,
                    source=SkillSource.AI_ASSESSED,
                    score=score
                )
                db.add(stud_skill)

    # Generate Grounded AI Feedback
    ai_provider = get_ai_provider()
    target_role = attempt.student.target_career or "Backend Engineer"
    ai_feedback = ai_provider.generate_swot_analysis(skill_breakdown, target_role)

    return total_score, max_score, score_percentage, skill_breakdown, ai_feedback
