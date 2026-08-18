from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import MatchRequest, User
from app.schemas import MatchRequestCreate, MatchRequestRespond, MatchRequestOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/requests", tags=["Match Requests"])

@router.post("/send", response_model=MatchRequestOut)
def send_match_request(
    req_in: MatchRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if req_in.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot send a swap request to yourself.")

    receiver = db.query(User).filter(User.id == req_in.receiver_id, User.is_active == True).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient user not found.")

    # Check existing pending or accepted request
    existing = db.query(MatchRequest).filter(
        MatchRequest.sender_id == current_user.id,
        MatchRequest.receiver_id == req_in.receiver_id,
        MatchRequest.status.in_(["pending", "accepted"])
    ).first()

    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="You are already connected with this user!")
        else:
            raise HTTPException(status_code=400, detail="A pending swap request is already sent to this user.")

    new_request = MatchRequest(
        sender_id=current_user.id,
        receiver_id=req_in.receiver_id,
        offered_skill_name=req_in.offered_skill_name,
        wanted_skill_name=req_in.wanted_skill_name,
        message=req_in.message or "Hey! I'd love to swap skills with you."
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.get("/incoming", response_model=List[MatchRequestOut])
def get_incoming_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    requests = db.query(MatchRequest).filter(
        MatchRequest.receiver_id == current_user.id,
        MatchRequest.status == "pending"
    ).order_by(MatchRequest.created_at.desc()).all()
    return requests

@router.get("/outgoing", response_model=List[MatchRequestOut])
def get_outgoing_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    requests = db.query(MatchRequest).filter(
        MatchRequest.sender_id == current_user.id
    ).order_by(MatchRequest.created_at.desc()).all()
    return requests

@router.post("/{request_id}/respond", response_model=MatchRequestOut)
def respond_to_request(
    request_id: int,
    respond_in: MatchRequestRespond,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(MatchRequest).filter(
        MatchRequest.id == request_id,
        MatchRequest.receiver_id == current_user.id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")

    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}.")

    action = respond_in.action.lower()
    if action not in ["accept", "decline"]:
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'decline'.")

    req.status = "accepted" if action == "accept" else "declined"
    db.commit()
    db.refresh(req)
    return req

@router.delete("/{request_id}")
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(MatchRequest).filter(
        MatchRequest.id == request_id,
        MatchRequest.sender_id == current_user.id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")

    db.delete(req)
    db.commit()
    return {"message": "Request cancelled successfully."}
