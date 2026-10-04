from typing import List

from pydantic import BaseModel, Field


class SurveyRecommendationRequest(BaseModel):
    age: int = Field(..., ge=13, le=18)
    main_skill: str
    second_skill: str = "Байхгүй"
    skill_level: str
    want_to_learn: str
    target_level: str
    interest: str
    goal: str
    learning_style: str
    availability: str
    preferred_partner_level: str


class SkillRecommendation(BaseModel):
    skill_name: str
    match_score: float = Field(..., ge=0, le=100)
    dataset_count: int = Field(..., ge=0)
    similar_response_count: int = Field(..., ge=0)
    reasons: List[str]


class SurveyRecommendationResponse(BaseModel):
    dataset_size: int = Field(..., ge=0)
    scoring_note: str
    recommendations: List[SkillRecommendation]