from fastapi import APIRouter, HTTPException

from app.ml.survey_recommender import survey_skill_recommender
from app.schemas.survey import (
    SurveyRecommendationRequest,
    SurveyRecommendationResponse,
)


router = APIRouter(prefix="/matches", tags=["Matches & Discovery"])


@router.get("/survey-options")
def get_survey_options():
    """Expose the questionnaire choices found in the uploaded survey dataset."""
    return survey_skill_recommender.get_options()


@router.post(
    "/skill-recommendations",
    response_model=SurveyRecommendationResponse,
)
def recommend_survey_skills(request: SurveyRecommendationRequest):
    """Rank skills using the submitted survey answers and real survey rows."""
    try:
        return survey_skill_recommender.recommend(request.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error