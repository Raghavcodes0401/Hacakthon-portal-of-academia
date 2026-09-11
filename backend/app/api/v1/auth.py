from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.audit import record_audit_log
from app.core.permissions import get_current_user
from app.models import (
    User, UserRole, Organization, OrgType, OrgVerificationStatus,
    StudentProfile, FacultyProfile, IndustryProfile, Notification, NotificationType
)
from app.schemas import UserRegister, UserLogin, Token, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(req: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    org_id = None
    if req.organization_name:
        org = db.query(Organization).filter(Organization.name == req.organization_name.strip()).first()
        if not org:
            # Determine org type based on user role
            default_org_type = OrgType.INDUSTRY if req.role == UserRole.INDUSTRY_USER else OrgType.INSTITUTION
            org_type = req.organization_type or default_org_type
            # Institutions and industries start as PENDING verification
            initial_status = OrgVerificationStatus.PENDING
            org = Organization(
                name=req.organization_name.strip(),
                type=org_type,
                verification_status=initial_status
            )
            db.add(org)
            db.flush()
        org_id = org.id

    # Create User
    new_user = User(
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        role=req.role,
        organization_id=org_id,
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    db.flush()

    # Create Role-specific Profile
    if req.role == UserRole.STUDENT:
        student = StudentProfile(user_id=new_user.id)
        db.add(student)
    elif req.role == UserRole.FACULTY:
        faculty = FacultyProfile(user_id=new_user.id)
        db.add(faculty)
    elif req.role == UserRole.INDUSTRY_USER:
        industry = IndustryProfile(user_id=new_user.id)
        db.add(industry)

    # Welcome Notification
    welcome_note = Notification(
        user_id=new_user.id,
        type=NotificationType.SYSTEM,
        title="Welcome to the Ecosystem!",
        message="Your account has been created. Complete your profile and explore opportunities."
    )
    db.add(welcome_note)

    # Audit Log
    record_audit_log(
        db=db,
        action="USER_REGISTER",
        entity_type="USER",
        entity_id=new_user.id,
        user_id=new_user.id,
        details={"role": req.role.value, "email": new_user.email}
    )

    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(new_user.id, new_user.role.value)
    refresh_token = create_refresh_token(new_user.id, new_user.role.value)

    user_data = {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role.value,
        "organization_id": new_user.organization_id,
        "organization_name": new_user.organization.name if new_user.organization else None,
        "organization_verified": (new_user.organization.verification_status == OrgVerificationStatus.VERIFIED) if new_user.organization else False
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/login", response_model=Token)
def login(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended or deactivated. Contact platform support."
        )

    # Record login audit
    record_audit_log(
        db=db,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=user.id,
        user_id=user.id,
        details={"email": user.email, "role": user.role.value}
    )

    access_token = create_access_token(user.id, user.role.value)
    refresh_token = create_refresh_token(user.id, user.role.value)

    user_data = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "organization_id": user.organization_id,
        "organization_name": user.organization.name if user.organization else None,
        "organization_verified": (user.organization.verification_status == OrgVerificationStatus.VERIFIED) if user.organization else False
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/refresh")
def refresh_token(token_str: str, db: Session = Depends(get_db)):
    payload = decode_token(token_str)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer active"
        )
    
    new_access = create_access_token(user.id, user.role.value)
    return {"access_token": new_access, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    org_name = current_user.organization.name if current_user.organization else None
    org_status = current_user.organization.verification_status.value if current_user.organization else None

    profile_id = None
    if current_user.student_profile:
        profile_id = current_user.student_profile.id
    elif current_user.faculty_profile:
        profile_id = current_user.faculty_profile.id
    elif current_user.industry_profile:
        profile_id = current_user.industry_profile.id

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "organization_id": current_user.organization_id,
        "organization_name": org_name,
        "organization_status": org_status,
        "organization_verified": org_status == OrgVerificationStatus.VERIFIED.value,
        "profile_id": profile_id,
        "created_at": current_user.created_at
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record_audit_log(
        db=db,
        action="USER_LOGOUT",
        entity_type="USER",
        entity_id=current_user.id,
        user_id=current_user.id
    )
    return {"message": "Successfully logged out"}
