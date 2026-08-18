"""
Gemini-Powered Chatbot Engine for SkillSwap.

Architecture:
    1. Google Gemini API (gemini-2.0-flash-lite) handles:
       - Natural language understanding
       - Extracting offered/wanted skills from user's message
       - Conversational replies (advice, roadmaps, platform help)

    2. Our trained ML Matcher handles:
       - Finding compatible users from DB using extracted skills
       - Bilateral / Mentor / Study Buddy classification

This gives us the best of both worlds: powerful AI conversation
+ fast local ML-based matchmaking.
"""

import os
import re
import json
import pickle
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.models import User
from app.ml.matcher import skill_matcher
from app.ml.taxonomy import normalize_skill
from app.ml.train_model import SUBJECT_KNOWLEDGE

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# --- Gemini client setup ---
_gemini_client = None

def _get_gemini_client():
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_client = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=_SYSTEM_PROMPT
        )
        return _gemini_client
    except Exception as e:
        print(f"Gemini init error: {e}")
        return None


# ============================================================
# SYSTEM PROMPT — Gemini-д SkillSwap-ийн бүх мэдлэгийг өгнө
# ============================================================
_SYSTEM_PROMPT = """
Та SkillSwap платформын AI Ухаалаг Туслах байна. Та монголоор хариулдаг (хэрэглэгч англиар бичвэл англиар хариул).

## Тан тухай
- Та SkillSwap-ийн хэрэглэгчдэд тусладаг чадварлаг AI туслах.
- Та хэрэглэгчийн бичсэн зүйлс дотроос тэдний ЗААХ болон СУРАХ чадваруудыг ялгаж авдаг.
- Та платформын бүх талаар мэддэг: чат, видео дуудлага, swap request, хуваарь, үнэлгээ.

## SkillSwap платформын мэдлэг
- **Чадвар солилцоо (Swap)**: Хэрэглэгч А нь Б-д ямар нэгэн зүйл заадаг, оронд нь Б нь А-д өөр зүйл заадаг — мөнгөгүй.
- **Хайлт (Explore)**: Бүх хэрэглэгчдийг харах, чадварын категори болон search-ээр шүүх.
- **Санал (Match Request)**: Explore-оос хэрэглэгч сонгоод "Санал илгээх" товчоор хүсэлт явуулна.
- **Чат**: WebSocket бодит цагийн зурвас, дуут зурвас (🎙️), файл/зураг хавсаргах (📎).
- **Видео дуудлага**: WebRTC P2P 1-on-1 видео дуудлага + дэлгэц хуваалцах (Screen Share). Чатын баруун дээд 📹 товчоор нээнэ.
- **Session**: 30/45/60/90 минутын хичээл товлох, "Hours Swapped" цаг бүртгэл.
- **Үнэлгээ**: Хичээл дууссаны дараа 1-5 одтой review үлдээх.
- **Study Buddy**: Тохирох bagsh олдохгүй үед, тантай адил зүйл сурч буй найзыг хайж өгдөг.

## Суралцах категориуд (ямар ч байж болно)
Програмчлал (Python, JavaScript, Flutter, AI/ML, DevOps), Хиймэл оюун ухаан, Гадаад хэл (Япон, Солонгос, Англи, Хятад, Герман, Франц, Испани, Орос, Монгол бичиг), Шинжлэх ухаан (Математик, Физик, Хими, Биологи, Статистик), Хөгжим (Гитар, Морин хуур, Төгөлдөр хуур, Ятга, Бит хийх, Дуулалт), Дизайн (UI/UX, Figma, Photoshop, Blender 3D, Видео эвлүүлэг), Бизнес (Маркетинг, SEO, Санхүү, Нягтлан бодох, Илтгэх урлаг), Спорт (Шатар, Иог, Фитнесс, Усанд сэлэлт, Бокс).

## Таны үүрэг
1. **Skill Extraction**: Хэрэглэгчийн мессежнээс OFFERED болон WANTED чадваруудыг ялгаж JSON гаргана.
2. **Roadmap / Зөвлөгөө**: Хэрэглэгч ямар нэгэн чадвар яаж сурах тухай асуувал дэлгэрэнгүй, практик алхамуудтай roadmap өгнө.
3. **Платформын тусламж**: Ямар ч функцийн талаар асуувал тайлбарлана.
4. **Чат**: Урам зориг өгөх, зөвлөгөө өгөх, асуултад хариулах.

## JSON Output Format (ЗААВАЛ дагах ёстой)
Хэрэглэгчийн мессеж хүлээн авахдаа ЗААВАЛ дараах JSON форматаар хариулна:

```json
{
  "reply": "Хэрэглэгчид харуулах монгол хариулт текст энд байна. Markdown ашиглаж болно.",
  "offered_skills": ["Skill1", "Skill2"],
  "wanted_skills": ["Skill3"],
  "intent": "one of: find_friend | co_learning | how_to_learn | skill_exchange | video_call_help | chat_help | request_help | session_help | about_platform | greeting | general"
}
```

### Чухал дүрмүүд:
- `offered_skills`: Хэрэглэгч ЗААЖ чадна гэж хэлсэн чадваруудын жагсаалт (монгол эсвэл англиар хэвийнчлэн бич, жишээ: "Python", "Япон хэл")
- `wanted_skills`: Хэрэглэгч СУРМААР байна гэж хэлсэн чадваруудын жагсаалт
- Хэрэв skill дурдаагүй бол хоосон массив [] байна
- `reply` нь заавал байх ёстой, дор хаяж 1 өгүүлбэр
- Зөвхөн цэвэр JSON илгээ, бусад текст нэмж болохгүй
""".strip()


def _extract_json_from_response(text: str) -> Optional[Dict]:
    """Parse JSON from Gemini's response text, stripping markdown code fences if present."""
    clean = text.strip()
    # Strip markdown code blocks if present
    clean = re.sub(r"^```(?:json)?\s*", "", clean, flags=re.IGNORECASE)
    clean = re.sub(r"\s*```$", "", clean)
    clean = clean.strip()
    try:
        return json.loads(clean)
    except Exception:
        # Try to extract JSON object from mixed text
        match = re.search(r"\{.*\}", clean, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
    return None


def _find_matches_in_db(
    db: Session,
    current_user: Optional[User],
    offered_skills: List[str],
    wanted_skills: List[str],
    intent: str
) -> List[Dict[str, Any]]:
    """
    Use our trained ML Matcher to find compatible users from the database.
    This is the local ML model layer.
    """
    user_offered_raw = [{"skill_name": s} for s in offered_skills]
    user_wanted_raw = [{"skill_name": s} for s in wanted_skills]

    # Fall back to profile skills if user didn't specify any
    if current_user:
        if not user_offered_raw and current_user.skills_offered:
            user_offered_raw = [{"skill_name": s.skill_name, "proficiency_level": s.proficiency_level}
                                 for s in current_user.skills_offered]
        if not user_wanted_raw and current_user.skills_wanted:
            user_wanted_raw = [{"skill_name": s.skill_name}
                                for s in current_user.skills_wanted]

    # Query active users from DB
    query = db.query(User).filter(User.is_active == True)
    if current_user:
        query = query.filter(User.id != current_user.id)
    all_candidates = query.all()

    ranked = []
    study_buddies = []

    is_search = intent in ["find_friend", "co_learning", "skill_exchange", "how_to_learn"] or (user_offered_raw or user_wanted_raw)
    if not is_search:
        return []

    for cand in all_candidates:
        cand_offered = [{"skill_name": s.skill_name, "proficiency_level": s.proficiency_level}
                        for s in cand.skills_offered]
        cand_wanted = [{"skill_name": s.skill_name} for s in cand.skills_wanted]

        match_res = skill_matcher.compute_bilateral_match(
            user_a_offered=user_offered_raw,
            user_a_wanted=user_wanted_raw,
            user_b_offered=cand_offered,
            user_b_wanted=cand_wanted,
            user_b_rating=cand.rating or 5.0
        )

        score = match_res["match_score"]
        a_teaches_b = match_res["a_teaches_b"]
        b_teaches_a = match_res["b_teaches_a"]

        # Study Buddy: both wanting same skill
        shared = []
        for my_w in user_wanted_raw:
            for their_w in cand_wanted:
                sim = skill_matcher.calculate_skill_similarity(
                    my_w.get("skill_name", ""), their_w.get("skill_name", ""))
                if sim >= 0.55:
                    shared.append(my_w.get("skill_name", ""))

        if match_res.get("is_bilateral") or (score >= 45.0 and a_teaches_b and b_teaches_a):
            ranked.append({
                "user_id": cand.id,
                "full_name": cand.full_name,
                "avatar": cand.avatar,
                "headline": cand.headline,
                "match_score": score,
                "offered_skill": b_teaches_a or (cand_offered[0]["skill_name"] if cand_offered else "Чадвар"),
                "wanted_skill": a_teaches_b or (cand_wanted[0]["skill_name"] if cand_wanted else "Сурах"),
                "match_reason": "✨ Төгс хоёр талт солилцоо — харилцан зааж суралцана!",
                "match_type": "bilateral",
                "match_badge": "🔄 Харилцан солилцох",
            })
        elif b_teaches_a:
            ranked.append({
                "user_id": cand.id,
                "full_name": cand.full_name,
                "avatar": cand.avatar,
                "headline": cand.headline,
                "match_score": max(score, 50.0),
                "offered_skill": b_teaches_a,
                "wanted_skill": cand_wanted[0]["skill_name"] if cand_wanted else "Чадвар",
                "match_reason": f"👨‍🏫 Ментор — Танд {b_teaches_a} заах туршлагатай.",
                "match_type": "mentor",
                "match_badge": "👨‍🏫 Ментор",
            })
        elif a_teaches_b:
            ranked.append({
                "user_id": cand.id,
                "full_name": cand.full_name,
                "avatar": cand.avatar,
                "headline": cand.headline,
                "match_score": max(score, 45.0),
                "offered_skill": cand_offered[0]["skill_name"] if cand_offered else "Чадвар",
                "wanted_skill": a_teaches_b,
                "match_reason": f"🎓 Суралцагч — Танаас {a_teaches_b} сурах хүсэлтэй.",
                "match_type": "learner",
                "match_badge": "🎓 Суралцагч",
            })
        elif shared:
            study_buddies.append({
                "user_id": cand.id,
                "full_name": cand.full_name,
                "avatar": cand.avatar,
                "headline": cand.headline,
                "match_score": 65.0,
                "offered_skill": cand_offered[0]["skill_name"] if cand_offered else shared[0],
                "wanted_skill": shared[0],
                "match_reason": f"🤝 Хамтран суралцагч — Тантай адил {shared[0]} сурч байна!",
                "match_type": "study_buddy",
                "match_badge": "🤝 Хамтран суралцагч",
            })

    ranked.sort(key=lambda x: x["match_score"], reverse=True)
    final = ranked[:4]
    if len(final) < 4 and study_buddies:
        final.append(study_buddies[0])
    if not final and all_candidates:
        for c in all_candidates[:3]:
            final.append({
                "user_id": c.id,
                "full_name": c.full_name,
                "avatar": c.avatar,
                "headline": c.headline,
                "match_score": 40.0,
                "offered_skill": c.skills_offered[0].skill_name if c.skills_offered else "Ерөнхий",
                "wanted_skill": c.skills_wanted[0].skill_name if c.skills_wanted else "Сурах",
                "match_reason": "🌟 Идэвхтэй гишүүн — холбогдож яриа эхлүүлэх боломжтой.",
                "match_type": "member",
                "match_badge": "🌟 Идэвхтэй гишүүн",
            })
    return final


def _fallback_local_response(user_message: str, current_user: Optional[User]) -> Dict[str, Any]:
    """
    Fallback when Gemini API key is not configured.
    Uses the local ML pipeline from extractor + basic responses.
    """
    from app.ml.extractor import skill_extractor
    parsed = skill_extractor.parse_conversation(user_message)
    intent = parsed["intent"]
    offered = parsed["offered_skills"]
    wanted = parsed["wanted_skills"]

    # Map local intent names to response labels
    simple_responses = {
        "video_call_help": "📹 **Видео дуудлага:** Чатын баруун дээд буланд байрлах 📹 товчийг дарж WebRTC видео дуудлага эхлүүлнэ. Дэлгэцээ (Screen Share) хуваалцах боломжтой.",
        "chat_help": "💬 **Чат боломжууд:** Бодит цагийн WebSocket зурвас, 🎙️ дуут зурвас, 📎 файл/зураг хавсаргах.",
        "request_help": "🔄 **Санал илгээх:** Explore хуудаснаас хэрэглэгч сонгоод 'Санал илгээх' дарна. Ирсэн хүсэлтүүд → Хүсэлтүүд хуудаснаас хүлээн авна.",
        "session_help": "📅 **Session:** 30-90 минутын хичээлийн цаг товлох боломжтой. Солилцсон цаг профайл дээр бүртгэгдэнэ.",
        "about_platform": "🌟 **SkillSwap:** Мөнгөгүйгээр чадвар солилцдог платформ. AI/ML-ээр тохирох хүнийг олж, видео дуудлага, чатаар хичээллэдэг.",
        "greeting": f"👋 Сайн байна уу{', ' + current_user.full_name if current_user else ''}! Би SkillSwap AI Туслах байна. Заах болон сурах чадвараа хэлэгтүн, тохирох хүнийг олж өгнө!",
    }

    reply = simple_responses.get(intent, "Та надаас юу ч асууж болно. Жишээ нь: 'Би Python заана, Япон хэл сурмаар байна' эсвэл 'Надад найз хайж өг'.")
    return {"reply": reply, "offered_skills": offered, "wanted_skills": wanted, "intent": intent}


class GeminiChatbotEngine:
    """
    Hybrid AI Chatbot Engine:
    - Gemini 2.0 Flash Lite: NLU, skill extraction, conversational replies
    - Our ML model: local matchmaking from DB
    """

    def __init__(self):
        self.subject_knowledge = SUBJECT_KNOWLEDGE
        self._chat_sessions: Dict[int, Any] = {}  # user_id → Gemini chat session

    def _get_or_create_session(self, user_id: Optional[int]):
        """Get or create a persistent multi-turn chat session for a user."""
        client = _get_gemini_client()
        if client is None:
            return None
        if user_id not in self._chat_sessions:
            self._chat_sessions[user_id] = client.start_chat(history=[])
        return self._chat_sessions[user_id]

    def process_message(
        self,
        db: Session,
        current_user: Optional[User],
        user_message: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        client = _get_gemini_client()

        # === PATH 1: Gemini API available ===
        if client is not None:
            try:
                session = self._get_or_create_session(
                    current_user.id if current_user else -1
                )

                # Build prompt with user context
                user_context = ""
                if current_user and current_user.skills_offered:
                    user_context = f"\n\n[Хэрэглэгчийн профайл] Нэр: {current_user.full_name}. Заах чадварууд: {', '.join(s.skill_name for s in current_user.skills_offered)}. Сурах чадварууд: {', '.join(s.skill_name for s in current_user.skills_wanted)}."

                prompt = f"{user_message}{user_context}"

                response = session.send_message(prompt)
                raw = response.text.strip()

                # Parse JSON response from Gemini
                parsed = _extract_json_from_response(raw)

                if parsed and "reply" in parsed:
                    reply = parsed.get("reply", "")
                    offered = parsed.get("offered_skills", [])
                    wanted = parsed.get("wanted_skills", [])
                    intent = parsed.get("intent", "general")
                else:
                    # Gemini returned plain text (shouldn't happen with good system prompt)
                    reply = raw
                    offered, wanted, intent = [], [], "general"

                # === ML Matchmaking Layer ===
                recommendations = _find_matches_in_db(
                    db=db,
                    current_user=current_user,
                    offered_skills=offered,
                    wanted_skills=wanted,
                    intent=intent
                )

                return {
                    "reply": reply,
                    "extracted_skills_offered": offered,
                    "extracted_skills_wanted": wanted,
                    "recommendations": recommendations,
                    "intent": intent,
                    "powered_by": "gemini"
                }

            except Exception as e:
                print(f"Gemini API error: {e}")
                # Fall through to local fallback

        # === PATH 2: Fallback to local ML pipeline ===
        local = _fallback_local_response(user_message, current_user)
        recommendations = _find_matches_in_db(
            db=db,
            current_user=current_user,
            offered_skills=local["offered_skills"],
            wanted_skills=local["wanted_skills"],
            intent=local["intent"]
        )

        return {
            "reply": local["reply"],
            "extracted_skills_offered": local["offered_skills"],
            "extracted_skills_wanted": local["wanted_skills"],
            "recommendations": recommendations,
            "intent": local["intent"],
            "powered_by": "local_ml"
        }


# Singleton instance
chatbot_engine = GeminiChatbotEngine()
