from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import FacultyProfile, ResearchPaper
from app.ai.provider import get_ai_provider

def recommend_collaborators_for_faculty(db: Session, faculty: FacultyProfile) -> List[Dict[str, Any]]:
    # Find all other faculty members
    other_faculty = db.query(FacultyProfile).filter(FacultyProfile.id != faculty.id).all()
    if not other_faculty:
        return []

    candidates = [
        {
            "id": f.id,
            "name": f.user.full_name if f.user else "Faculty Researcher",
            "institution": f.user.organization.name if (f.user and f.user.organization) else "Autonomous Institute",
            "research_interests": f.research_interests or "Computer Science, Distributed Systems, AI"
        }
        for f in other_faculty
    ]

    current_interests = faculty.research_interests or "Artificial Intelligence, Data Engineering, Software Architecture"
    ai_provider = get_ai_provider()
    return ai_provider.recommend_research_collaborators(current_interests, candidates)
