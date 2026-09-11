from typing import Dict, Any
from app.ai.provider import get_ai_provider

def extract_requirements_from_text(raw_text: str) -> Dict[str, Any]:
    """
    Extracts structured recruitment requirements from arbitrary job description text.
    Provides transparent outputs for human review.
    """
    provider = get_ai_provider()
    return provider.extract_job_requirements(raw_text)
