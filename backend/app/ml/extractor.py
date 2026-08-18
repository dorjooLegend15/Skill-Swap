"""
NLP Intent and Skill Entity Extractor (Mongolian & English).
Powered by Pre-Trained Logistic Regression Pipeline and Mongolian Suffix-Aware Entity Parser.
"""

import os
import re
import pickle
from typing import List, Dict, Any, Optional
from app.ml.taxonomy import ALL_SKILL_NAMES, ALIAS_TO_CANONICAL, normalize_skill

# Regex markers for Offered (Заах / Мэддэг чадвар)
OFFERED_TRIGGERS = [
    r"би заана", r"зааж чадна", r"зааж өгнө", r"зааж өгье", r"зааж өгөх",
    r"заана", r"мэднэ", r"хийдэг", r"чаддаг", r"туршлагатай", r"миний чадвар",
    r"i can teach", r"i teach", r"i know", r"i am good at", r"i offer",
    r"experienced in", r"expert in", r"i work with"
]

# Regex markers for Wanted (Сурах / Хүсч буй чадвар)
WANTED_TRIGGERS = [
    r"сурмаар байна", r"сурч авмаар байна", r"сурах хүсэлтэй", r"сурмаар",
    r"заалгамаар байна", r"хайж байна", r"сонирхож байна", r"хэрэгтэй байна",
    r"заагаад өгөх хүн", r"зааж өгөх хүн", r"суръя", r"сурах", r"сурч байна",
    r"i want to learn", r"wanna learn", r"looking for", r"want to learn",
    r"looking to learn", r"eager to learn", r"seeking", r"teach me"
]

MONGOLIAN_SUFFIXES = r"(?:ний|ийн|ын|ийг|ыг|д|т|ээр|аар|оор|өөр|тэй|тай|той|төй)?"

class SkillExtractor:
    def __init__(self):
        # Sort canonical skill names and aliases by length descending
        self.skill_phrases = sorted(
            list(ALIAS_TO_CANONICAL.keys()) + [s.lower() for s in ALL_SKILL_NAMES],
            key=len,
            reverse=True
        )

        # Load trained ML pipeline
        model_path = os.path.join(os.path.dirname(__file__), "trained_nlp_engine.pkl")
        self.model = None
        if os.path.exists(model_path):
            try:
                with open(model_path, "rb") as f:
                    data = pickle.load(f)
                    self.model = data.get("pipeline")
            except Exception as e:
                print("Failed to load trained model:", e)

    def extract_skills_from_text(self, text: str) -> List[str]:
        """Find all mentioned skill entities in text, respecting Mongolian grammatical suffixes."""
        low_text = " " + text.lower() + " "
        found_skills = set()

        for phrase in self.skill_phrases:
            pattern = r"(?:\b|_)" + re.escape(phrase) + MONGOLIAN_SUFFIXES + r"(?:\b|_|\s|[.,!?])"
            if re.search(pattern, low_text):
                canonical = normalize_skill(phrase)
                found_skills.add(canonical)
                low_text = re.sub(pattern, " [MATCHED] ", low_text)

        return list(found_skills)

    def predict_intent(self, text: str) -> str:
        """Use the trained ML Classifier to predict the intent."""
        if self.model is not None:
            try:
                pred = self.model.predict([text])[0]
                return pred
            except Exception:
                pass
        return "general"

    def parse_conversation(self, text: str) -> Dict[str, Any]:
        lower_text = text.lower().strip()

        # 1. ML-based Intent Classification
        ml_intent = self.predict_intent(text)

        # 2. Split clauses on Mongolian verbs and conjunctions
        # Split on comma, semicolon, newline, conjunctions, or common boundary markers
        clause_delimiter = r"(?:[.,;!?\n]|\band\b|\bбас\b|\bхарин\b|\bсолиод\b|\bтэгээд\b|\bбөгөөд\b|(?<=заана)|(?<=мэднэ)|(?<=зааж өгнө)|(?<=зааж өгье))"
        raw_clauses = re.split(clause_delimiter, text, flags=re.IGNORECASE)

        offered_skills = set()
        wanted_skills = set()

        for clause in raw_clauses:
            clause_clean = clause.strip()
            if not clause_clean:
                continue

            clause_low = clause_clean.lower()
            is_offered = any(re.search(r"\b" + t, clause_low) or t in clause_low for t in OFFERED_TRIGGERS)
            is_wanted = any(re.search(r"\b" + t, clause_low) or t in clause_low for t in WANTED_TRIGGERS)

            detected = self.extract_skills_from_text(clause_clean)
            if detected:
                if is_offered and not is_wanted:
                    offered_skills.update(detected)
                elif is_wanted and not is_offered:
                    wanted_skills.update(detected)
                elif is_offered and is_wanted:
                    first_off = min([clause_low.find(t) for t in OFFERED_TRIGGERS if t in clause_low] or [999])
                    first_wnt = min([clause_low.find(t) for t in WANTED_TRIGGERS if t in clause_low] or [999])
                    if first_off < first_wnt:
                        offered_skills.update(detected)
                    else:
                        wanted_skills.update(detected)
                else:
                    if ml_intent in ["co_learning", "how_to_learn"]:
                        wanted_skills.update(detected)
                    else:
                        wanted_skills.update(detected)

        # Fallback if no clause triggers matched but skills found
        if not offered_skills and not wanted_skills:
            all_found = self.extract_skills_from_text(text)
            if all_found:
                if ml_intent == "how_to_learn":
                    wanted_skills.update(all_found)
                else:
                    wanted_skills.update(all_found)

        return {
            "intent": ml_intent,
            "offered_skills": list(offered_skills),
            "wanted_skills": list(wanted_skills)
        }

skill_extractor = SkillExtractor()
