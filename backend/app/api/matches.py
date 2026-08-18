from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import User, UserSkillOffered, UserSkillWanted
from app.schemas import UserPublicOut
from app.api.deps import get_optional_current_user, get_current_user
from app.ml.matcher import skill_matcher

router = APIRouter(prefix="/matches", tags=["Matches & Discovery"])

@router.get("/explore", response_model=List[UserPublicOut])
def explore_matches(
    q: Optional[str] = Query(None, description="Search term for skills or names"),
    category: Optional[str] = Query(None, description="Filter by skill category"),
    teach_skill: Optional[str] = Query(None, description="Filter by skill they teach"),
    learn_skill: Optional[str] = Query(None, description="Filter by skill they want to learn"),
    min_score: Optional[float] = Query(0.0, description="Minimum compatibility percentage"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = db.query(User).filter(User.is_active == True)
    if current_user:
        query = query.filter(User.id != current_user.id)
    
    users = query.all()
    results = []

    # Current user's skill representations
    user_offered = []
    user_wanted = []
    if current_user:
        user_offered = [{"skill_name": s.skill_name, "proficiency_level": s.proficiency_level} for s in current_user.skills_offered]
        user_wanted = [{"skill_name": s.skill_name} for s in current_user.skills_wanted]

    for u in users:
        # Category or search filter
        cand_offered_names = [s.skill_name.lower() for s in u.skills_offered]
        cand_wanted_names = [s.skill_name.lower() for s in u.skills_wanted]
        cand_categories = [s.category.lower() for s in u.skills_offered] + [s.category.lower() for s in u.skills_wanted]

        if category and category.lower() != "all":
            if not any(category.lower() in c for c in cand_categories):
                continue

        if teach_skill:
            if not any(teach_skill.lower() in name for name in cand_offered_names):
                continue

        if learn_skill:
            if not any(learn_skill.lower() in name for name in cand_wanted_names):
                continue

        if q:
            q_low = q.lower()
            match_name = q_low in u.full_name.lower() or (u.headline and q_low in u.headline.lower()) or (u.bio and q_low in u.bio.lower())
            match_skills = any(q_low in name for name in cand_offered_names + cand_wanted_names)
            if not (match_name or match_skills):
                continue

        # Compute ML compatibility score
        compat_score = 0.0
        match_reasons = []

        cand_offered_dict = [{"skill_name": s.skill_name, "proficiency_level": s.proficiency_level} for s in u.skills_offered]
        cand_wanted_dict = [{"skill_name": s.skill_name} for s in u.skills_wanted]

        if current_user and (user_offered or user_wanted):
            match_res = skill_matcher.compute_bilateral_match(
                user_a_offered=user_offered,
                user_a_wanted=user_wanted,
                user_b_offered=cand_offered_dict,
                user_b_wanted=cand_wanted_dict,
                user_b_rating=u.rating or 5.0
            )
            compat_score = match_res["match_score"]
            match_reasons = match_res["reasons"]
        else:
            # Default score heuristic based on ratings and profile richness
            compat_score = round(min(60.0 + (len(u.skills_offered) * 6) + (len(u.skills_wanted) * 4), 95.0), 1)

        if compat_score < (min_score or 0.0):
            continue

        user_out = UserPublicOut(
            id=u.id,
            full_name=u.full_name,
            avatar=u.avatar,
            headline=u.headline,
            bio=u.bio,
            location=u.location,
            timezone=u.timezone,
            github_url=u.github_url,
            linkedin_url=u.linkedin_url,
            portfolio_url=u.portfolio_url,
            rating=u.rating or 5.0,
            review_count=u.review_count or 0,
            hours_swapped=u.hours_swapped or 0.0,
            skills_offered=u.skills_offered,
            skills_wanted=u.skills_wanted,
            compatibility_score=compat_score,
            match_reasons=match_reasons
        )
        results.append(user_out)

    # Sort by compatibility score descending
    results.sort(key=lambda x: x.compatibility_score or 0.0, reverse=True)
    return results

@router.get("/recommendations", response_model=List[UserPublicOut])
def get_personalized_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).filter(User.is_active == True, User.id != current_user.id).all()
    user_offered = [{"skill_name": s.skill_name, "proficiency_level": s.proficiency_level} for s in current_user.skills_offered]
    user_wanted = [{"skill_name": s.skill_name} for s in current_user.skills_wanted]

    ranked = []
    for u in users:
        cand_offered = [{"skill_name": s.skill_name, "proficiency_level": s.proficiency_level} for s in u.skills_offered]
        cand_wanted = [{"skill_name": s.skill_name} for s in u.skills_wanted]

        match_res = skill_matcher.compute_bilateral_match(
            user_a_offered=user_offered,
            user_a_wanted=user_wanted,
            user_b_offered=cand_offered,
            user_b_wanted=cand_wanted,
            user_b_rating=u.rating or 5.0
        )

        user_out = UserPublicOut(
            id=u.id,
            full_name=u.full_name,
            avatar=u.avatar,
            headline=u.headline,
            bio=u.bio,
            location=u.location,
            timezone=u.timezone,
            github_url=u.github_url,
            linkedin_url=u.linkedin_url,
            portfolio_url=u.portfolio_url,
            rating=u.rating or 5.0,
            review_count=u.review_count or 0,
            hours_swapped=u.hours_swapped or 0.0,
            skills_offered=u.skills_offered,
            skills_wanted=u.skills_wanted,
            compatibility_score=match_res["match_score"],
            match_reasons=match_res["reasons"]
        )
        ranked.append((match_res["match_score"], user_out))

    ranked.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in ranked[:12]]
