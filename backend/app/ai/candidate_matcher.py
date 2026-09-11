from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Opportunity, StudentProfile, CandidateMatch, CompetencyProfile, Application
from app.ai.provider import get_ai_provider

DEFAULT_WEIGHTS = {
    "eligibility": 0.20,
    "technical_skills": 0.35,
    "assessment_competency": 0.20,
    "academic_cgpa": 0.15,
    "experience": 0.10
}

def calculate_candidate_match(
    student: StudentProfile,
    opportunity: Opportunity,
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    w = weights or DEFAULT_WEIGHTS

    # 1. Eligibility Score (Degree, Branch, CGPA cutoff)
    eligibility_score = 100.0
    if student.cgpa < opportunity.min_cgpa:
        penalty = min(50.0, (opportunity.min_cgpa - student.cgpa) * 30.0)
        eligibility_score = max(0.0, 100.0 - penalty)
    
    # 2. Technical Skills Match
    required_skills = opportunity.required_skills_json or []
    preferred_skills = opportunity.preferred_skills_json or []

    student_skills_map = {
        ss.skill.name.lower(): ss.score
        for ss in student.skills
        if ss.skill
    }
    competency_map = {
        cp.skill.name.lower(): cp.score
        for cp in student.competency_profiles
        if cp.skill
    }

    strong_matches = []
    skill_gaps = []
    matched_req_count = 0

    for req in required_skills:
        req_lower = req.lower()
        # Check competency or declared skill
        score = competency_map.get(req_lower, student_skills_map.get(req_lower, 0.0))
        if score >= 60.0 or req_lower in student_skills_map:
            matched_req_count += 1
            strong_matches.append({
                "skill": req,
                "score": round(max(score, 70.0), 1),
                "is_verified": req_lower in competency_map
            })
        else:
            skill_gaps.append(req)

    pref_matches_count = sum(1 for p in preferred_skills if p.lower() in student_skills_map or p.lower() in competency_map)

    req_score = (matched_req_count / len(required_skills) * 80.0) if required_skills else 80.0
    pref_score = (pref_matches_count / len(preferred_skills) * 20.0) if preferred_skills else 20.0
    technical_skill_score = min(100.0, req_score + pref_score)

    # 3. Assessment Competency Score
    if competency_map:
        assessment_score = sum(competency_map.values()) / len(competency_map)
    else:
        assessment_score = 65.0  # Base if no assessments taken yet

    # 4. Academic CGPA Score (relative to 10.0 scale)
    academic_score = min(100.0, (student.cgpa / 10.0) * 100.0)

    # 5. Experience / Project Score
    experience_score = 80.0 if student.bio and len(student.bio) > 30 else 60.0

    # Total weighted match
    total_match = (
        eligibility_score * w["eligibility"] +
        technical_skill_score * w["technical_skills"] +
        assessment_score * w["assessment_competency"] +
        academic_score * w["academic_cgpa"] +
        experience_score * w["experience"]
    )
    match_percentage = round(min(99.0, max(35.0, total_match)), 1)

    # AI evidence explanation
    ai_provider = get_ai_provider()
    candidate_summary = {
        "name": student.user.full_name if student.user else "Candidate",
        "match_percentage": match_percentage,
        "strong_matches": strong_matches,
        "skill_gaps": skill_gaps,
        "cgpa": student.cgpa
    }
    opp_summary = {
        "title": opportunity.title
    }
    evidence_explanation = ai_provider.explain_candidate_match(candidate_summary, opp_summary)

    return {
        "student_id": student.id,
        "match_percentage": match_percentage,
        "skill_score": round(technical_skill_score, 1),
        "eligibility_score": round(eligibility_score, 1),
        "assessment_score": round(assessment_score, 1),
        "strong_matches": strong_matches,
        "skill_gaps": skill_gaps,
        "evidence_explanation": evidence_explanation
    }

def match_candidates_for_opportunity(db: Session, opportunity: Opportunity) -> List[CandidateMatch]:
    students = db.query(StudentProfile).all()
    matches = []

    for student in students:
        match_data = calculate_candidate_match(student, opportunity)
        
        # Save or update CandidateMatch
        existing = db.query(CandidateMatch).filter(
            CandidateMatch.opportunity_id == opportunity.id,
            CandidateMatch.student_id == student.id
        ).first()

        if existing:
            existing.match_percentage = match_data["match_percentage"]
            existing.skill_score = match_data["skill_score"]
            existing.eligibility_score = match_data["eligibility_score"]
            existing.assessment_score = match_data["assessment_score"]
            existing.explanation_json = match_data
            matches.append(existing)
        else:
            new_match = CandidateMatch(
                opportunity_id=opportunity.id,
                student_id=student.id,
                match_percentage=match_data["match_percentage"],
                skill_score=match_data["skill_score"],
                eligibility_score=match_data["eligibility_score"],
                assessment_score=match_data["assessment_score"],
                explanation_json=match_data
            )
            db.add(new_match)
            matches.append(new_match)

    db.commit()
    matches.sort(key=lambda m: m.match_percentage, reverse=True)
    return matches
