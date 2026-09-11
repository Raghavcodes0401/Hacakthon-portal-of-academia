#!/usr/bin/env python3
"""
SETU - Database Inspector Utility
Dumps formatted relational tables of all Students, Faculty, Institutions, Companies, and User Accounts.
Can be executed directly via:
    python inspect_db.py
"""

import sys
import os

# Ensure backend directory is on sys.path and is current working dir
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from app.core.database import SessionLocal
from app.models import (
    User, UserRole, Organization, StudentProfile, FacultyProfile,
    IndustryProfile, CompetencyProfile, Opportunity, AuditLog
)

def print_table(title: str, headers: list, rows: list):
    print("\n" + "=" * 100)
    print(f"  SETU MASTER DATABASE: {title.upper()} ({len(rows)} Records)")
    print("=" * 100)

    if not rows:
        print("  [No records found]")
        return

    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(val)))

    # Header row
    header_str = " | ".join(f"{h:<{col_widths[i]}}" for i, h in enumerate(headers))
    print(f"| {header_str} |")
    print("|-" + "-|-".join("-" * col_widths[i] for i in range(len(headers))) + "-|")

    # Data rows
    for row in rows:
        row_str = " | ".join(f"{str(val):<{col_widths[i]}}" for i, val in enumerate(row))
        print(f"| {row_str} |")


def inspect():
    db = SessionLocal()
    try:
        # 1. USERS & LOGINS TABLE
        users = db.query(User).order_by(User.created_at.desc()).all()
        user_rows = []
        for u in users:
            org_name = u.organization.name if u.organization else "Independent"
            last_audit = db.query(AuditLog).filter(AuditLog.user_id == u.id).order_by(AuditLog.created_at.desc()).first()
            action = last_audit.action if last_audit else "REGISTERED"
            status = "ACTIVE" if u.is_active else "SUSPENDED"
            user_rows.append([
                u.full_name[:20],
                u.email,
                u.role.value,
                status,
                org_name[:25],
                action[:20]
            ])
        print_table("1. All Registered Users & Logins", ["Name", "Email", "Role", "Status", "Organization", "Last Action"], user_rows)

        # 2. STUDENTS TABLE
        students = db.query(StudentProfile).all()
        student_rows = []
        for s in students:
            competencies = db.query(CompetencyProfile).filter(CompetencyProfile.student_id == s.id).all()
            avg_score = f"{sum(c.score for c in competencies) / len(competencies):.1f}%" if competencies else "Pending Test"
            student_rows.append([
                s.user.full_name if s.user else "N/A",
                s.user.email if s.user else "N/A",
                s.user.organization.name[:20] if (s.user and s.user.organization) else "Independent",
                f"{s.degree} - {s.department}"[:22],
                f"Sem {s.semester}",
                f"{s.cgpa:.2f}",
                avg_score,
                s.target_career or "General"
            ])
        print_table("2. Student Profiles & Assessment Records", ["Student", "Email", "Institution", "Degree & Dept", "Sem", "CGPA", "Score", "Target Career"], student_rows)

        # 3. FACULTY TABLE
        faculty = db.query(FacultyProfile).all()
        faculty_rows = []
        for f in faculty:
            faculty_rows.append([
                f.user.full_name if f.user else "N/A",
                f.user.email if f.user else "N/A",
                f.user.organization.name[:20] if (f.user and f.user.organization) else "Independent",
                f.department[:18],
                f.designation[:18],
                f.orcid_id or "N/A"
            ])
        print_table("3. Faculty Profiles", ["Name", "Email", "Institution", "Department", "Designation", "ORCID iD"], faculty_rows)

        # 4. INSTITUTIONS TABLE
        institutions = db.query(Organization).filter(Organization.type == "INSTITUTION").all()
        inst_rows = []
        for i in institutions:
            std_cnt = sum(1 for u in i.users if u.role == UserRole.STUDENT)
            fac_cnt = sum(1 for u in i.users if u.role == UserRole.FACULTY)
            inst_rows.append([
                i.name[:30],
                i.verification_status.value,
                i.location or "India",
                std_cnt,
                fac_cnt,
                i.website or "N/A"
            ])
        print_table("4. Higher Education Institutions", ["Institution Name", "Status", "Location", "Students", "Faculty", "Website"], inst_rows)

        # 5. COMPANIES & INDUSTRY PARTNERS TABLE
        companies = db.query(Organization).filter(Organization.type == "INDUSTRY").all()
        comp_rows = []
        for c in companies:
            opp_cnt = db.query(Opportunity).filter(Opportunity.organization_id == c.id).count()
            comp_rows.append([
                c.name[:25],
                c.verification_status.value,
                c.location or "India",
                opp_cnt,
                len(c.users),
                c.website or "N/A"
            ])
        print_table("5. Corporate Partners & Industry", ["Company Name", "Status", "Location", "Jobs/Internships", "Recruiters", "Website"], comp_rows)

        print("\n" + "=" * 100)
        print("  Inspection completed successfully. Data is live in the SQL database.")
        print("=" * 100 + "\n")

    finally:
        db.close()

if __name__ == "__main__":
    inspect()
