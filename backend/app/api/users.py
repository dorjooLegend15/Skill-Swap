from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from app.core.database import get_db
from app.models import User, UserSkillOffered, UserSkillWanted, MatchRequest, Review
from app.schemas import (
    UserOut, UserPublicOut, UserProfileUpdate,
    SkillOfferedCreate, SkillOfferedOut,
    SkillWantedCreate, SkillWantedOut,
    ReviewOut
)
from app.api.deps import get_current_user, get_optional_current_user
from app.ml.taxonomy import get_category_for_skill

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/{user_id}", response_model=UserPublicOut)
def get_user_public_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.put("/profile/me", response_model=UserOut)
def update_my_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/skills/offered", response_model=SkillOfferedOut)
def add_skill_offered(
    skill_in: SkillOfferedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto assign category if default General
    cat = skill_in.category
    if not cat or cat == "General":
        cat = get_category_for_skill(skill_in.skill_name)

    new_skill = UserSkillOffered(
        user_id=current_user.id,
        skill_name=skill_in.skill_name.strip(),
        category=cat,
        proficiency_level=skill_in.proficiency_level or "intermediate",
        years_experience=skill_in.years_experience or 1.0,
        description=skill_in.description or "",
        portfolio_link=skill_in.portfolio_link
    )
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill

@router.delete("/skills/offered/{skill_id}")
def delete_skill_offered(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skill = db.query(UserSkillOffered).filter(
        UserSkillOffered.id == skill_id,
        UserSkillOffered.user_id == current_user.id
    ).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    db.delete(skill)
    db.commit()
    return {"message": "Skill deleted successfully"}

@router.post("/skills/wanted", response_model=SkillWantedOut)
def add_skill_wanted(
    skill_in: SkillWantedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cat = skill_in.category
    if not cat or cat == "General":
        cat = get_category_for_skill(skill_in.skill_name)

    new_skill = UserSkillWanted(
        user_id=current_user.id,
        skill_name=skill_in.skill_name.strip(),
        category=cat,
        target_level=skill_in.target_level or "intermediate",
        priority=skill_in.priority or "medium",
        goals=skill_in.goals or ""
    )
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill

@router.delete("/skills/wanted/{skill_id}")
def delete_skill_wanted(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skill = db.query(UserSkillWanted).filter(
        UserSkillWanted.id == skill_id,
        UserSkillWanted.user_id == current_user.id
    ).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    db.delete(skill)
    db.commit()
    return {"message": "Skill removed successfully"}

@router.get("/friends/list", response_model=List[UserPublicOut])
def get_connected_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all users who have an accepted match request with the current user.
    """
    accepted_requests = db.query(MatchRequest).filter(
        MatchRequest.status == "accepted",
        or_(
            MatchRequest.sender_id == current_user.id,
            MatchRequest.receiver_id == current_user.id
        )
    ).all()

    friend_ids = set()
    for req in accepted_requests:
        if req.sender_id == current_user.id:
            friend_ids.add(req.receiver_id)
        else:
            friend_ids.add(req.sender_id)

    if not friend_ids:
        return []

    friends = db.query(User).filter(User.id.in_(list(friend_ids)), User.is_active == True).all()
    return friends

@router.get("/{user_id}/reviews", response_model=List[ReviewOut])
def get_user_reviews(user_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.reviewee_id == user_id).order_by(Review.created_at.desc()).all()
    result = []
    for r in reviews:
        reviewer = db.query(User).filter(User.id == r.reviewer_id).first()
        result.append({
            "id": r.id,
            "reviewer_id": r.reviewer_id,
            "reviewer_name": reviewer.full_name if reviewer else "Anonymous Learner",
            "reviewer_avatar": reviewer.avatar if reviewer else None,
            "rating": r.rating,
            "comment": r.comment,
            "skill_name": r.skill_name,
            "created_at": r.created_at
        })
    return result
