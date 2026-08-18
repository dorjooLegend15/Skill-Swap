from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models import User
from app.schemas import ChatbotMessageRequest, ChatbotMessageResponse
from app.api.deps import get_optional_current_user
from app.ml.chatbot_engine import chatbot_engine

router = APIRouter(prefix="/chatbot", tags=["AI Chatbot"])

@router.post("/message", response_model=ChatbotMessageResponse)
def handle_chatbot_interaction(
    payload: ChatbotMessageRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    result = chatbot_engine.process_message(
        db=db,
        current_user=current_user,
        user_message=payload.message,
        chat_history=payload.history
    )
    return result
