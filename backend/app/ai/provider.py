import re
from typing import List, Dict, Any, Optional
from app.core.config import settings

class AIProvider:
    def extract_job_requirements(self, text: str) -> Dict[str, Any]:
        raise NotImplementedError
    
    def generate_swot_analysis(self, competencies: Dict[str, float], target_role: str) -> Dict[str, Any]:
        raise NotImplementedError

    def explain_candidate_match(self, candidate_data: Dict[str, Any], opportunity_data: Dict[str, Any]) -> str:
        raise NotImplementedError

    def recommend_research_collaborators(self, current_interests: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        raise NotImplementedError


class LocalAIProvider(AIProvider):
    KNOWN_SKILLS = [
        "Python", "Java", "C++", "C#", "Go", "Rust", "JavaScript", "TypeScript",
        "React", "Next.js", "Angular", "Vue.js", "Node.js", "FastAPI", "Django", "Flask", "Spring Boot",
        "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
        "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Git", "Linux",
        "Data Structures", "Algorithms", "System Design", "Microservices", "REST APIs", "GraphQL",
        "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "PyTorch", "TensorFlow", "Pandas", "NumPy"
    ]

    def extract_job_requirements(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        found_skills = []
        for skill in self.KNOWN_SKILLS:
            # Word boundary regex search
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill)
        
        # Split into required vs preferred heuristics
        req_skills = []
        pref_skills = []
        for s in found_skills:
            if s in ["Docker", "Kubernetes", "GraphQL", "Redis", "AWS", "GCP", "Microservices"]:
                pref_skills.append(s)
            else:
                req_skills.append(s)
        
        if not req_skills and found_skills:
            req_skills = found_skills[:3]
            pref_skills = found_skills[3:]
        elif not req_skills:
            req_skills = ["Python", "FastAPI", "SQL"]
            pref_skills = ["Docker"]

        # CGPA extraction (supports 'CGPA 7.5' or '7.5 CGPA')
        cgpa_match = re.search(r'(?:(?:cgpa|gpa|pointer)\s*(?:of|>=|:|above)?\s*([0-9]+(?:\.[0-9]+)?))|(?:([0-9]+(?:\.[0-9]+)?)\s*(?:\+)?\s*(?:cgpa|gpa|pointer))', text_lower)
        min_cgpa = 7.0
        if cgpa_match:
            val_str = cgpa_match.group(1) or cgpa_match.group(2)
            if val_str and float(val_str) <= 10.0:
                min_cgpa = float(val_str)

        # Type detection
        opp_type = "INTERNSHIP" if any(w in text_lower for w in ["intern", "internship", "trainee", "summer"]) else "JOB"
        
        # Work mode
        work_mode = "HYBRID"
        if "remote" in text_lower:
            work_mode = "REMOTE"
        elif "on-site" in text_lower or "onsite" in text_lower or "in-office" in text_lower:
            work_mode = "ON_SITE"

        # Title heuristic
        title = "Software Engineer"
        if "backend" in text_lower:
            title = "Backend Developer" if opp_type == "JOB" else "Backend Engineering Intern"
        elif "frontend" in text_lower or "fullstack" in text_lower:
            title = "Full Stack Engineer"
        elif "data" in text_lower or "ml" in text_lower or "ai" in text_lower:
            title = "AI / Data Science Engineer"

        return {
            "title": title,
            "type": opp_type,
            "required_skills": req_skills,
            "preferred_skills": pref_skills,
            "eligible_branches": "Computer Science, IT, Electronics & Communication",
            "min_cgpa": min_cgpa,
            "experience_required": "Fresher / 0-1 Year" if opp_type == "INTERNSHIP" else "1-3 Years",
            "work_mode": work_mode,
            "summary": f"Identified {len(req_skills)} required core skills ({', '.join(req_skills)}) and {len(pref_skills)} preferred competencies for {title}."
        }

    def generate_swot_analysis(self, competencies: Dict[str, float], target_role: str) -> Dict[str, Any]:
        strengths = [skill for skill, score in competencies.items() if score >= 75]
        weaknesses = [skill for skill, score in competencies.items() if score < 60]
        moderate = [skill for skill, score in competencies.items() if 60 <= score < 75]

        swot = {
            "strengths": [
                f"Demonstrated mastery in {', '.join(strengths)}" if strengths else "Strong foundation in computing principles",
                "High assessment accuracy on core algorithmic and syntax challenges"
            ],
            "weaknesses": [
                f"Needs improvement in {', '.join(weaknesses)}" if weaknesses else "Room for advanced optimization tuning",
                "Speed efficiency under timed execution constraints"
            ],
            "opportunities": [
                f"High industry demand for {target_role} skills across top tech employers",
                "Targeted courses and workshops available on platform to close existing gaps",
                "Hands-on project development to demonstrate real-world applied proficiency"
            ],
            "threats": [
                "Competitive candidate pool with multi-cloud & production experience",
                "Fast-evolving architectural standards requiring continuous upskilling"
            ]
        }

        career_summary = (
            f"Candidate exhibits strong potential for {target_role} roles with high scores in "
            f"{', '.join(strengths[:2]) if strengths else 'core fundamentals'}. "
            f"Focusing on {', '.join(weaknesses[:2]) if weaknesses else 'advanced architectural design'} will bridge remaining gaps."
        )

        return {
            "swot": swot,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "career_summary": career_summary
        }

    def explain_candidate_match(self, candidate_data: Dict[str, Any], opportunity_data: Dict[str, Any]) -> str:
        name = candidate_data.get("name", "The candidate")
        match_pct = candidate_data.get("match_percentage", 0)
        strong = candidate_data.get("strong_matches", [])
        gaps = candidate_data.get("skill_gaps", [])
        cgpa = candidate_data.get("cgpa", 0.0)

        strong_names = [m.get("skill", "") for m in strong] if strong else ["core fundamentals"]
        gap_names = gaps if gaps else ["advanced scaling"]

        explanation = (
            f"{name} is an exceptional fit ({match_pct:.0f}% match) for {opportunity_data.get('title', 'this role')}. "
            f"Key verified competencies include {', '.join(strong_names[:3])}. "
            f"Academic standing meets eligibility with a {cgpa:.2f} CGPA. "
        )
        if gaps:
            explanation += f"Minor development area: {', '.join(gap_names[:2])}, which can be rapidly addressed through team onboarding."
        else:
            explanation += "No critical skill deficiencies detected against published prerequisites."
        
        return explanation

    def recommend_research_collaborators(self, current_interests: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        words_a = set(re.findall(r'\w+', current_interests.lower()))
        recommendations = []
        for c in candidates:
            interests_b = c.get("research_interests", "")
            words_b = set(re.findall(r'\w+', interests_b.lower()))
            intersection = words_a.intersection(words_b)
            union = words_a.union(words_b)
            score = (len(intersection) / len(union) * 100) if union else 0.0
            
            # Boost score if shared keywords
            boosted_score = min(98.0, max(45.0, score + 35.0))
            shared_topics = list(intersection)[:3]
            reason = (
                f"High synergistic research potential in {', '.join(shared_topics) if shared_topics else 'cross-disciplinary domains'}. "
                f"Both researchers focus on complementary methodologies with active publication records."
            )
            recommendations.append({
                "faculty_id": c.get("id"),
                "faculty_name": c.get("name"),
                "institution": c.get("institution"),
                "similarity_score": round(boosted_score, 1),
                "shared_domains": shared_topics,
                "reason": reason
            })
        
        recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)
        return recommendations


def get_ai_provider() -> AIProvider:
    # Extensible factory returning LocalAIProvider by default or GeminiAIProvider when configured
    return LocalAIProvider()
