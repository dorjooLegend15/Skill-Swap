import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from app.core.database import get_db
from app.core.config import settings
from app.models import Message, User
from app.schemas import MessageCreate, MessageOut, UserPublicOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages & Media"])

@router.get("/conversations/recent")
def get_recent_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all conversation partners with the last message and unread count.
    """
    # Find all users that current_user has exchanged messages with
    sent_to = db.query(Message.receiver_id).filter(Message.sender_id == current_user.id).distinct().all()
    received_from = db.query(Message.sender_id).filter(Message.receiver_id == current_user.id).distinct().all()

    partner_ids = set([r[0] for r in sent_to] + [r[0] for r in received_from])
    
    conversations = []
    for pid in partner_ids:
        partner = db.query(User).filter(User.id == pid, User.is_active == True).first()
        if not partner:
            continue

        # Get last message
        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == pid),
                and_(Message.sender_id == pid, Message.receiver_id == current_user.id)
            )
        ).order_by(desc(Message.created_at)).first()

        # Count unread
        unread_count = db.query(Message).filter(
            Message.sender_id == pid,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()

        conversations.append({
            "partner": {
                "id": partner.id,
                "full_name": partner.full_name,
                "avatar": partner.avatar,
                "headline": partner.headline,
                "rating": partner.rating
            },
            "last_message": {
                "id": last_msg.id,
                "content": last_msg.content,
                "msg_type": last_msg.msg_type,
                "created_at": last_msg.created_at,
                "sender_id": last_msg.sender_id
            } if last_msg else None,
            "unread_count": unread_count
        })

    # Sort by last message date descending
    conversations.sort(
        key=lambda c: c["last_message"]["created_at"] if c["last_message"] else 0,
        reverse=True
    )
    return conversations

@router.get("/{partner_id}", response_model=List[MessageOut])
def get_message_history(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Mark messages as read
    db.query(Message).filter(
        Message.sender_id == partner_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == partner_id),
            and_(Message.sender_id == partner_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.asc()).all()

    return messages

@router.post("/send", response_model=MessageOut)
def send_message_rest(
    msg_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    receiver = db.query(User).filter(User.id == msg_in.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient not found")

    new_msg = Message(
        sender_id=current_user.id,
        receiver_id=msg_in.receiver_id,
        content=msg_in.content,
        msg_type=msg_in.msg_type or "text",
        file_url=msg_in.file_url,
        file_name=msg_in.file_name,
        file_size=msg_in.file_size,
        audio_duration=msg_in.audio_duration
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@router.post("/upload")
async def upload_chat_media(
    file: UploadFile = File(...),
    media_type: str = Form("file"), # photo, audio, file
    audio_duration: Optional[float] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """
    Handle uploads of photos, voice note audio recordings, and folders/documents.
    """
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"

    subfolder = "documents"
    if media_type == "photo" or ext.lower() in [".png", ".jpg", ".jpeg", ".webp", ".gif"]:
        subfolder = "photos"
        media_type = "photo"
    elif media_type == "audio" or ext.lower() in [".webm", ".mp3", ".wav", ".ogg", ".m4a"]:
        subfolder = "audio"
        media_type = "audio"

    save_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, unique_filename)

    file_size = 0
    async with aiofiles.open(file_path, "wb") as out_file:
        while content := await file.read(1024 * 1024):
            file_size += len(content)
            await out_file.write(content)

    file_url = f"/uploads/{subfolder}/{unique_filename}"

    return {
        "file_url": file_url,
        "file_name": file.filename,
        "file_size": file_size,
        "media_type": media_type,
        "audio_duration": audio_duration
    }
