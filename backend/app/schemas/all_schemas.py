from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import (
    UserRole, OrgType, OrgVerificationStatus, SkillProficiency, SkillSource,
    QuestionType, DifficultyLevel, AttemptStatus, GapSeverity, CourseStatus,
    ResourceType, EnrollmentStatus, WorkshopMode, OpportunityType, WorkMode,
    OpportunityStatus, ApplicationStatus, ResearchStatus, CollaborationStatus,
    ProfileVisibility, NotificationType
)

# --- AUTH & USER SCHEMAS ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: UserRole
    organization_name: Optional[str] = None
    organization_type: Optional[OrgType] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    organization_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- ORGANIZATION SCHEMAS ---
class OrganizationOut(BaseModel):
    id: str
    name: str
    type: OrgType
    verification_status: OrgVerificationStatus
    website: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class OrganizationVerificationUpdate(BaseModel):
    verification_status: OrgVerificationStatus
    reason: Optional[str] = None

# --- PROFILE SCHEMAS ---
class StudentProfileUpdate(BaseModel):
    degree: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    bio: Optional[str] = None
    resume_url: Optional[str] = None
    visibility: Optional[ProfileVisibility] = None
    target_career: Optional[str] = None

class StudentSkillAdd(BaseModel):
    skill_name: str
    proficiency: SkillProficiency = SkillProficiency.INTERMEDIATE

class StudentProfileOut(BaseModel):
    id: str
    user_id: str
    degree: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = 1
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = 0.0
    bio: Optional[str] = None
    resume_url: Optional[str] = None
    visibility: ProfileVisibility
    target_career: Optional[str] = "Backend Engineer"
    user: UserOut

    class Config:
        from_attributes = True

class FacultyProfileUpdate(BaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None
    research_interests: Optional[str] = None
    orcid_id: Optional[str] = None
    scholar_url: Optional[str] = None
    bio: Optional[str] = None
    is_mentor: Optional[bool] = None

class FacultyProfileOut(BaseModel):
    id: str
    user_id: str
    department: Optional[str] = None
    designation: Optional[str] = "Assistant Professor"
    research_interests: Optional[str] = None
    orcid_id: Optional[str] = None
    scholar_url: Optional[str] = None
    bio: Optional[str] = None
    is_mentor: bool
    user: UserOut

    class Config:
        from_attributes = True

class IndustryProfileOut(BaseModel):
    id: str
    user_id: str
    company_size: str
    industry_sector: str
    hq_location: Optional[str] = None
    contact_phone: Optional[str] = None
    user: UserOut

    class Config:
        from_attributes = True

# --- SKILL SCHEMAS ---
class SkillOut(BaseModel):
    id: str
    name: str
    category_id: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class StudentSkillOut(BaseModel):
    id: str
    skill_id: str
    skill_name: str
    proficiency: SkillProficiency
    source: SkillSource
    score: float
    verified_at: Optional[datetime] = None

# --- ASSESSMENT SCHEMAS ---
class QuestionOptionOut(BaseModel):
    id: str
    option_text: str

    class Config:
        from_attributes = True

class QuestionOut(BaseModel):
    id: str
    skill_id: str
    skill_name: Optional[str] = None
    question_text: str
    question_type: QuestionType
    difficulty: DifficultyLevel
    points: int
    code_snippet: Optional[str] = None
    options: List[QuestionOptionOut] = []

    class Config:
        from_attributes = True

class AssessmentOut(BaseModel):
    id: str
    title: str
    category: str
    description: Optional[str] = None
    duration_minutes: int
    total_questions: int
    passing_percentage: float

    class Config:
        from_attributes = True

class StartAttemptResponse(BaseModel):
    attempt_id: str
    assessment: AssessmentOut
    questions: List[QuestionOut]
    started_at: datetime
    duration_minutes: int

class SingleQuestionSubmission(BaseModel):
    question_id: str
    selected_option_ids: List[str] = []
    code_submission: Optional[str] = None
    time_taken_seconds: int = 0

class SubmitAssessmentRequest(BaseModel):
    responses: List[SingleQuestionSubmission]

class AssessmentResultOut(BaseModel):
    attempt_id: str
    score_percentage: float
    total_score: float
    max_possible_score: float
    status: AttemptStatus
    skill_breakdown: Dict[str, float]
    ai_feedback: Optional[Dict[str, Any]] = None

# --- COMPETENCY & SKILL GAPS ---
class CompetencyScoreItem(BaseModel):
    skill_name: str
    score: float
    assessment_count: int

class SkillGapItem(BaseModel):
    id: str
    skill_name: str
    current_score: float
    required_score: float
    gap_severity: GapSeverity
    target_role: str
    recommended_action: Optional[str] = None

class StudentCompetencyDashboard(BaseModel):
    overall_readiness: float
    target_career: str
    competencies: List[CompetencyScoreItem]
    skill_gaps: List[SkillGapItem]
    strengths: List[str]
    weaknesses: List[str]
    swot: Dict[str, List[str]]
    recommended_courses: List[Dict[str, Any]]
    recommended_external_resources: List[Dict[str, Any]]

# --- COURSE SCHEMAS ---
class CourseResourceCreate(BaseModel):
    title: str
    resource_type: ResourceType
    url: str
    description: Optional[str] = None

class CourseResourceOut(BaseModel):
    id: str
    title: str
    resource_type: ResourceType
    url: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class CourseModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    module_order: int = 1
    resources: List[CourseResourceCreate] = []

class CourseModuleOut(BaseModel):
    id: str
    module_order: int
    title: str
    description: Optional[str] = None
    resources: List[CourseResourceOut] = []

    class Config:
        from_attributes = True

class CourseCreate(BaseModel):
    title: str
    description: str
    category: str = "Computer Science"
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    duration_weeks: int = 8
    skills_json: List[str] = []
    prerequisites: Optional[str] = None
    status: CourseStatus = CourseStatus.PUBLISHED
    modules: List[CourseModuleCreate] = []

class CourseOut(BaseModel):
    id: str
    title: str
    description: str
    category: str
    difficulty: DifficultyLevel
    duration_weeks: int
    skills_json: List[str] = []
    status: CourseStatus
    thumbnail_url: Optional[str] = None
    organization_name: str
    faculty_name: Optional[str] = None
    enrollment_count: int = 0
    modules: List[CourseModuleOut] = []

    class Config:
        from_attributes = True

class CourseEnrollmentOut(BaseModel):
    id: str
    course_id: str
    course_title: str
    progress_percentage: float
    status: EnrollmentStatus
    enrolled_at: datetime

# --- WORKSHOPS ---
class WorkshopCreate(BaseModel):
    title: str
    description: str
    speaker: str
    category: str = "Technology"
    date_time: datetime
    duration_hours: float = 2.0
    capacity: int = 100
    mode: WorkshopMode = WorkshopMode.ONLINE
    meeting_url: Optional[str] = None

class WorkshopOut(BaseModel):
    id: str
    title: str
    description: str
    speaker: str
    category: str
    date_time: datetime
    duration_hours: float
    capacity: int
    mode: WorkshopMode
    meeting_url: Optional[str] = None
    organization_name: str
    registered_count: int = 0
    is_registered: bool = False

    class Config:
        from_attributes = True

# --- OPPORTUNITIES & APPLICATIONS ---
class AnalyzeRequirementsRequest(BaseModel):
    raw_job_description: str

class AnalyzedRequirementsResponse(BaseModel):
    title: Optional[str] = None
    type: OpportunityType = OpportunityType.INTERNSHIP
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    eligible_branches: str = "Computer Science, IT"
    min_cgpa: float = 7.0
    experience_required: str = "Fresher / 0-1 Year"
    work_mode: WorkMode = WorkMode.HYBRID
    summary: str

class OpportunityCreate(BaseModel):
    type: OpportunityType
    title: str
    description: str
    raw_job_description: Optional[str] = None
    location: str = "Bengaluru, India"
    work_mode: WorkMode = WorkMode.HYBRID
    salary_or_stipend: Optional[str] = None
    min_cgpa: float = 7.0
    eligible_branches: str = "Computer Science, IT, Electronics"
    required_skills_json: List[str] = []
    preferred_skills_json: List[str] = []
    experience_required: str = "Fresher / 0-1 Year"
    deadline: Optional[datetime] = None

class OpportunityOut(BaseModel):
    id: str
    organization_id: str
    organization_name: str
    organization_verified: bool
    type: OpportunityType
    title: str
    description: str
    raw_job_description: Optional[str] = None
    location: str
    work_mode: WorkMode
    salary_or_stipend: Optional[str] = None
    min_cgpa: float
    eligible_branches: str
    required_skills_json: List[str]
    preferred_skills_json: List[str]
    experience_required: str
    deadline: Optional[datetime] = None
    status: OpportunityStatus
    created_at: datetime
    has_applied: bool = False

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus

class ApplicationOut(BaseModel):
    id: str
    opportunity_id: str
    opportunity_title: str
    organization_name: str
    student_id: str
    student_name: str
    student_email: str
    student_cgpa: float
    student_department: Optional[str] = None
    status: ApplicationStatus
    cover_letter: Optional[str] = None
    applied_at: datetime
    match_percentage: Optional[float] = None

    class Config:
        from_attributes = True

class CandidateMatchExplainableOut(BaseModel):
    student_id: str
    student_name: str
    student_email: str
    degree: Optional[str] = None
    department: Optional[str] = None
    cgpa: float
    match_percentage: float
    skill_score: float
    eligibility_score: float
    assessment_score: float
    strong_matches: List[Dict[str, Any]]
    skill_gaps: List[str]
    evidence_explanation: str
    application_status: Optional[ApplicationStatus] = None
    application_id: Optional[str] = None

# --- RESEARCH & COLLABORATION ---
class ResearchPaperCreate(BaseModel):
    title: str
    abstract: str
    authors: str
    journal: Optional[str] = None
    publication_date: Optional[datetime] = None
    doi: Optional[str] = None
    pdf_url: Optional[str] = None
    keywords_json: List[str] = []

class ResearchPaperOut(BaseModel):
    id: str
    title: str
    abstract: str
    authors: str
    journal: Optional[str] = None
    publication_date: Optional[datetime] = None
    doi: Optional[str] = None
    pdf_url: Optional[str] = None
    keywords_json: List[str]
    faculty_id: str
    faculty_name: str
    institution_name: str

    class Config:
        from_attributes = True

class CollaborationRequestCreate(BaseModel):
    recipient_faculty_id: str
    project_title: str
    message: str

class CollaborationOut(BaseModel):
    id: str
    sender_faculty_id: str
    sender_name: str
    sender_institution: str
    recipient_faculty_id: str
    recipient_name: str
    recipient_institution: str
    project_title: str
    message: Optional[str] = None
    status: CollaborationStatus
    created_at: datetime

    class Config:
        from_attributes = True

class GrantOut(BaseModel):
    id: str
    title: str
    funding_agency: str
    domain: str
    funding_amount: str
    deadline: datetime
    description: str
    eligibility: Optional[str] = None
    application_url: Optional[str] = None
    is_bookmarked: bool = False

    class Config:
        from_attributes = True

# --- NOTIFICATIONS & AUDIT ---
class NotificationOut(BaseModel):
    id: str
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    user_email: Optional[str] = None
    details_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
