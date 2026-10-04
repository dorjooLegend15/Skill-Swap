import csv
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.survey_recommendations import get_survey_options
from app.api.survey_recommendations import router as survey_recommendations_router
from app.ml.survey_recommender import SurveySkillRecommender


DATASET = (
    Path(__file__).resolve().parents[1]
    / "app"
    / "data"
    / "skillswap_demo_data.csv"
)
ANSWERS = {
    "age": 13,
    "main_skill": "Хөгжим",
    "second_skill": "Япон хэл",
    "skill_level": "Анхан",
    "want_to_learn": "Видео эвлүүлэг",
    "target_level": "Ахисан",
    "interest": "Хөгжим",
    "goal": "Шинэ чадвар сурах",
    "learning_style": "Видео",
    "availability": "Амралтын өдөр",
    "preferred_partner_level": "Анхан",
}


class SurveyRecommendationFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.recommender = SurveySkillRecommender()
        app = FastAPI()
        app.include_router(survey_recommendations_router, prefix="/api")
        cls.client = TestClient(app)

    def assert_public_result_is_aggregated(self, result):
        self.assertEqual(
            set(result),
            {"dataset_source", "scoring_note", "recommendations"},
        )
        for item in result["recommendations"]:
            self.assertEqual(
                set(item),
                {"skill_name", "match_score", "reasons"},
            )
            self.assertFalse(
                {"age", "user_id", "contact_platform", "match_text"}
                & set(item)
            )

    def test_demo_data_is_synthetic_and_options_do_not_expose_ages(self):
        with DATASET.open("r", encoding="utf-8", newline="") as source:
            reader = csv.DictReader(source)
            self.assertNotIn("user_id", reader.fieldnames)
            self.assertNotIn("contact_platform", reader.fieldnames)
            self.assertNotIn("match_text", reader.fieldnames)
            self.assertEqual(len(list(reader)), 18)

        options = get_survey_options()
        self.assertEqual(options["dataset_source"], "synthetic_demo")
        self.assertNotIn("age", options["fields"])
        self.assertIn("Хөгжим", options["fields"]["interest"])
        self.assertIn("Шинэ чадвар сурах", options["fields"]["goal"])
        self.assertIn("Практик хийж сурах", options["fields"]["learning_style"])
        self.assertIn("Байхгүй", options["fields"]["second_skill"])

    def test_private_runtime_path_overrides_synthetic_default(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            private_path = Path(temporary_directory) / "private-survey.csv"
            private_path.write_text(DATASET.read_text(encoding="utf-8"), encoding="utf-8")
            with patch.dict(
                os.environ,
                {"SKILLSWAP_DATASET_PATH": str(private_path)},
            ):
                recommender = SurveySkillRecommender()
                self.assertEqual(recommender.dataset_source, "private_runtime")
                result = recommender.recommend(ANSWERS)
                self.assertEqual(
                    result["recommendations"][0]["skill_name"],
                    "Видео эвлүүлэг",
                )
                self.assert_public_result_is_aggregated(result)

    def test_personalized_recommendations_keep_explanations_without_counts(self):
        result = self.recommender.recommend(ANSWERS)
        self.assertEqual(result["dataset_source"], "synthetic_demo")
        self.assertEqual(
            result["recommendations"][0]["skill_name"],
            "Видео эвлүүлэг",
        )
        self.assertIn(
            "Та энэ чадварыг сурах хүсэлтдээ өөрөө сонгосон.",
            result["recommendations"][0]["reasons"],
        )
        self.assert_public_result_is_aggregated(result)

    def test_invalid_category_is_rejected(self):
        answers = {**ANSWERS, "main_skill": "made-up skill"}
        with self.assertRaises(ValueError):
            self.recommender.recommend(answers)

    def test_http_questionnaire_to_results_exposes_no_rows_or_ages(self):
        options_response = self.client.get("/api/matches/survey-options")
        self.assertEqual(options_response.status_code, 200)
        options = options_response.json()
        self.assertEqual(options["dataset_source"], "synthetic_demo")
        self.assertNotIn("age", options["fields"])
        self.assertNotIn("dataset_size", options)

        response = self.client.post(
            "/api/matches/skill-recommendations",
            json=ANSWERS,
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(
            result["recommendations"][0]["skill_name"],
            "Видео эвлүүлэг",
        )
        self.assert_public_result_is_aggregated(result)

        invalid = self.client.post(
            "/api/matches/skill-recommendations",
            json={**ANSWERS, "main_skill": "unknown"},
        )
        self.assertEqual(invalid.status_code, 422)


if __name__ == "__main__":
    unittest.main()