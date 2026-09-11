import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.db.seed import seed_database_if_empty

client = TestClient(app)

def test_healthcheck():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_student():
    response = client.post("/api/v1/auth/login", json={
        "email": "rahul.sharma@student.iitd.ac.in",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "STUDENT"

def test_login_wrong_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "rahul.sharma@student.iitd.ac.in",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_rbac_student_cannot_access_admin_stats():
    # Login as student
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul.sharma@student.iitd.ac.in",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    
    # Attempt to access admin stats
    res = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_admin_access_stats():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@ecosystem.gov.in",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    
    res = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total_users"] >= 5
    assert data["total_opportunities"] >= 2

def test_student_competency_dashboard():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul.sharma@student.iitd.ac.in",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    res = client.get("/api/v1/students/competency", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "competencies" in data
    assert "skill_gaps" in data
    assert "swot" in data
    assert len(data["competencies"]) > 0

def test_opportunity_matches():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "recruiter@tata-research.com",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    # Get opportunities
    opp_res = client.get("/api/v1/opportunities", headers={"Authorization": f"Bearer {token}"})
    assert opp_res.status_code == 200
    opps = opp_res.json()
    assert len(opps) > 0
    opp_id = opps[0]["id"]

    # Get candidate matches
    matches_res = client.get(f"/api/v1/opportunities/{opp_id}/matches", headers={"Authorization": f"Bearer {token}"})
    assert matches_res.status_code == 200
    matches = matches_res.json()
    assert len(matches) > 0
    top_match = matches[0]
    assert "match_percentage" in top_match
    assert "evidence_explanation" in top_match
    assert top_match["match_percentage"] > 50

def test_unverified_industry_cannot_post_opportunity():
    # Login as pending industry user
    login_res = client.post("/api/v1/auth/login", json={
        "email": "founder@apexcloud.io",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    post_res = client.post("/api/v1/opportunities", json={
        "type": "JOB",
        "title": "Unverified Job",
        "description": "Should fail",
        "required_skills_json": ["Kubernetes"]
    }, headers={"Authorization": f"Bearer {token}"})
    assert post_res.status_code == 403
    assert "pending verification" in post_res.json()["detail"].lower()

def test_ai_requirement_extractor():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "recruiter@tata-research.com",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    raw_text = "We are seeking a Python and FastAPI Backend Developer with PostgreSQL and Docker skills. Minimum 7.5 CGPA required."
    res = client.post("/api/v1/opportunities/analyze-requirements", json={
        "raw_job_description": raw_text
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "Python" in data["required_skills"]
    assert "FastAPI" in data["required_skills"]
    assert data["min_cgpa"] == 7.5

def test_upload_and_publish_research_paper():
    import io
    login_res = client.post("/api/v1/auth/login", json={
        "email": "dr.sharma@iitd.ac.in",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Upload Document
    file_bytes = b"%PDF-1.4 Simulated Peer Reviewed Research Manuscript"
    files = {"file": ("distributed_resilience.pdf", io.BytesIO(file_bytes), "application/pdf")}
    upload_res = client.post("/api/v1/faculty/research-papers/upload", headers=headers, files=files)
    assert upload_res.status_code == 200
    doc_url = upload_res.json()["file_url"]
    assert doc_url.startswith("/uploads/")

    # 2. Publish Paper with doc_url
    pub_res = client.post("/api/v1/faculty/research-papers", headers=headers, json={
        "title": "Empirical Study on Distributed Resilience",
        "abstract": "We evaluate fault tolerance under heavy concurrency in distributed cloud nodes.",
        "authors": "Dr. Rajesh Sharma",
        "journal": "National Research Journal 2026",
        "doi": "10.1109/NRJ.2026.01",
        "pdf_url": doc_url,
        "keywords_json": ["Cloud", "Resilience"]
    })
    assert pub_res.status_code == 201

    # 3. Retrieve document via static route
    doc_res = client.get(doc_url)
    assert doc_res.status_code == 200
    assert doc_res.content == file_bytes
