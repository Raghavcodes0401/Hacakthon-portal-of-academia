from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models import (
    User, UserRole, StudentProfile, Assessment, AssessmentAttempt,
    Question, QuestionOption, AttemptStatus, Notification, NotificationType
)
from app.schemas import (
    AssessmentOut, QuestionOut, QuestionOptionOut, StartAttemptResponse,
    SubmitAssessmentRequest, AssessmentResultOut
)
from app.ai.assessment_analyzer import evaluate_attempt_responses

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.get("", response_model=List[AssessmentOut])
def list_assessments(
    category: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Assessment).filter(Assessment.is_active == True)
    if category:
        query = query.filter(Assessment.category.ilike(f"%{category}%"))
    return query.all()

@router.get("/{assessment_id}", response_model=AssessmentOut)
def get_assessment(assessment_id: str, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.post("/{assessment_id}/attempts", response_model=StartAttemptResponse)
def start_assessment_attempt(
    assessment_id: str,
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Create new attempt
    attempt = AssessmentAttempt(
        student_id=student.id,
        assessment_id=assessment.id,
        started_at=datetime.now(timezone.utc),
        status=AttemptStatus.IN_PROGRESS
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Format questions safely (mask is_correct)
    question_outs = []
    for q in assessment.questions:
        options = [
            QuestionOptionOut(id=opt.id, option_text=opt.option_text)
            for opt in q.options
        ]
        question_outs.append(QuestionOut(
            id=q.id,
            skill_id=q.skill_id,
            skill_name=q.skill.name if q.skill else None,
            question_text=q.question_text,
            question_type=q.question_type,
            difficulty=q.difficulty,
            points=q.points,
            code_snippet=q.code_snippet,
            options=options
        ))

    return StartAttemptResponse(
        attempt_id=attempt.id,
        assessment=AssessmentOut.model_validate(assessment),
        questions=question_outs,
        started_at=attempt.started_at,
        duration_minutes=assessment.duration_minutes
    )

@router.post("/attempts/{attempt_id}/submit", response_model=AssessmentResultOut)
def submit_assessment_attempt(
    attempt_id: str,
    req: SubmitAssessmentRequest,
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.id == attempt_id,
        AssessmentAttempt.student_id == student.id
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Assessment attempt not found")
    
    if attempt.status == AttemptStatus.EVALUATED:
        raise HTTPException(status_code=400, detail="This assessment has already been submitted and evaluated")

    # Deterministic scoring and competency update
    submissions = [s.model_dump() for s in req.responses]
    total_score, max_score, score_pct, skill_breakdown, ai_feedback = evaluate_attempt_responses(
        db=db,
        attempt=attempt,
        submissions=submissions
    )

    attempt.total_score = total_score
    attempt.max_possible_score = max_score
    attempt.score_percentage = score_pct
    attempt.completed_at = datetime.now(timezone.utc)
    attempt.status = AttemptStatus.EVALUATED
    attempt.ai_feedback_json = ai_feedback

    # Send Notification
    note = Notification(
        user_id=current_user.id,
        type=NotificationType.ASSESSMENT_RESULT,
        title=f"Assessment Evaluated: {attempt.assessment.title}",
        message=f"You scored {score_pct:.1f}%. Your competency profile and skill-gap report have been updated."
    )
    db.add(note)

    db.commit()
    db.refresh(attempt)

    return AssessmentResultOut(
        attempt_id=attempt.id,
        score_percentage=round(score_pct, 1),
        total_score=total_score,
        max_possible_score=max_score,
        status=attempt.status,
        skill_breakdown=skill_breakdown,
        ai_feedback=ai_feedback
    )

@router.get("/attempts/{attempt_id}/result", response_model=AssessmentResultOut)
def get_attempt_result(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Calculate breakdown
    skill_breakdown = {}
    for resp in attempt.responses:
        skill_name = resp.question.skill.name if (resp.question and resp.question.skill) else "General"
        skill_breakdown[skill_name] = skill_breakdown.get(skill_name, 0.0) + resp.points_awarded

    return AssessmentResultOut(
        attempt_id=attempt.id,
        score_percentage=round(attempt.score_percentage, 1),
        total_score=attempt.total_score,
        max_possible_score=attempt.max_possible_score,
        status=attempt.status,
        skill_breakdown=skill_breakdown,
        ai_feedback=attempt.ai_feedback_json
    )
