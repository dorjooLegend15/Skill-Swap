import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.survey_recommendations import get_survey_options, recommend_survey_skills
from app.api.survey_recommendations import router as survey_recommendations_router
from app.ml.survey_recommender import SurveySkillRecommender
from app.schemas.survey import SurveyRecommendationRequest


DATASET = Path(__file__).resolve().parents[1] / "app" / "data" / "skillswap_data.csv"


class SurveyRecommendationFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.recommender = SurveySkillRecommender(DATASET)
        app = FastAPI()
        app.include_router(survey_recommendations_router, prefix="/api")
        cls.client = TestClient(app)

    def test_options_come_from_dataset_and_keep_mongolian_values(self):
        options = get_survey_options()
        self.assertEqual(options["dataset_size"], 1000)
        self.assertIn("Хөгжим", options["fields"]["interest"])
        self.assertIn("Шинэ чадвар сурах", options["fields"]["goal"])
        self.assertIn("Практик хийж сурах", options["fields"]["learning_style"])
        self.assertIn("Байхгүй", options["fields"]["second_skill"])

    def test_questionnaire_to_personalized_results(self):
        source_answers = {
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
        request = SurveyRecommendationRequest(**source_answers)
        response = recommend_survey_skills(request)

        self.assertEqual(response["dataset_size"], 1000)
        self.assertEqual(response["recommendations"][0]["skill_name"], "Видео эвлүүлэг")
        self.assertIn(
            "Та энэ чадварыг сурах хүсэлтдээ өөрөө сонгосон.",
            response["recommendations"][0]["reasons"],
        )
        self.assertTrue(all(item["dataset_count"] > 0 for item in response["recommendations"]))
        self.assertTrue(all("user_id" not in item for item in response["recommendations"]))

    def test_invalid_category_is_rejected(self):
        answers = {
            "age": 15,
            "main_skill": "made-up skill",
            "second_skill": "Байхгүй",
            "skill_level": "Суурь",
            "want_to_learn": "Python",
            "target_level": "Дунд",
            "interest": "Технологи",
            "goal": "Төсөл хийх",
            "learning_style": "Видео",
            "availability": "Өдөр бүр",
            "preferred_partner_level": "Анхан",
        }
        with self.assertRaises(ValueError):
            self.recommender.recommend(answers)

    def test_http_questionnaire_to_results(self):
        options_response = self.client.get("/api/matches/survey-options")
        self.assertEqual(options_response.status_code, 200)
        self.assertEqual(options_response.json()["dataset_size"], 1000)

        response = self.client.post(
            "/api/matches/skill-recommendations",
            json={
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
            },
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["dataset_size"], 1000)
        self.assertEqual(result["recommendations"][0]["skill_name"], "Видео эвлүүлэг")
        self.assertTrue(result["recommendations"][0]["reasons"])

        invalid = self.client.post(
            "/api/matches/skill-recommendations",
            json={
                "age": 13,
                "main_skill": "unknown",
                "second_skill": "Байхгүй",
                "skill_level": "Анхан",
                "want_to_learn": "Видео эвлүүлэг",
                "target_level": "Ахисан",
                "interest": "Хөгжим",
                "goal": "Шинэ чадвар сурах",
                "learning_style": "Видео",
                "availability": "Амралтын өдөр",
                "preferred_partner_level": "Анхан",
            },
        )
        self.assertEqual(invalid.status_code, 422)


if __name__ == "__main__":
    unittest.main()