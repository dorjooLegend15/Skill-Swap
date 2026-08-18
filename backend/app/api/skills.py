from fastapi import APIRouter
from app.ml.taxonomy import SKILL_TAXONOMY, ALL_SKILL_NAMES

router = APIRouter(prefix="/skills", tags=["Skills"])

@router.get("/taxonomy")
def get_skills_taxonomy():
    """Return categorized skill hierarchy and canonical skills list."""
    return {
        "categories": SKILL_TAXONOMY,
        "all_skills": sorted(ALL_SKILL_NAMES)
    }

@router.get("/popular")
def get_popular_skills():
    """Return trending offered and requested skills."""
    return {
        "top_offered": ["Python", "JavaScript", "UI/UX Design", "English", "Acoustic Guitar", "Digital Marketing"],
        "top_wanted": ["Japanese", "React", "Machine Learning / AI", "Piano & Keyboard", "Figma", "French"]
    }
