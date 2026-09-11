import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import (
    UserRole, OrgType, OrgVerificationStatus, SkillProficiency, SkillSource,
    QuestionType, DifficultyLevel, AttemptStatus, GapSeverity, CourseStatus,
    ResourceType, EnrollmentStatus, WorkshopMode, OpportunityType, WorkMode,
    OpportunityStatus, ApplicationStatus, ResearchStatus, CollaborationStatus,
    ProfileVisibility, NotificationType
)

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True, index=True)
    type = Column(SQLEnum(OrgType), nullable=False)
    verification_status = Column(SQLEnum(OrgVerificationStatus), default=OrgVerificationStatus.PENDING, index=True)
    website = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    users = relationship("User", back_populates="organization")
    courses = relationship("Course", back_populates="organization")
    workshops = relationship("Workshop", back_populates="organization")
    opportunities = relationship("Opportunity", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="users")
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("FacultyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    industry_profile = relationship("IndustryProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    degree = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    semester = Column(Integer, default=1)
    graduation_year = Column(Integer, nullable=True)
    cgpa = Column(Float, default=0.0)
    bio = Column(Text, nullable=True)
    resume_url = Column(String(500), nullable=True)
    visibility = Column(SQLEnum(ProfileVisibility), default=ProfileVisibility.PUBLIC)
    target_career = Column(String(100), default="Backend Engineer")
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="student_profile")
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="student", cascade="all, delete-orphan")
    competency_profiles = relationship("CompetencyProfile", back_populates="student", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="student", cascade="all, delete-orphan")
    enrollments = relationship("CourseEnrollment", back_populates="student", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")

class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), default="Assistant Professor")
    research_interests = Column(Text, nullable=True)  # Comma-separated or prose
    orcid_id = Column(String(50), nullable=True)
    scholar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    is_mentor = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="faculty_profile")
    courses = relationship("Course", back_populates="faculty")
    papers = relationship("ResearchPaper", back_populates="faculty")
    projects = relationship("ResearchProject", back_populates="faculty")
    grant_bookmarks = relationship("GrantBookmark", back_populates="faculty", cascade="all, delete-orphan")

class IndustryProfile(Base):
    __tablename__ = "industry_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_size = Column(String(50), default="50-200")
    industry_sector = Column(String(100), default="Information Technology")
    hq_location = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="industry_profile")

class SkillCategory(Base):
    __tablename__ = "skill_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    skills = relationship("Skill", back_populates="category")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(36), ForeignKey("skill_categories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    category = relationship("SkillCategory", back_populates="skills")
    questions = relationship("Question", back_populates="skill")
    external_resources = relationship("ExternalResource", back_populates="skill")

class StudentSkill(Base):
    __tablename__ = "student_skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    proficiency = Column(SQLEnum(SkillProficiency), default=SkillProficiency.INTERMEDIATE)
    source = Column(SQLEnum(SkillSource), default=SkillSource.SELF_DECLARED)
    score = Column(Float, default=0.0)  # 0 to 100
    verified_at = Column(DateTime, nullable=True)

    student = relationship("StudentProfile", back_populates="skills")
    skill = relationship("Skill")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30)
    total_questions = Column(Integer, default=10)
    passing_percentage = Column(Float, default=60.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(SQLEnum(QuestionType), default=QuestionType.MCQ)
    difficulty = Column(SQLEnum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    points = Column(Integer, default=10)
    code_snippet = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)

    assessment = relationship("Assessment", back_populates="questions")
    skill = relationship("Skill", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")

class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("Question", back_populates="options")

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    score_percentage = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    max_possible_score = Column(Float, default=0.0)
    status = Column(SQLEnum(AttemptStatus), default=AttemptStatus.IN_PROGRESS)
    ai_feedback_json = Column(JSON, nullable=True)

    student = relationship("StudentProfile", back_populates="attempts")
    assessment = relationship("Assessment", back_populates="attempts")
    responses = relationship("AssessmentResponse", back_populates="attempt", cascade="all, delete-orphan")

class AssessmentResponse(Base):
    __tablename__ = "assessment_responses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attempt_id = Column(String(36), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_option_ids = Column(JSON, nullable=True)  # List of option IDs
    code_submission = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)
    points_awarded = Column(Float, default=0.0)
    time_taken_seconds = Column(Integer, default=0)

    attempt = relationship("AssessmentAttempt", back_populates="responses")
    question = relationship("Question")

class CompetencyProfile(Base):
    __tablename__ = "competency_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, default=0.0)  # 0 to 100
    assessment_count = Column(Integer, default=1)
    last_evaluated_at = Column(DateTime, default=utc_now)

    student = relationship("StudentProfile", back_populates="competency_profiles")
    skill = relationship("Skill")

class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    current_score = Column(Float, default=0.0)
    required_score = Column(Float, default=80.0)
    gap_severity = Column(SQLEnum(GapSeverity), default=GapSeverity.MODERATE)
    target_role = Column(String(100), default="Backend Engineer")
    recommended_action = Column(Text, nullable=True)

    student = relationship("StudentProfile", back_populates="skill_gaps")
    skill = relationship("Skill")

class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(String(36), ForeignKey("faculty_profiles.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), default="Computer Science")
    difficulty = Column(SQLEnum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    duration_weeks = Column(Integer, default=8)
    skills_json = Column(JSON, default=list)  # List of skill names taught
    prerequisites = Column(Text, nullable=True)
    status = Column(SQLEnum(CourseStatus), default=CourseStatus.PUBLISHED)
    thumbnail_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="courses")
    faculty = relationship("FacultyProfile", back_populates="courses")
    modules = relationship("CourseModule", back_populates="course", cascade="all, delete-orphan", order_by="CourseModule.module_order")
    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")

class CourseModule(Base):
    __tablename__ = "course_modules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    module_order = Column(Integer, default=1)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    course = relationship("Course", back_populates="modules")
    resources = relationship("CourseResource", back_populates="module", cascade="all, delete-orphan")

class CourseResource(Base):
    __tablename__ = "course_resources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    module_id = Column(String(36), ForeignKey("course_modules.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    resource_type = Column(SQLEnum(ResourceType), default=ResourceType.VIDEO)
    url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    module = relationship("CourseModule", back_populates="resources")

class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    progress_percentage = Column(Float, default=0.0)
    status = Column(SQLEnum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED)
    enrolled_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    student = relationship("StudentProfile", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

class ExternalResource(Base):
    __tablename__ = "external_resources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=False)  # NPTEL, SWAYAM, MIT OCW, etc.
    url = Column(String(500), nullable=False)
    resource_type = Column(String(50), default="Course")
    description = Column(Text, nullable=True)

    skill = relationship("Skill", back_populates="external_resources")

class Workshop(Base):
    __tablename__ = "workshops"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    speaker = Column(String(255), nullable=False)
    category = Column(String(100), default="Technology")
    date_time = Column(DateTime, nullable=False)
    duration_hours = Column(Float, default=2.0)
    capacity = Column(Integer, default=100)
    mode = Column(SQLEnum(WorkshopMode), default=WorkshopMode.ONLINE)
    meeting_url = Column(String(500), nullable=True)
    status = Column(String(50), default="UPCOMING")
    created_at = Column(DateTime, default=utc_now)

    organization = relationship("Organization", back_populates="workshops")
    registrations = relationship("WorkshopRegistration", back_populates="workshop", cascade="all, delete-orphan")

class WorkshopRegistration(Base):
    __tablename__ = "workshop_registrations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workshop_id = Column(String(36), ForeignKey("workshops.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    registered_at = Column(DateTime, default=utc_now)

    workshop = relationship("Workshop", back_populates="registrations")
    user = relationship("User")

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    type = Column(SQLEnum(OpportunityType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    raw_job_description = Column(Text, nullable=True)
    location = Column(String(255), default="Bengaluru, India")
    work_mode = Column(SQLEnum(WorkMode), default=WorkMode.HYBRID)
    salary_or_stipend = Column(String(100), nullable=True)
    min_cgpa = Column(Float, default=7.0)
    eligible_branches = Column(String(255), default="Computer Science, IT, Electronics")
    required_skills_json = Column(JSON, default=list)  # ["Python", "FastAPI", ...]
    preferred_skills_json = Column(JSON, default=list)  # ["Docker", "Kubernetes"]
    experience_required = Column(String(50), default="Fresher / 0-1 Year")
    deadline = Column(DateTime, nullable=True)
    status = Column(SQLEnum(OpportunityStatus), default=OpportunityStatus.OPEN)
    created_at = Column(DateTime, default=utc_now)

    organization = relationship("Organization", back_populates="opportunities")
    applications = relationship("Application", back_populates="opportunity", cascade="all, delete-orphan")
    matches = relationship("CandidateMatch", back_populates="opportunity", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    opportunity_id = Column(String(36), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.APPLIED, index=True)
    cover_letter = Column(Text, nullable=True)
    resume_url = Column(String(500), nullable=True)
    applied_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    opportunity = relationship("Opportunity", back_populates="applications")
    student = relationship("StudentProfile", back_populates="applications")

class CandidateMatch(Base):
    __tablename__ = "candidate_matches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    opportunity_id = Column(String(36), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    match_percentage = Column(Float, default=0.0)
    skill_score = Column(Float, default=0.0)
    eligibility_score = Column(Float, default=0.0)
    assessment_score = Column(Float, default=0.0)
    explanation_json = Column(JSON, nullable=True)
    calculated_at = Column(DateTime, default=utc_now)

    opportunity = relationship("Opportunity", back_populates="matches")
    student = relationship("StudentProfile")

class ResearchPaper(Base):
    __tablename__ = "research_papers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    faculty_id = Column(String(36), ForeignKey("faculty_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    abstract = Column(Text, nullable=False)
    authors = Column(String(500), nullable=False)
    journal = Column(String(255), nullable=True)
    publication_date = Column(DateTime, nullable=True)
    doi = Column(String(100), nullable=True)
    pdf_url = Column(String(500), nullable=True)
    keywords_json = Column(JSON, default=list)
    status = Column(SQLEnum(ResearchStatus), default=ResearchStatus.PUBLISHED)
    created_at = Column(DateTime, default=utc_now)

    faculty = relationship("FacultyProfile", back_populates="papers")

class ResearchProject(Base):
    __tablename__ = "research_projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    faculty_id = Column(String(36), ForeignKey("faculty_profiles.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    required_skills_json = Column(JSON, default=list)
    status = Column(String(50), default="ACTIVE")
    open_for_students = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    faculty = relationship("FacultyProfile", back_populates="projects")
    organization = relationship("Organization")

class ResearchCollaboration(Base):
    __tablename__ = "research_collaborations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sender_id = Column(String(36), ForeignKey("faculty_profiles.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(String(36), ForeignKey("faculty_profiles.id", ondelete="CASCADE"), nullable=False)
    project_title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(SQLEnum(CollaborationStatus), default=CollaborationStatus.PENDING)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    sender = relationship("FacultyProfile", foreign_keys=[sender_id])
    recipient = relationship("FacultyProfile", foreign_keys=[recipient_id])

class Grant(Base):
    __tablename__ = "grants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    funding_agency = Column(String(255), nullable=False)  # SERB, DST, CSIR, Horizon
    domain = Column(String(100), nullable=False)
    funding_amount = Column(String(100), default="₹25,00,000")
    deadline = Column(DateTime, nullable=False)
    description = Column(Text, nullable=False)
    eligibility = Column(Text, nullable=True)
    application_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    bookmarks = relationship("GrantBookmark", back_populates="grant", cascade="all, delete-orphan")

class GrantBookmark(Base):
    __tablename__ = "grant_bookmarks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    faculty_id = Column(String(36), ForeignKey("faculty_profiles.id", ondelete="CASCADE"), nullable=False)
    grant_id = Column(String(36), ForeignKey("grants.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    faculty = relationship("FacultyProfile", back_populates="grant_bookmarks")
    grant = relationship("Grant", back_populates="bookmarks")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(SQLEnum(NotificationType), default=NotificationType.SYSTEM)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details_json = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="audit_logs")
