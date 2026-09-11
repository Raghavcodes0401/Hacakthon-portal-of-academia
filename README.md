# SETU — Structural Education Transformation Union
### AI-Powered National Academic, Research & Industry Ecosystem

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-800020?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

> *"Education makes life self-reliant. It inspires man to live with dignity in the society."*
> — **Shri Narendra Modi**, *Hon'ble Prime Minister of India*

A unified national digital platform connecting **Students ↔ Faculty ↔ Higher Education Institutions ↔ Industry Partners ↔ Research Discovery**. 

Built with a production-grade full-stack architecture where every frontend user action directly queries backend APIs, enforces strict role-based access control (RBAC), and interacts with normalized relational database models.

---

## Key Highlights & Grounded AI Capabilities

1. **Deterministic Assessment Scoring**:
   - Scores are never hallucinated by LLMs.
   - Question points, accuracy, and skill weights are calculated via deterministic evaluation logic.
   - Updates student competency radar profiles across individual skills (Python, SQL, FastAPI, Docker, System Design, etc.).

2. **Skill-Gap Analysis & SWOT Generation**:
   - Automated comparison between student competency scores and target career profiles (Backend Engineer, Data Scientist, Full Stack, Cloud/DevOps).
   - Identifies Critical (<40%), Moderate (40-69%), Minor (70-84%), and Sufficient (>=85%) gaps with actionable institutional recommendations.
   - Generates grounded SWOT analysis directly anchored to assessment scores.

3. **Natural Language Job Requirement Extraction**:
   - Industry recruiters paste unstructured job descriptions.
   - AI extracts required skills, preferred skills, CGPA cutoffs, degree requirements, and work modes.
   - Provides a human-in-the-loop review interface so recruiters can inspect and modify before publishing.

4. **Explainable AI Candidate Matching**:
   - Transparent weighted ranking algorithm:
     - Technical Skills: 35%
     - Eligibility (Degree / Branch): 20%
     - Assessment Competency: 20%
     - Academic Performance (CGPA): 15%
     - Experience / Projects: 10%
   - Recruiters see exact match breakdown, verified skill scores, missing gaps, and evidence-based rationale.

5. **Research Synergy & Collaborator Matching**:
   - Semantic analysis over faculty research interests, published paper abstracts, and keywords.
   - Recommends collaborators across Indian institutions (IITs, NITs, Central Universities) with explicit rationale.

6. **Institutional Verification & Governance**:
   - Multi-tier verification workflow (`PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`).
   - Unverified industry partners are blocked by backend middleware from posting opportunities.
   - Immutable audit logging for administrative and security actions.

---

## Pre-Seeded Demonstration Accounts

For local demonstration and evaluation, the database comes pre-seeded with rich, realistic data and 5 preconfigured role accounts:

| Role | Email | Password | Pre-Loaded Context |
| :--- | :--- | :--- | :--- |
| **Student** | `rahul.sharma@student.iitd.ac.in` | `Password123!` | IIT Delhi B.Tech, 8.85 CGPA, assessed skills, competency radar, shortlisted application |
| **Faculty** | `dr.sharma@iitd.ac.in` | `Password123!` | Lead Systems Researcher, accredited courses, published IEEE papers |
| **Industry** | `recruiter@tata-research.com` | `Password123!` | Tata Consultancy Research (Verified), active opportunities, candidate ranking |
| **Institution** | `admin@iitd.ac.in` | `Password123!` | Dean Academics, student cohort roster, department-wide competency analytics |
| **Platform Admin** | `admin@ecosystem.gov.in` | `Password123!` | National Administrator, organization accreditation queue, live audit logs |

> **Tip**: On the login page, you can use the **One-Click Demo Profiles** buttons to immediately test any persona without typing credentials!

---

## Architecture & Directory Layout

```
academic-industry-ecosystem/
├── backend/
│   ├── app/
│   │   ├── ai/                 # Grounded AI algorithms & providers
│   │   │   ├── assessment_analyzer.py
│   │   │   ├── candidate_matcher.py
│   │   │   ├── provider.py
│   │   │   ├── requirement_extractor.py
│   │   │   ├── research_recommender.py
│   │   │   └── skill_gap_analyzer.py
│   │   ├── api/v1/             # Modular REST API endpoints
│   │   │   ├── admin.py
│   │   │   ├── assessments.py
│   │   │   ├── auth.py
│   │   │   ├── courses.py
│   │   │   ├── faculty.py
│   │   │   ├── institutions.py
│   │   │   ├── notifications.py
│   │   │   ├── opportunities.py
│   │   │   ├── students.py
│   │   │   └── workshops.py
│   │   ├── core/               # Security, JWT, DB engine, RBAC & Audit
│   │   ├── db/                 # Realistic national seed script
│   │   ├── models/             # SQLAlchemy 2.0 normalized models
│   │   └── schemas/            # Pydantic request/response validation
│   ├── tests/                  # Automated pytest suite
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/          # Admin oversight, verifications, audit stream
│   │   │   ├── faculty/        # Course creator, papers, AI collaborations, grants
│   │   │   ├── industry/       # Job creator, AI extractor, candidate ranking
│   │   │   ├── institution/    # Dean dashboard, student roster, department analytics
│   │   │   ├── student/        # Interactive assessment, radar, jobs, applications
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── components/         # Reusable UI library & Government-grade AppShell
│   │   └── lib/                # API client & AuthContext
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # Production multi-container orchestration
├── .env.example
└── README.md
```

---

## Getting Started Locally

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm

### 1. Run the Backend API Server
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Run the Next.js Frontend
```bash
cd frontend
npm run dev
```
- Open browser: [http://localhost:3000](http://localhost:3000)

### 3. Run Automated Tests
```bash
cd backend
PYTHONPATH=. .venv/bin/pytest tests/test_backend.py -v
```

---

## Production Docker Deployment
```bash
docker-compose up --build
```
This provisions:
1. `postgres`: PostgreSQL 16 database with healthchecks
2. `backend`: FastAPI server running Uvicorn
3. `frontend`: Next.js 14 optimized standalone server
