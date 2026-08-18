"""
Machine Learning Bilateral Matching Engine.
Calculates bilateral compatibility scores and ranks potential swap partners.
"""

import os
import pickle
from typing import List, Dict, Any, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from app.ml.taxonomy import normalize_skill, get_category_for_skill

# Proficiency bonus map
PROFICIENCY_WEIGHTS = {
    "expert": 1.25,
    "advanced": 1.15,
    "intermediate": 1.0,
    "beginner": 0.85
}

class SkillMatcher:
    def __init__(self):
        # Load trained brain if available
        model_path = os.path.join(os.path.dirname(__file__), "ai_brain.pkl")
        if os.path.exists(model_path):
            try:
                with open(model_path, "rb") as f:
                    data = pickle.load(f)
                    self.vectorizer = data["vectorizer"]
            except Exception:
                self.vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), lowercase=True)
        else:
            self.vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), lowercase=True)

    def calculate_skill_similarity(self, skill_a: str, skill_b: str) -> float:
        """Calculate similarity between two skill strings using TF-IDF cosine similarity."""
        s_a = normalize_skill(skill_a).lower()
        s_b = normalize_skill(skill_b).lower()

        if s_a == s_b:
            return 1.0

        # Exact canonical match
        if normalize_skill(s_a) == normalize_skill(s_b):
            return 0.98

        try:
            tfidf_matrix = self.vectorizer.transform([s_a, s_b])
            sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
            
            # Same category boost
            cat_a = get_category_for_skill(skill_a)
            cat_b = get_category_for_skill(skill_b)
            if cat_a == cat_b and cat_a != "Ерөнхий" and sim < 0.4:
                sim = max(sim, 0.4)
                
            return min(max(sim, 0.0), 1.0)
        except Exception:
            return 0.0

    def find_best_skill_pair(
        self,
        offered_list: List[Dict[str, Any]],
        wanted_list: List[Dict[str, Any]]
    ) -> Tuple[float, Optional[str], Optional[str]]:
        """
        Find the highest matching pair where one user offers what the other wants.
        Returns (max_similarity, matched_offered_skill, matched_wanted_skill).
        """
        if not offered_list or not wanted_list:
            return 0.0, None, None

        best_score = 0.0
        best_offered = None
        best_wanted = None

        for off in offered_list:
            off_name = off.get("skill_name", "")
            off_prof = str(off.get("proficiency_level", "intermediate")).lower()
            prof_mult = PROFICIENCY_WEIGHTS.get(off_prof, 1.0)

            for wnt in wanted_list:
                wnt_name = wnt.get("skill_name", "")
                sim = self.calculate_skill_similarity(off_name, wnt_name)

                # Apply slight proficiency adjustment
                adjusted_sim = sim * min(prof_mult, 1.15)

                if adjusted_sim > best_score:
                    best_score = adjusted_sim
                    best_offered = off_name
                    best_wanted = wnt_name

        return min(best_score, 1.0), best_offered, best_wanted

    def compute_bilateral_match(
        self,
        user_a_offered: List[Dict[str, Any]],
        user_a_wanted: List[Dict[str, Any]],
        user_b_offered: List[Dict[str, Any]],
        user_b_wanted: List[Dict[str, Any]],
        user_b_rating: float = 5.0
    ) -> Dict[str, Any]:
        """
        Compute full bilateral swap score between User A and User B.
        - Direction 1: A teaches B (A.offered -> B.wanted)
        - Direction 2: B teaches A (B.offered -> A.wanted)
        """
        score_a_to_b, a_teaches, b_learns = self.find_best_skill_pair(user_a_offered, user_b_wanted)
        score_b_to_a, b_teaches, a_learns = self.find_best_skill_pair(user_b_offered, user_a_wanted)

        is_bilateral = (score_a_to_b >= 0.45) and (score_b_to_a >= 0.45)

        # Bilateral score weighting
        if is_bilateral:
            raw_score = (score_a_to_b * 0.48) + (score_b_to_a * 0.48) + 0.04
        else:
            raw_score = (score_a_to_b * 0.5) + (score_b_to_a * 0.5)

        # Quality multiplier from ratings
        rating_factor = min(max(user_b_rating / 5.0, 0.8), 1.0)
        final_score = raw_score * rating_factor
        match_percentage = round(min(max(final_score * 100, 5.0), 99.0), 1)

        # Generate reasons
        reasons = []
        if a_teaches and b_learns and score_a_to_b >= 0.45:
            reasons.append(f"Та {a_teaches} зааж болно (Түүний сурах хүсэлтэй {b_learns}-тай таарна)")
        if b_teaches and a_learns and score_b_to_a >= 0.45:
            reasons.append(f"Тэр танд {b_teaches} зааж чадна (Таны сурах зорилготой {a_learns}-тай таарна)")
        if is_bilateral:
            reasons.append("✨ Төгс хоёр талт солилцоо (Bilateral Swap)")

        return {
            "match_score": match_percentage,
            "is_bilateral": is_bilateral,
            "score_a_to_b": score_a_to_b,
            "score_b_to_a": score_b_to_a,
            "a_teaches_b": a_teaches if score_a_to_b >= 0.45 else None,
            "b_teaches_a": b_teaches if score_b_to_a >= 0.45 else None,
            "reasons": reasons
        }

skill_matcher = SkillMatcher()
