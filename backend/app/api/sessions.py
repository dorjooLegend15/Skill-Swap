from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from app.core.database import get_db
from app.models import SwapSession, Review, User
from app.schemas import SwapSessionCreate, SwapSessionOut, ReviewCreate, ReviewOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/sessions", tags=["Swap Sessions & Reviews"])

@router.post("/", response_model=SwapSessionOut)
def schedule_session(
    sess_in: SwapSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    partner = db.query(User).filter(User.id == sess_in.partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    new_sess = SwapSession(
        creator_id=current_user.id,
        partner_id=sess_in.partner_id,
        title=sess_in.title,
        skill_taught=sess_in.skill_taught,
        skill_learned=sess_in.skill_learned,
        scheduled_time=sess_in.scheduled_time,
        duration_minutes=sess_in.duration_minutes or 60,
        notes=sess_in.notes or "",
        status="scheduled"
    )
    db.add(new_sess)
    db.commit()
    db.refresh(new_sess)
    return new_sess

@router.get("/", response_model=List[SwapSessionOut])
def get_my_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(SwapSession).filter(
        or_(
            SwapSession.creator_id == current_user.id,
            SwapSession.partner_id == current_user.id
        )
    ).order_by(SwapSession.scheduled_time.desc()).all()
    return sessions

@router.post("/review")
def leave_review(
    rev_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if rev_in.reviewee_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot review yourself.")

    reviewee = db.query(User).filter(User.id == rev_in.reviewee_id).first()
    if not reviewee:
        raise HTTPException(status_code=404, detail="Reviewee not found")

    new_review = Review(
        reviewer_id=current_user.id,
        reviewee_id=rev_in.reviewee_id,
        session_id=rev_in.session_id,
        rating=rev_in.rating,
        comment=rev_in.comment,
        skill_name=rev_in.skill_name
    )
    db.add(new_review)

    # Recalculate average rating
    all_reviews = db.query(Review).filter(Review.reviewee_id == rev_in.reviewee_id).all()
    ratings = [r.rating for r in all_reviews] + [rev_in.rating]
    reviewee.rating = round(sum(ratings) / len(ratings), 1)
    reviewee.review_count = len(ratings)
    reviewee.hours_swapped += 1.0

    db.commit()
    return {"message": "Review submitted successfully!"}
