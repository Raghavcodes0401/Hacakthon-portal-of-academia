import enum

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    INSTITUTION_ADMIN = "INSTITUTION_ADMIN"
    INDUSTRY_USER = "INDUSTRY_USER"
    PLATFORM_ADMIN = "PLATFORM_ADMIN"

class OrgType(str, enum.Enum):
    INSTITUTION = "INSTITUTION"
    INDUSTRY = "INDUSTRY"

class OrgVerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"

class SkillProficiency(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"

class SkillSource(str, enum.Enum):
    SELF_DECLARED = "SELF_DECLARED"
    AI_ASSESSED = "AI_ASSESSED"
    VERIFIED = "VERIFIED"

class QuestionType(str, enum.Enum):
    MCQ = "MCQ"
    MULTI_SELECT = "MULTI_SELECT"
    CODE_OUTPUT = "CODE_OUTPUT"
    SQL = "SQL"
    SCENARIO = "SCENARIO"

class DifficultyLevel(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class AttemptStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    EVALUATED = "EVALUATED"

class GapSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    MODERATE = "MODERATE"
    MINOR = "MINOR"
    SUFFICIENT = "SUFFICIENT"

class CourseStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class ResourceType(str, enum.Enum):
    VIDEO = "VIDEO"
    PDF = "PDF"
    ARTICLE = "ARTICLE"
    ASSIGNMENT = "ASSIGNMENT"
    EXTERNAL_LINK = "EXTERNAL_LINK"

class EnrollmentStatus(str, enum.Enum):
    ENROLLED = "ENROLLED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class WorkshopMode(str, enum.Enum):
    ONLINE = "ONLINE"
    HYBRID = "HYBRID"
    IN_PERSON = "IN_PERSON"

class OpportunityType(str, enum.Enum):
    JOB = "JOB"
    INTERNSHIP = "INTERNSHIP"

class WorkMode(str, enum.Enum):
    REMOTE = "REMOTE"
    HYBRID = "HYBRID"
    ON_SITE = "ON_SITE"

class OpportunityStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class ApplicationStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    UNDER_REVIEW = "UNDER_REVIEW"
    SHORTLISTED = "SHORTLISTED"
    INTERVIEW = "INTERVIEW"
    SELECTED = "SELECTED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"

class ResearchStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class CollaborationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class ProfileVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    VERIFIED_ONLY = "VERIFIED_ONLY"
    PRIVATE = "PRIVATE"

class NotificationType(str, enum.Enum):
    ASSESSMENT_RESULT = "ASSESSMENT_RESULT"
    COURSE_RECOMMENDATION = "COURSE_RECOMMENDATION"
    JOB_RECOMMENDATION = "JOB_RECOMMENDATION"
    APPLICATION_UPDATE = "APPLICATION_UPDATE"
    WORKSHOP = "WORKSHOP"
    COLLABORATION_REQUEST = "COLLABORATION_REQUEST"
    GRANT_DEADLINE = "GRANT_DEADLINE"
    SYSTEM = "SYSTEM"
