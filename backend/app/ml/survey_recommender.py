"""Explainable skill recommendations derived from the SkillSwap survey CSV."""

import csv
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional


DATASET_PATH = Path(__file__).resolve().parents[1] / "data" / "skillswap_data.csv"
REQUIRED_COLUMNS = (
    "age",
    "main_skill",
    "second_skill",
    "skill_level",
    "want_to_learn",
    "target_level",
    "interest",
    "goal",
    "learning_style",
    "availability",
    "preferred_partner_level",
)

# Inputs with clear meanings in the survey are used as evidence. The CSV's
# match_text is a generated summary, not an independent response, so it is
# deliberately excluded. The ambiguously named partner_level/teaching_level
# and contact platform are also not treated as recommendation signals.
SIMILARITY_WEIGHTS = {
    "interest": 0.24,
    "goal": 0.20,
    "learning_style": 0.16,
    "availability": 0.10,
    "preferred_partner_level": 0.10,
    "target_level": 0.08,
    "main_skill": 0.05,
    "second_skill": 0.02,
    "skill_level": 0.02,
    "age": 0.03,
}

EXPLANATION_LABELS = {
    "interest": "сонирхол",
    "goal": "зорилго",
    "learning_style": "сурах арга",
    "availability": "боломжит цаг",
    "preferred_partner_level": "хамтрагчийн түвшний сонголт",
    "target_level": "зорилтот түвшин",
    "main_skill": "үндсэн чадвар",
    "second_skill": "хоёрдогч чадвар",
    "skill_level": "чадварын түвшин",
}


class SurveySkillRecommender:
    """Ranks skills selected by similar respondents in the supplied dataset."""

    def __init__(self, dataset_path: Path = DATASET_PATH):
        self.dataset_path = Path(dataset_path)
        if not self.dataset_path.is_file():
            raise FileNotFoundError(
                f"SkillSwap survey dataset is missing: {self.dataset_path}"
            )

        with self.dataset_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            columns = set(reader.fieldnames or [])
            missing_columns = sorted(set(REQUIRED_COLUMNS) - columns)
            if missing_columns:
                raise ValueError(
                    "SkillSwap survey CSV is missing required columns: "
                    + ", ".join(missing_columns)
                )

            self.rows: List[Dict[str, Any]] = []
            for source_row in reader:
                row = {
                    key: (source_row.get(key) or "").strip()
                    for key in REQUIRED_COLUMNS
                }
                if not all(row[key] for key in REQUIRED_COLUMNS):
                    continue
                try:
                    row["age"] = int(row["age"])
                except (TypeError, ValueError):
                    continue
                self.rows.append(row)

        if not self.rows:
            raise ValueError("SkillSwap survey CSV contains no usable survey rows.")

        self._fields = self._build_options()

    def _build_options(self) -> Dict[str, List[Any]]:
        options: Dict[str, List[Any]] = {}
        for field in REQUIRED_COLUMNS:
            if field == "age":
                options[field] = sorted({row["age"] for row in self.rows})
                continue
            seen = set()
            values = []
            for row in self.rows:
                value = row[field]
                if value and value not in seen:
                    seen.add(value)
                    values.append(value)
            options[field] = values
        return options

    def get_options(self) -> Dict[str, Any]:
        """Return questionnaire options directly from the CSV, not hard-coded data."""
        return {
            "dataset_size": len(self.rows),
            "fields": {name: list(values) for name, values in self._fields.items()},
        }

    def _validated_answers(self, answers: Mapping[str, Any]) -> Dict[str, Any]:
        cleaned: Dict[str, Any] = {}
        try:
            age = int(answers.get("age"))
        except (TypeError, ValueError):
            raise ValueError("Насаа судалгааны сонголтоос сонгоно уу.") from None
        if age not in self._fields["age"]:
            raise ValueError("Нас судалгааны өгөгдлийн хүрээнээс гадуур байна.")
        cleaned["age"] = age

        for field in REQUIRED_COLUMNS:
            if field == "age":
                continue
            value = answers.get(field)
            if field == "second_skill" and not value:
                value = "Байхгүй"
            if not isinstance(value, str) or value not in self._fields[field]:
                raise ValueError(f"{field} талбарын сонголт судалгааны өгөгдөлд байхгүй.")
            cleaned[field] = value
        return cleaned

    @staticmethod
    def _similarity(row: Mapping[str, Any], answers: Mapping[str, Any]) -> float:
        weighted_score = 0.0
        available_weight = 0.0
        for field, weight in SIMILARITY_WEIGHTS.items():
            answer = answers.get(field)
            value = row.get(field)
            if answer in (None, "") or value in (None, ""):
                continue
            available_weight += weight
            if field == "age":
                distance = abs(int(answer) - int(value))
                weighted_score += weight * max(0.0, 1.0 - distance / 5.0)
            elif answer == value:
                weighted_score += weight
        return weighted_score / available_weight if available_weight else 0.0

    def recommend(
        self, answers: Mapping[str, Any], limit: int = 5
    ) -> Dict[str, Any]:
        profile = self._validated_answers(answers)
        respondent_scores = [
            (row, self._similarity(row, profile)) for row in self.rows
        ]

        responses_by_skill: Dict[str, List[Any]] = defaultdict(list)
        for row, similarity in respondent_scores:
            skill = row["want_to_learn"]
            if skill:
                responses_by_skill[skill].append((row, similarity))

        counts = Counter(
            row["want_to_learn"] for row in self.rows if row["want_to_learn"]
        )
        max_count = max(counts.values()) if counts else 1
        candidates = []

        for skill, responses in responses_by_skill.items():
            if not responses:
                continue
            affinity = sum(score for _, score in responses) / len(responses)
            prevalence = counts[skill] / max_count
            is_requested = skill == profile["want_to_learn"]

            # A transparent ranking blend: similar-profile affinity, survey
            # frequency, and an explicit boost for the user's chosen skill.
            score = 100 * (
                0.72 * affinity + 0.13 * prevalence + 0.15 * float(is_requested)
            )
            similar_rows = [
                row for row, similarity in responses if similarity >= 0.25
            ]
            reasons = self._reasons(skill, profile, responses, is_requested)
            candidates.append(
                {
                    "skill_name": skill,
                    "match_score": round(min(score, 100.0), 1),
                    "dataset_count": counts[skill],
                    "similar_response_count": len(similar_rows),
                    "reasons": reasons,
                    "_requested": is_requested,
                }
            )

        candidates.sort(
            key=lambda item: (
                item["_requested"],
                item["match_score"],
                item["dataset_count"],
                item["skill_name"],
            ),
            reverse=True,
        )
        results = candidates[: max(1, min(int(limit), 10))]
        for item in results:
            item.pop("_requested", None)

        return {
            "dataset_size": len(self.rows),
            "scoring_note": (
                "Оноо нь ижил хариулт, судалгаанд сонгогдсон давтамж, "
                "таны хүссэн чадварыг нэгтгэсэн эрэмбэ юм; амжилтын магадлал биш."
            ),
            "recommendations": results,
        }

    @staticmethod
    def _reasons(
        skill: str,
        answers: Mapping[str, Any],
        responses: List[Any],
        is_requested: bool,
    ) -> List[str]:
        reasons: List[str] = []
        if is_requested:
            reasons.append("Та энэ чадварыг сурах хүсэлтдээ өөрөө сонгосон.")

        evidence = []
        for field, label in EXPLANATION_LABELS.items():
            answer = answers.get(field)
            if answer in (None, ""):
                continue
            matching_count = sum(
                1
                for row, similarity in responses
                if similarity >= 0.25 and row.get(field) == answer
            )
            if matching_count:
                evidence.append((matching_count, label, answer))

        evidence.sort(key=lambda item: (item[0], item[1]), reverse=True)
        for count, label, answer in evidence[:2]:
            reasons.append(
                f"Тантай ижил {label} ({answer})-тай {count} хариултад "
                f"энэ чадварыг сурах хүсэлтэд тэмдэглэсэн."
            )

        if not reasons:
            total = sum(
                1 for row, _ in responses if row.get("want_to_learn") == skill
            )
            reasons.append(
                f"Энэ чадварыг судалгааны {total} хариултад сурах сонголтоор тэмдэглэсэн."
            )
        return reasons


survey_skill_recommender = SurveySkillRecommender()