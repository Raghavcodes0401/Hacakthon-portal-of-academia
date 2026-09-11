from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models import (
    User, Organization, StudentProfile, FacultyProfile, IndustryProfile,
    SkillCategory, Skill, StudentSkill, Assessment, Question, QuestionOption,
    CompetencyProfile, SkillGap, Course, CourseModule, CourseResource, CourseEnrollment,
    ExternalResource, Workshop, Opportunity, Application, CandidateMatch,
    ResearchPaper, Grant, Notification, UserRole, OrgType, OrgVerificationStatus,
    SkillProficiency, SkillSource, QuestionType, DifficultyLevel, CourseStatus,
    ResourceType, EnrollmentStatus, WorkshopMode, OpportunityType, WorkMode,
    OpportunityStatus, ApplicationStatus, GapSeverity, NotificationType
)

def seed_database_if_empty(db: Session):
    admin_user = db.query(User).filter(User.role == UserRole.PLATFORM_ADMIN).first()
    if admin_user:
        return  # Already seeded

    print(">>> Seeding initial database with realistic national ecosystem data...")

    default_pw_hash = get_password_hash("Password123!")

    # 1. ORGANIZATIONS
    iitd = Organization(
        name="Indian Institute of Technology Delhi",
        type=OrgType.INSTITUTION,
        verification_status=OrgVerificationStatus.VERIFIED,
        website="https://home.iitd.ac.in",
        location="Hauz Khas, New Delhi",
        description="Premier national institute of technology and research."
    )
    nitk = Organization(
        name="National Institute of Technology Karnataka",
        type=OrgType.INSTITUTION,
        verification_status=OrgVerificationStatus.VERIFIED,
        website="https://www.nitk.ac.in",
        location="Surathkal, Mangalore",
        description="Leading autonomous technical university and institute of national importance."
    )
    tata_res = Organization(
        name="Tata Consultancy Research & Innovations",
        type=OrgType.INDUSTRY,
        verification_status=OrgVerificationStatus.VERIFIED,
        website="https://www.tcs.com/research",
        location="Bengaluru & Pune",
        description="Global pioneer in advanced software research, artificial intelligence, and systems engineering."
    )
    infosys_labs = Organization(
        name="Infosys Applied AI Labs",
        type=OrgType.INDUSTRY,
        verification_status=OrgVerificationStatus.VERIFIED,
        website="https://www.infosys.com",
        location="Electronic City, Bengaluru",
        description="Enterprise innovation laboratory delivering generative AI and cloud infrastructure solutions."
    )
    apex_cloud = Organization(
        name="Apex Cloud Systems",
        type=OrgType.INDUSTRY,
        verification_status=OrgVerificationStatus.PENDING,  # Needs admin verification!
        website="https://apexcloud.example.com",
        location="Hyderabad",
        description="Next-generation Kubernetes orchestration startup."
    )
    db.add_all([iitd, nitk, tata_res, infosys_labs, apex_cloud])
    db.flush()

    # 2. SKILL TAXONOMY
    cat_swe = SkillCategory(name="Software Engineering", description="Core programming, architectures, and design patterns")
    cat_data = SkillCategory(name="Data Science & AI", description="Machine learning, deep learning, and statistical analysis")
    cat_cloud = SkillCategory(name="Cloud & Infrastructure", description="DevOps, containerization, and distributed systems")
    cat_core = SkillCategory(name="Computer Science Fundamentals", description="Data structures, algorithms, databases, and OS")
    db.add_all([cat_swe, cat_data, cat_cloud, cat_core])
    db.flush()

    skills_dict = {}
    skill_definitions = [
        (cat_swe.id, "Python", "High-level object-oriented programming language"),
        (cat_swe.id, "FastAPI", "Modern high-performance async Python web framework"),
        (cat_swe.id, "Git", "Distributed version control system"),
        (cat_swe.id, "REST APIs", "Architectural style for network applications"),
        (cat_swe.id, "TypeScript", "Typed superset of JavaScript"),
        (cat_core.id, "SQL", "Structured query language for relational databases"),
        (cat_core.id, "Data Structures", "Arrays, trees, graphs, and memory representations"),
        (cat_core.id, "Algorithms", "Search, sorting, dynamic programming, and complexity"),
        (cat_core.id, "System Design", "Scalability, microservices, load balancing, caching"),
        (cat_cloud.id, "Docker", "Containerization and lightweight runtime isolation"),
        (cat_cloud.id, "Kubernetes", "Container cluster orchestration"),
        (cat_cloud.id, "Linux", "Operating system utilities and shell scripting"),
        (cat_data.id, "Machine Learning", "Supervised, unsupervised, and reinforcement algorithms"),
        (cat_data.id, "Deep Learning", "Neural networks, PyTorch, and transformer models"),
    ]
    for cat_id, s_name, s_desc in skill_definitions:
        s = Skill(category_id=cat_id, name=s_name, description=s_desc)
        db.add(s)
        skills_dict[s_name] = s
    db.flush()

    # 3. USERS & PROFILES
    # 3.1 Platform Admin
    user_admin = User(
        email="admin@ecosystem.gov.in",
        hashed_password=default_pw_hash,
        full_name="National Platform Administrator",
        role=UserRole.PLATFORM_ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(user_admin)

    # 3.2 Institution Admin (IIT Delhi)
    user_inst_admin = User(
        email="admin@iitd.ac.in",
        hashed_password=default_pw_hash,
        full_name="Prof. K. Narayanan (Dean Academics)",
        role=UserRole.INSTITUTION_ADMIN,
        organization_id=iitd.id,
        is_active=True,
        is_verified=True
    )
    db.add(user_inst_admin)

    # 3.3 Faculty (IIT Delhi)
    user_faculty_1 = User(
        email="dr.sharma@iitd.ac.in",
        hashed_password=default_pw_hash,
        full_name="Dr. Rajesh Sharma",
        role=UserRole.FACULTY,
        organization_id=iitd.id,
        is_active=True,
        is_verified=True
    )
    db.add(user_faculty_1)
    db.flush()
    fac_profile_1 = FacultyProfile(
        user_id=user_faculty_1.id,
        department="Computer Science and Engineering",
        designation="Professor & Lead Researcher",
        research_interests="Distributed Systems, Cloud Reliability, High-Performance Microservices",
        orcid_id="0000-0002-1825-0097",
        scholar_url="https://scholar.google.com/citations?user=sample1",
        bio="Leading research group in distributed architectures and cloud resilience."
    )
    db.add(fac_profile_1)

    # 3.4 Faculty (NITK)
    user_faculty_2 = User(
        email="dr.verma@nitk.ac.in",
        hashed_password=default_pw_hash,
        full_name="Dr. Sunita Verma",
        role=UserRole.FACULTY,
        organization_id=nitk.id,
        is_active=True,
        is_verified=True
    )
    db.add(user_faculty_2)
    db.flush()
    fac_profile_2 = FacultyProfile(
        user_id=user_faculty_2.id,
        department="Information Technology",
        designation="Associate Professor",
        research_interests="Natural Language Processing, Edge AI, Distributed Machine Learning",
        orcid_id="0000-0003-9120-4421",
        scholar_url="https://scholar.google.com/citations?user=sample2",
        bio="Researcher focusing on efficient multilingual transformer models."
    )
    db.add(fac_profile_2)

    # 3.5 Industry User (Tata Research)
    user_ind_1 = User(
        email="recruiter@tata-research.com",
        hashed_password=default_pw_hash,
        full_name="Vikramaditya Sen",
        role=UserRole.INDUSTRY_USER,
        organization_id=tata_res.id,
        is_active=True,
        is_verified=True
    )
    db.add(user_ind_1)
    db.flush()
    ind_profile_1 = IndustryProfile(
        user_id=user_ind_1.id,
        company_size="10,000+ Enterprise",
        industry_sector="Information Technology & Advanced Systems",
        hq_location="Bengaluru, Karnataka"
    )
    db.add(ind_profile_1)

    # 3.6 Industry User (Apex Cloud - Pending)
    user_ind_pending = User(
        email="founder@apexcloud.io",
        hashed_password=default_pw_hash,
        full_name="Rohan Deshmukh",
        role=UserRole.INDUSTRY_USER,
        organization_id=apex_cloud.id,
        is_active=True,
        is_verified=False
    )
    db.add(user_ind_pending)
    db.flush()
    ind_profile_pending = IndustryProfile(
        user_id=user_ind_pending.id,
        company_size="10-50 Startup",
        industry_sector="Cloud Infrastructure",
        hq_location="Hyderabad, Telangana"
    )
    db.add(ind_profile_pending)

    # 3.7 Students
    # Student 1: Rahul Sharma (IITD)
    user_stud_1 = User(
        email="rahul.sharma@student.iitd.ac.in",
        hashed_password=default_pw_hash,
        full_name="Rahul Sharma",
        role=UserRole.STUDENT,
        organization_id=iitd.id,
        is_active=True,
        is_verified=True
    )
    db.add(user_stud_1)
    db.flush()
    stud_prof_1 = StudentProfile(
        user_id=user_stud_1.id,
        degree="B.Tech",
        department="Computer Science and Engineering",
        semester=6,
        graduation_year=2026,
        cgpa=8.85,
        bio="Full stack and backend engineering enthusiast. Built high-concurrency microservices and asynchronous workers.",
        target_career="Backend Engineer"
    )
    db.add(stud_prof_1)

    # Student 2: Aditi Singh (NITK)
    user_stud_2 = User(
        email="aditi.singh@student.nitk.ac.in",
        hashed_password=default_pw_hash,
        full_name="Aditi Singh",
        role=UserRole.STUDENT,
        organization_id=nitk.id,
        is_active=True,
        is_verified=True
    )
    db.add(user_stud_2)
    db.flush()
    stud_prof_2 = StudentProfile(
        user_id=user_stud_2.id,
        degree="B.Tech",
        department="Information Technology",
        semester=6,
        graduation_year=2026,
        cgpa=8.40,
        bio="Aspiring machine learning engineer with background in statistics, computer vision, and neural network pipelines.",
        target_career="Data Scientist"
    )
    db.add(stud_prof_2)

    # Student 3: Arjun Mehta (IITD)
    user_stud_3 = User(
        email="arjun.mehta@student.iitd.ac.in",
        hashed_password=default_pw_hash,
        full_name="Arjun Mehta",
        role=UserRole.STUDENT,
        organization_id=iitd.id,
        is_active=True,
        is_verified=True
    )
    db.add(user_stud_3)
    db.flush()
    stud_prof_3 = StudentProfile(
        user_id=user_stud_3.id,
        degree="B.Tech",
        department="Computer Science and Engineering",
        semester=6,
        graduation_year=2026,
        cgpa=7.65,
        bio="Systems programming hobbyist looking to master cloud infrastructure and container orchestration.",
        target_career="Cloud & DevOps Engineer"
    )
    db.add(stud_prof_3)
    db.flush()

    # Add Competencies & Skills for Rahul Sharma
    rahul_skills = [
        (skills_dict["Python"], 92.0, SkillProficiency.ADVANCED, SkillSource.AI_ASSESSED),
        (skills_dict["FastAPI"], 88.0, SkillProficiency.ADVANCED, SkillSource.AI_ASSESSED),
        (skills_dict["SQL"], 91.0, SkillProficiency.ADVANCED, SkillSource.AI_ASSESSED),
        (skills_dict["Git"], 95.0, SkillProficiency.ADVANCED, SkillSource.VERIFIED),
        (skills_dict["Data Structures"], 84.0, SkillProficiency.ADVANCED, SkillSource.AI_ASSESSED),
        (skills_dict["System Design"], 62.0, SkillProficiency.INTERMEDIATE, SkillSource.AI_ASSESSED),
        (skills_dict["Docker"], 48.0, SkillProficiency.BEGINNER, SkillSource.AI_ASSESSED),
    ]
    for skill_obj, score_val, prof_val, src_val in rahul_skills:
        ss = StudentSkill(
            student_id=stud_prof_1.id,
            skill_id=skill_obj.id,
            proficiency=prof_val,
            source=src_val,
            score=score_val
        )
        cp = CompetencyProfile(
            student_id=stud_prof_1.id,
            skill_id=skill_obj.id,
            score=score_val,
            assessment_count=2
        )
        db.add_all([ss, cp])

    # Gaps for Rahul Sharma (Docker & System Design)
    gap_docker = SkillGap(
        student_id=stud_prof_1.id,
        skill_id=skills_dict["Docker"].id,
        current_score=48.0,
        required_score=70.0,
        gap_severity=GapSeverity.MODERATE,
        target_role="Backend Engineer",
        recommended_action="Enroll in Containerization Workshop & complete hands-on multi-stage Dockerfile practice."
    )
    gap_sys_des = SkillGap(
        student_id=stud_prof_1.id,
        skill_id=skills_dict["System Design"].id,
        current_score=62.0,
        required_score=65.0,
        gap_severity=GapSeverity.MINOR,
        target_role="Backend Engineer",
        recommended_action="Review distributed caching and replication strategies."
    )
    db.add_all([gap_docker, gap_sys_des])

    # 4. ASSESSMENTS & REAL QUESTIONS
    assess_swe = Assessment(
        title="Software Engineering & Backend Systems Benchmark",
        category="Software Engineering",
        description="Comprehensive evaluation of programming fundamentals, database queries, API construction, and system reliability.",
        duration_minutes=25,
        total_questions=5,
        passing_percentage=60.0
    )
    db.add(assess_swe)
    db.flush()

    # Question 1: Python Concurrency
    q1 = Question(
        assessment_id=assess_swe.id,
        skill_id=skills_dict["Python"].id,
        question_text="In Python's asyncio architecture, what happens if a CPU-bound computation is run directly inside a coroutine without offloading to an executor?",
        question_type=QuestionType.MCQ,
        difficulty=DifficultyLevel.MEDIUM,
        points=10,
        explanation="Running CPU-bound operations in the event loop blocks the single execution thread, stopping all other concurrent coroutines from progressing."
    )
    db.add(q1)
    db.flush()
    db.add_all([
        QuestionOption(question_id=q1.id, option_text="It blocks the entire event loop, preventing other scheduled tasks from running.", is_correct=True),
        QuestionOption(question_id=q1.id, option_text="Asyncio automatically delegates CPU-bound tasks to background OS threads.", is_correct=False),
        QuestionOption(question_id=q1.id, option_text="The process raises an UnhandledAsyncConcurrencyError exception.", is_correct=False),
        QuestionOption(question_id=q1.id, option_text="The GIL is temporarily released for the duration of the coroutine.", is_correct=False),
    ])

    # Question 2: SQL Window Functions
    q2 = Question(
        assessment_id=assess_swe.id,
        skill_id=skills_dict["SQL"].id,
        question_text="Which SQL clause provides the ability to assign a unique sequential integer to rows partitioned by department, ordered by salary descending?",
        question_type=QuestionType.MCQ,
        difficulty=DifficultyLevel.MEDIUM,
        points=10,
        code_snippet="SELECT emp_id, dept_id, salary, ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) as rank_no FROM employees;",
        explanation="ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) numbers rows sequentially within each partition."
    )
    db.add(q2)
    db.flush()
    db.add_all([
        QuestionOption(question_id=q2.id, option_text="ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC)", is_correct=True),
        QuestionOption(question_id=q2.id, option_text="RANK() GROUP BY dept_id ORDER BY salary DESC", is_correct=False),
        QuestionOption(question_id=q2.id, option_text="DENSE_NUMBER() OVER (SPLIT BY dept_id)", is_correct=False),
        QuestionOption(question_id=q2.id, option_text="COUNT() OVER (HAVING dept_id = CURRENT)", is_correct=False),
    ])

    # Question 3: FastAPI Dependencies
    q3 = Question(
        assessment_id=assess_swe.id,
        skill_id=skills_dict["FastAPI"].id,
        question_text="How does FastAPI's Depends() mechanism manage database sessions created with yield?",
        question_type=QuestionType.MCQ,
        difficulty=DifficultyLevel.HARD,
        points=10,
        explanation="FastAPI executes code before the yield before endpoint execution, and executes the finally block after the HTTP response has completed."
    )
    db.add(q3)
    db.flush()
    db.add_all([
        QuestionOption(question_id=q3.id, option_text="Executes code before yield on request start, and executes code after yield (e.g. db.close()) in response teardown.", is_correct=True),
        QuestionOption(question_id=q3.id, option_text="Creates a persistent background daemon thread that never terminates.", is_correct=False),
        QuestionOption(question_id=q3.id, option_text="Sessions are shared globally across all concurrent HTTP requests.", is_correct=False),
        QuestionOption(question_id=q3.id, option_text="Requires manual invocation of db.close() inside every route handler.", is_correct=False),
    ])

    # Question 4: Docker Multi-Stage Build
    q4 = Question(
        assessment_id=assess_swe.id,
        skill_id=skills_dict["Docker"].id,
        question_text="What is the primary benefit of utilizing multi-stage Docker builds for backend applications?",
        question_type=QuestionType.MCQ,
        difficulty=DifficultyLevel.EASY,
        points=10,
        explanation="Multi-stage builds leave compiler tools, test dependencies, and temporary artifacts in intermediate build stages, yielding minimal production images."
    )
    db.add(q4)
    db.flush()
    db.add_all([
        QuestionOption(question_id=q4.id, option_text="Separating build dependencies from runtime artifacts to produce lightweight, secure production images.", is_correct=True),
        QuestionOption(question_id=q4.id, option_text="Running containers across multiple CPU cores simultaneously.", is_correct=False),
        QuestionOption(question_id=q4.id, option_text="Enabling automatic horizontal autoscaling without Kubernetes.", is_correct=False),
        QuestionOption(question_id=q4.id, option_text="Bypassing Docker layer caching during local development.", is_correct=False),
    ])

    # Question 5: System Design Caching
    q5 = Question(
        assessment_id=assess_swe.id,
        skill_id=skills_dict["System Design"].id,
        question_text="In a Write-Through caching strategy, when does an update operation report success to the client?",
        question_type=QuestionType.MCQ,
        difficulty=DifficultyLevel.MEDIUM,
        points=10,
        explanation="In Write-Through, data is written synchronously to both cache and database before acknowledging write completion."
    )
    db.add(q5)
    db.flush()
    db.add_all([
        QuestionOption(question_id=q5.id, option_text="Only after data is synchronously written to both the cache and the persistent database.", is_correct=True),
        QuestionOption(question_id=q5.id, option_text="Immediately after writing to cache, before database persistence.", is_correct=False),
        QuestionOption(question_id=q5.id, option_text="After an asynchronous background worker flushes cache every minute.", is_correct=False),
        QuestionOption(question_id=q5.id, option_text="Only when the cache key expires from LRU eviction.", is_correct=False),
    ])

    # 5. COURSES WITH MODULES & RESOURCES
    course_py = Course(
        organization_id=iitd.id,
        faculty_id=fac_profile_1.id,
        title="Advanced Python for High-Performance Backend Systems",
        description="Master asynchronous Python, SQLAlchemy 2.0 ORM query performance, concurrency primitives, and microservice APIs with FastAPI.",
        category="Computer Science",
        difficulty=DifficultyLevel.MEDIUM,
        duration_weeks=8,
        skills_json=["Python", "FastAPI", "SQL", "REST APIs"],
        prerequisites="Intermediate Python syntax and basic relational database concepts.",
        status=CourseStatus.PUBLISHED
    )
    db.add(course_py)
    db.flush()

    m1 = CourseModule(course_id=course_py.id, module_order=1, title="Asyncio & Non-Blocking Architecture", description="Event loops, coroutines, tasks, and task groups in Python 3.11+")
    m2 = CourseModule(course_id=course_py.id, module_order=2, title="Database Optimization with SQLAlchemy 2.0", description="Connection pooling, N+1 query avoidance, indexing, and bulk transactions")
    m3 = CourseModule(course_id=course_py.id, module_order=3, title="Microservice Architecture & Rate Limiting", description="Service-to-service communication, JWT security, and resilient error recovery")
    db.add_all([m1, m2, m3])
    db.flush()

    r1 = CourseResource(module_id=m1.id, title="Asyncio Architecture Blueprint (PDF)", resource_type=ResourceType.PDF, url="https://iitd.ac.in/resources/asyncio-blueprint.pdf")
    r2 = CourseResource(module_id=m1.id, title="Lecture: Concurrency vs Parallelism", resource_type=ResourceType.VIDEO, url="https://youtube.com/watch?v=sample_async")
    r3 = CourseResource(module_id=m2.id, title="SQLAlchemy 2.0 Performance Lab", resource_type=ResourceType.ASSIGNMENT, url="https://github.com/iitd-cs/sqlalchemy-lab")
    db.add_all([r1, r2, r3])

    course_docker = Course(
        organization_id=iitd.id,
        faculty_id=fac_profile_1.id,
        title="Containerization & Cloud Native Architecture with Docker",
        description="Bridge your operational skill gaps. Learn Dockerfiles, multi-stage builds, container security, network bridges, and compose orchestration.",
        category="Cloud & Infrastructure",
        difficulty=DifficultyLevel.EASY,
        duration_weeks=6,
        skills_json=["Docker", "Linux", "CI/CD"],
        prerequisites="Basic command line familiarity.",
        status=CourseStatus.PUBLISHED
    )
    db.add(course_docker)

    # Student 1 enrolled in Course
    enroll_1 = CourseEnrollment(
        student_id=stud_prof_1.id,
        course_id=course_py.id,
        progress_percentage=45.0,
        status=EnrollmentStatus.IN_PROGRESS
    )
    db.add(enroll_1)

    # 6. EXTERNAL GOVERNMENT / MOOC RESOURCES (NPTEL / SWAYAM)
    ext_1 = ExternalResource(
        skill_id=skills_dict["SQL"].id,
        title="Database Management System (NPTEL - IIT Kharagpur)",
        provider="NPTEL",
        url="https://nptel.ac.in/courses/106105175",
        resource_type="Online Course",
        description="Comprehensive 8-week course covering relational algebra, SQL optimization, indexing, and transaction processing."
    )
    ext_2 = ExternalResource(
        skill_id=skills_dict["Docker"].id,
        title="Cloud Computing & Virtualization (SWAYAM - IIT Madras)",
        provider="SWAYAM",
        url="https://swayam.gov.in/explorer?category=Computer_Science",
        resource_type="National MOOC",
        description="Government-certified curriculum covering hypervisors, containers, Kubernetes, and scalable distributed storage."
    )
    ext_3 = ExternalResource(
        skill_id=skills_dict["Data Structures"].id,
        title="Data Structures and Algorithms (NPTEL - IIT Delhi)",
        provider="NPTEL",
        url="https://nptel.ac.in/courses/106102064",
        resource_type="Video Series & Exercises",
        description="Foundational algorithmic complexity, tree balance, graph traversal, and dynamic programming."
    )
    db.add_all([ext_1, ext_2, ext_3])

    # 7. INDUSTRY OPPORTUNITIES
    opp_backend = Opportunity(
        organization_id=tata_res.id,
        type=OpportunityType.INTERNSHIP,
        title="Backend Engineering Research Intern",
        description="Join our Systems Architecture Lab to build high-concurrency microservices, optimize database query engines, and deploy containerized services.",
        raw_job_description="We are looking for a backend development intern who knows Python, FastAPI, PostgreSQL and Git. Docker experience is preferred. Candidates must have a minimum CGPA of 7.5.",
        location="Bengaluru, Karnataka (Hybrid)",
        work_mode=WorkMode.HYBRID,
        salary_or_stipend="₹35,000 / Month",
        min_cgpa=7.5,
        eligible_branches="Computer Science, Information Technology, Electronics",
        required_skills_json=["Python", "FastAPI", "SQL", "Git"],
        preferred_skills_json=["Docker", "System Design"],
        experience_required="Fresher / 0-1 Year",
        deadline=datetime.now(timezone.utc) + timedelta(days=30),
        status=OpportunityStatus.OPEN
    )
    opp_ai = Opportunity(
        organization_id=infosys_labs.id,
        type=OpportunityType.JOB,
        title="Associate AI Systems Engineer",
        description="Deploy scalable transformer inference pipelines, optimize embeddings with pgvector, and build robust REST APIs for enterprise clients.",
        raw_job_description="Looking for an Associate AI Systems Engineer skilled in Python, Machine Learning, Deep Learning, and REST APIs. Minimum 7.0 CGPA.",
        location="Bengaluru, Karnataka (On-Site)",
        work_mode=WorkMode.ON_SITE,
        salary_or_stipend="₹8,50,000 / Annum",
        min_cgpa=7.0,
        eligible_branches="Computer Science, IT, Data Science",
        required_skills_json=["Python", "Machine Learning", "REST APIs"],
        preferred_skills_json=["Deep Learning", "Docker"],
        experience_required="Fresher / 0-1 Year",
        deadline=datetime.now(timezone.utc) + timedelta(days=45),
        status=OpportunityStatus.OPEN
    )
    db.add_all([opp_backend, opp_ai])
    db.flush()

    # Pre-seed Application for Rahul Sharma -> Tata Research
    app_rahul = Application(
        opportunity_id=opp_backend.id,
        student_id=stud_prof_1.id,
        status=ApplicationStatus.SHORTLISTED,
        cover_letter="I have built asynchronous microservices using FastAPI and PostgreSQL, and achieved 92% in platform skill assessments.",
        applied_at=datetime.now(timezone.utc) - timedelta(days=2)
    )
    db.add(app_rahul)

    # Pre-seed Candidate Matches
    match_rahul = CandidateMatch(
        opportunity_id=opp_backend.id,
        student_id=stud_prof_1.id,
        match_percentage=91.4,
        skill_score=94.0,
        eligibility_score=100.0,
        assessment_score=88.5,
        explanation_json={
            "student_id": stud_prof_1.id,
            "match_percentage": 91.4,
            "skill_score": 94.0,
            "eligibility_score": 100.0,
            "assessment_score": 88.5,
            "strong_matches": [
                {"skill": "Python", "score": 92.0, "is_verified": True},
                {"skill": "FastAPI", "score": 88.0, "is_verified": True},
                {"skill": "SQL", "score": 91.0, "is_verified": True},
                {"skill": "Git", "score": 95.0, "is_verified": True},
            ],
            "skill_gaps": ["Docker"],
            "evidence_explanation": "Rahul Sharma is an exceptional fit (91% match) for Backend Engineering Research Intern. Demonstrates verified mastery in Python, FastAPI, and SQL with a 8.85 CGPA. Minor development area: Docker."
        }
    )
    match_arjun = CandidateMatch(
        opportunity_id=opp_backend.id,
        student_id=stud_prof_3.id,
        match_percentage=78.2,
        skill_score=75.0,
        eligibility_score=100.0,
        assessment_score=70.0,
        explanation_json={
            "student_id": stud_prof_3.id,
            "match_percentage": 78.2,
            "skill_score": 75.0,
            "eligibility_score": 100.0,
            "assessment_score": 70.0,
            "strong_matches": [{"skill": "Python", "score": 75.0, "is_verified": False}],
            "skill_gaps": ["FastAPI", "SQL"],
            "evidence_explanation": "Arjun Mehta meets academic criteria with a 7.65 CGPA. Moderate development areas in FastAPI and production SQL."
        }
    )
    db.add_all([match_rahul, match_arjun])

    # 8. WORKSHOPS
    ws1 = Workshop(
        organization_id=tata_res.id,
        title="Building Resilient Multi-Agent AI & High-Throughput Microservices",
        description="Hands-on masterclass with senior research scientists from Tata Research on architecting asynchronous microservice backends.",
        speaker="Dr. Aniruddh Basu (Principal Scientist, TCS Research)",
        category="Software Architecture",
        date_time=datetime.now(timezone.utc) + timedelta(days=7),
        duration_hours=2.5,
        capacity=200,
        mode=WorkshopMode.ONLINE,
        meeting_url="https://meet.ecosystem.gov.in/tcs-research-workshop"
    )
    ws2 = Workshop(
        organization_id=infosys_labs.id,
        title="Cloud-Native Kubernetes & Docker Microservices Masterclass",
        description="Fast-track workshop designed to bridge student containerization gaps with live AWS and Docker environments.",
        speaker="Pooja Kulkarni (Chief Cloud Architect, Infosys Labs)",
        category="DevOps & Cloud",
        date_time=datetime.now(timezone.utc) + timedelta(days=12),
        duration_hours=3.0,
        capacity=150,
        mode=WorkshopMode.HYBRID,
        meeting_url="https://meet.ecosystem.gov.in/infosys-cloud-masterclass"
    )
    db.add_all([ws1, ws2])

    # 9. RESEARCH PAPERS & GRANTS
    paper_1 = ResearchPaper(
        faculty_id=fac_profile_1.id,
        title="Resilient Microservice Fault-Tolerance Mechanisms in Distributed Cloud Topologies",
        abstract="In this paper, we propose an adaptive circuit breaker and consensus-driven retry mechanism for national-scale microservice architectures that reduces cascading latency spikes by 43%.",
        authors="Rajesh Sharma, K. Narayanan, Vikramaditya Sen",
        journal="IEEE Transactions on Cloud Computing, Vol. 14, 2025",
        publication_date=datetime(2025, 11, 15),
        doi="10.1109/TCC.2025.1092817",
        keywords_json=["Distributed Systems", "Cloud Computing", "Fault Tolerance", "Microservices"]
    )
    paper_2 = ResearchPaper(
        faculty_id=fac_profile_2.id,
        title="Sub-Word Transformer Distillation for Multilingual Low-Resource NLP",
        abstract="We demonstrate a novel knowledge distillation pipeline achieving 94% BERT performance with 65% fewer parameters across 14 Indic languages.",
        authors="Sunita Verma, R. Deshmukh",
        journal="ACM Transactions on Asian and Low-Resource Language Information Processing, 2026",
        publication_date=datetime(2026, 1, 20),
        doi="10.1145/3610291.3610299",
        keywords_json=["NLP", "Transformers", "Knowledge Distillation", "Indic Languages"]
    )
    db.add_all([paper_1, paper_2])

    grant_1 = Grant(
        title="SERB Core Research Grant - Resilient National Digital Infrastructure",
        funding_agency="Science and Engineering Research Board (SERB), Govt. of India",
        domain="Computer Science & Information Engineering",
        funding_amount="₹45,00,000",
        deadline=datetime.now(timezone.utc) + timedelta(days=60),
        description="Grants for high-impact foundational research in resilient distributed computing, cybersecurity, and fault-tolerant cloud backends for national platforms.",
        eligibility="Faculty members holding regular academic appointments at recognized Indian universities/institutions.",
        application_url="https://serbonline.in"
    )
    grant_2 = Grant(
        title="DST Cyber-Physical Systems & Edge AI Innovation Scheme",
        funding_agency="Department of Science & Technology (DST)",
        domain="Artificial Intelligence & IoT",
        funding_amount="₹65,00,000",
        deadline=datetime.now(timezone.utc) + timedelta(days=90),
        description="Fostering collaborative industry-academia R&D in edge machine learning and intelligent sensor nodes.",
        eligibility="Joint proposals from academia and industry R&D laboratories.",
        application_url="https://dst.gov.in"
    )
    db.add_all([grant_1, grant_2])

    # 10. SYSTEM NOTIFICATIONS
    note_rahul = Notification(
        user_id=user_stud_1.id,
        type=NotificationType.APPLICATION_UPDATE,
        title="Application Shortlisted!",
        message="Your application for 'Backend Engineering Research Intern' at Tata Consultancy Research has been shortlisted for an interview.",
        link="/student/applications"
    )
    note_admin = Notification(
        user_id=user_admin.id,
        type=NotificationType.SYSTEM,
        title="Pending Industry Verification",
        message="Apex Cloud Systems has registered and requested verification approval.",
        link="/admin/verifications"
    )
    db.add_all([note_rahul, note_admin])

    db.commit()
    print(">>> Database successfully seeded with full multi-role ecosystem entities!")
