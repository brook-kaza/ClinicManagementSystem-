from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import models
from database import get_db
from auth import get_current_active_user, RoleChecker, get_password_hash

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

admin_only = RoleChecker(["Admin"])

@router.get("/doctors", response_model=List[schemas.UserRead])
def read_doctors(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """List all active doctors (Admin and Dentist) for appointment booking, billing, and report filtering."""
    return db.query(models.User).filter(
        models.User.is_active == True,
        models.User.role.in_(["Admin", "Dentist"])
    ).order_by(models.User.full_name).all()

@router.get("", response_model=List[schemas.UserRead])
def read_users(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """Admin-only: List all staff members."""
    return crud.get_users(db, skip=skip, limit=limit)

@router.post("", response_model=schemas.UserRead, status_code=201)
def create_staff_user(
    user: schemas.UserCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """Admin-only: Create a new staff account (Receptionist, Dentist, or additional Admin)."""
    # Validate role
    valid_roles = ["Admin", "Dentist", "Receptionist"]
    if user.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    return crud.create_user(db=db, user=user, hashed_password=hashed_password)

@router.put("/{user_id}/password", response_model=schemas.UserRead)
def reset_user_password(
    user_id: int, 
    password_reset: schemas.UserPasswordReset, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """Admin-only: Force reset another user's password."""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    hashed_password = get_password_hash(password_reset.new_password)
    return crud.update_user_password(db=db, user=db_user, hashed_password=hashed_password)

@router.put("/{user_id}/role", response_model=schemas.UserRead)
def update_user_role(
    user_id: int, 
    user_update: schemas.UserUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """Admin-only: Promote, demote, or deactivate a user."""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate role if provided
    valid_roles = ["Admin", "Dentist", "Receptionist"]
    if user_update.role is not None and user_update.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
    # Prevent admin from deactivating themselves or changing their own role
    if db_user.id == current_user.id:
        if user_update.is_active is False:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
        if user_update.role is not None and user_update.role != current_user.role:
            raise HTTPException(status_code=400, detail="Cannot change your own access role")
        
    return crud.update_user_details(db=db, user=db_user, user_update=user_update)

@router.put("/me/password", response_model=schemas.UserRead)
def update_own_password(
    password_reset: schemas.UserPasswordReset, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """All users: Change their own password."""
    hashed_password = get_password_hash(password_reset.new_password)
    return crud.update_user_password(db=db, user=current_user, hashed_password=hashed_password)
