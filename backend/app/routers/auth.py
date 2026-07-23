from fastapi import APIRouter, HTTPException, status
from app.schemas.user import Token, UserCreate
from app.core.security import create_access_token

router = APIRouter()

@router.post("/login", response_model=Token)
def login():
    # Placeholder login logic for initialization phase
    token = create_access_token(subject="demo_user_id")
    return {"access_token": token, "token_type": "bearer"}

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate):
    # Placeholder register logic
    return {"message": "User registered successfully", "email": user_in.email}
