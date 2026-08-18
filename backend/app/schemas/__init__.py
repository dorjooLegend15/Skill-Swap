from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    headline: Optional[str] = "Eager to teach & learn"
    location: Optional[str] = "Remote / Global"
    timezone: Optional[str] = "UTC"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Any

# Skill Schemas
class SkillOfferedCreate(BaseModel):
    skill_name: str
    category: Optional[str] = "General"
    proficiency_level: Optional[str] = "intermediate"
    years_experience: Optional[float] = 1.0
    description: Optional[str] = ""
    portfolio_link: Optional[str] = None

class SkillOfferedOut(SkillOfferedCreate):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class SkillWantedCreate(BaseModel):
    skill_name: str
    category: Optional[str] = "General"
    target_level: Optional[str] = "intermediate"
    priority: Optional[str] = "medium"
    goals: Optional[str] = ""

class SkillWantedOut(SkillWantedCreate):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# User Schemas
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    avatar: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    reviewer_avatar: Optional[str] = None
    rating: float
    comment: str
    skill_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    avatar: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    rating: float
    review_count: int
    hours_swapped: float
    skills_offered: List[SkillOfferedOut] = []
    skills_wanted: List[SkillWantedOut] = []
    created_at: datetime

    class Config:
        from_attributes = True

class UserPublicOut(BaseModel):
    id: int
    full_name: str
    avatar: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    rating: float
    review_count: int
    hours_swapped: float
    skills_offered: List[SkillOfferedOut] = []
    skills_wanted: List[SkillWantedOut] = []
    compatibility_score: Optional[float] = None
    match_reasons: Optional[List[str]] = []

    class Config:
        from_attributes = True

# Match Request Schemas
class MatchRequestCreate(BaseModel):
    receiver_id: int
    offered_skill_name: str
    wanted_skill_name: str
    message: Optional[str] = "Hey! I saw your profile and would love to exchange skills."

class MatchRequestRespond(BaseModel):
    action: str  # "accept" or "decline"

class MatchRequestOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    offered_skill_name: str
    wanted_skill_name: str
    message: str
    status: str
    created_at: datetime
    updated_at: datetime
    sender: Optional[UserPublicOut] = None
    receiver: Optional[UserPublicOut] = None

    class Config:
        from_attributes = True

# Message Schemas
class MessageCreate(BaseModel):
    receiver_id: int
    content: Optional[str] = None
    msg_type: Optional[str] = "text"
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    audio_duration: Optional[float] = None

class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: Optional[str] = None
    msg_type: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    audio_duration: Optional[float] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Session Schemas
class SwapSessionCreate(BaseModel):
    partner_id: int
    title: str
    skill_taught: str
    skill_learned: str
    scheduled_time: datetime
    duration_minutes: Optional[int] = 60
    notes: Optional[str] = ""

class SwapSessionOut(BaseModel):
    id: int
    creator_id: int
    partner_id: int
    title: str
    skill_taught: str
    skill_learned: str
    scheduled_time: datetime
    duration_minutes: int
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    reviewee_id: int
    session_id: Optional[int] = None
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: str
    skill_name: Optional[str] = None

# ChatBot Schemas
class ChatbotMessageRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

class ChatbotActionRecommendation(BaseModel):
    user_id: int
    full_name: str
    avatar: Optional[str] = None
    headline: Optional[str] = None
    match_score: float
    offered_skill: str
    wanted_skill: str
    match_reason: str
    match_type: Optional[str] = "bilateral"  # 'bilateral', 'mentor', 'learner', 'study_buddy'
    match_badge: Optional[str] = "🔄 Харилцан солилцох"

class ChatbotMessageResponse(BaseModel):
    reply: str
    extracted_skills_offered: List[str] = []
    extracted_skills_wanted: List[str] = []
    recommendations: List[ChatbotActionRecommendation] = []
    intent: str
    powered_by: Optional[str] = "local_ml"
