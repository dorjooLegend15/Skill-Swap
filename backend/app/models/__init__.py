import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class ProficiencyLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CANCELLED = "cancelled"

class MessageType(str, enum.Enum):
    TEXT = "text"
    PHOTO = "photo"
    AUDIO = "audio"
    FILE = "file"

class SessionStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    avatar = Column(String(500), nullable=True)
    headline = Column(String(255), default="Eager to teach & learn")
    bio = Column(Text, default="")
    location = Column(String(100), default="Remote / Global")
    timezone = Column(String(50), default="UTC")
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    rating = Column(Float, default=5.0)
    review_count = Column(Integer, default=0)
    hours_swapped = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    skills_offered = relationship("UserSkillOffered", back_populates="user", cascade="all, delete-orphan")
    skills_wanted = relationship("UserSkillWanted", back_populates="user", cascade="all, delete-orphan")
    
    sent_requests = relationship("MatchRequest", foreign_keys="MatchRequest.sender_id", back_populates="sender")
    received_requests = relationship("MatchRequest", foreign_keys="MatchRequest.receiver_id", back_populates="receiver")
    
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")

    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")

class UserSkillOffered(Base):
    __tablename__ = "user_skills_offered"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False, index=True)
    category = Column(String(100), default="General")
    proficiency_level = Column(String(50), default="intermediate")
    years_experience = Column(Float, default=1.0)
    description = Column(Text, default="")
    portfolio_link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="skills_offered")

class UserSkillWanted(Base):
    __tablename__ = "user_skills_wanted"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False, index=True)
    category = Column(String(100), default="General")
    target_level = Column(String(50), default="intermediate")
    priority = Column(String(50), default="medium")
    goals = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="skills_wanted")

class MatchRequest(Base):
    __tablename__ = "match_requests"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    offered_skill_name = Column(String(100), nullable=False)
    wanted_skill_name = Column(String(100), nullable=False)
    message = Column(Text, default="Hey! I saw your profile and would love to exchange skills.")
    status = Column(String(50), default="pending")  # pending, accepted, declined, cancelled
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_requests")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_requests")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=True)
    msg_type = Column(String(50), default="text")  # text, photo, audio, file
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    audio_duration = Column(Float, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

class SwapSession(Base):
    __tablename__ = "swap_sessions"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    partner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), default="Skill Swap Session")
    skill_taught = Column(String(100), nullable=False)
    skill_learned = Column(String(100), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    status = Column(String(50), default="scheduled")  # scheduled, in_progress, completed, cancelled
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(Integer, ForeignKey("swap_sessions.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Float, nullable=False)
    comment = Column(Text, nullable=False)
    skill_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")
