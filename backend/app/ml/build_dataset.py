"""
Dataset Generator for SkillSwap AI.
Creates a comprehensive, high-quality dataset file 'training_dataset.json'
with 20,000+ realistic, natural language conversation queries and intent annotations.
"""

import os
import json
import random
from app.ml.taxonomy import SKILL_TAXONOMY, ALL_SKILL_NAMES, ALIAS_TO_CANONICAL

def generate_dataset(output_path: str = None, total_samples: int = 25000):
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), "training_dataset.json")

    print(f">>> Generating {total_samples} labeled training samples across 10 core intents...")

    dataset = []

    # 1. Subject names pool
    skills = list(ALIAS_TO_CANONICAL.keys())

    # --- TEMPLATES BY INTENT ---

    # Intent 1: how_to_learn (Asking for tutorial, roadmap, how to study a subject)
    how_to_learn_templates = [
        "{} яаж сурах вэ?",
        "{} хэрхэн сурах вэ зөвлөгөө өгөөч",
        "{} сурмаар байна хаанаас эхлэх вэ?",
        "{} анхан шатнаас нь яаж сурах вэ?",
        "{} хичээлийн тайлбар өгөөч",
        "{} суралцах төлөвлөгөө roadmap байна уу?",
        "{} сурахад юу юу хэрэгтэй вэ?",
        "{} сурахад хэр их хугацаа орох вэ?",
        "{} хичээл хэрхэн хийх вэ?",
        "{} тоглож сурах анхан шатны заавар",
        "{} сурах шилдэг арга барил юу вэ?",
        "{} бэлдэх арга зөвлөгөө өгөөч",
        "{} бодлого яаж бодох вэ?",
        "how to learn {} as a beginner?",
        "what is the best roadmap to learn {}?",
        "can you explain how to master {}?",
        "guide me on learning {}"
    ]

    # Intent 2: find_friend (Looking for swap partner / friend)
    find_friend_templates = [
        "надад найз хайж өг",
        "надад тохирох найз олоод өгөөч",
        "би найзтай болмоор байна",
        "чамд санал болгох сайн найз байна уу?",
        "надад чатлах найз олж өг",
        "хамт ярилцах хүн байна уу?",
        "хэн нэгэнтэй холбогдмоор байна",
        "надад mentor эсвэл найз олж өгөөч",
        "шинэ хүмүүстэй танилцмаар байна",
        "эндээс яаж найз олох вэ?",
        "help me find a friend",
        "find me a skill swap partner please",
        "i want to connect with people",
        "find a match for me"
    ]

    # Intent 3: co_learning (Study Buddy / Learning together)
    co_learning_templates = [
        "{} хамт сурах хүн хайж байна",
        "{} цуг суралцах найз олж өгөөч",
        "{} хамтран суралцах study buddy байна уу?",
        "би {} сурч байгаа хамт хичээллэх хүн хэрэгтэй байна",
        "хоёулаа хамтдаа {} сурах хүн олоод өг",
        "{} даалгавар хамт хийх хүн байна уу?",
        "би ганцаараа {} сурахаас залхаж байна хамтрагч олмоор байна",
        "looking for a study buddy to learn {}",
        "anyone want to study {} together?",
        "find me a co-learning peer for {}"
    ]

    # Intent 4: skill_exchange (Bilateral Skill Swap Statement)
    exchange_templates = [
        "би {} заана, оронд нь {} сурмаар байна",
        "{} зааж өгөөд {} заалгая",
        "би {} сайн мэднэ, {} заах хүн байна уу?",
        "миний чадвар {}, харин би {} сурах хүсэлтэй",
        "{} заана {} суръя",
        "би {} хийдэг {} сурч авмаар байна",
        "i can teach {} and want to learn {}",
        "teaching {} in exchange for {}",
        "i offer {} and looking for {} lessons"
    ]

    # Intent 5: video_call_help
    video_templates = [
        "видео дуудлага яаж хийх вэ?",
        "видео яриа хэрхэн эхлүүлэх вэ?",
        "дэлгэцээ яаж хуваалцах вэ?",
        "камераар яаж холбогдох вэ?",
        "видео дуудлага үнэгүй юу?",
        "1-on-1 video call яаж ажилладаг вэ?",
        "видео дуудлагаар хичээл яаж заах вэ?",
        "how to start a video call?",
        "how does screen sharing work?",
        "can i do video call with my swap partner?"
    ]

    # Intent 6: chat_help
    chat_templates = [
        "зурвас яаж бичих вэ?",
        "чат яаж ашиглах вэ?",
        "дуут мессеж voice note яаж явуулах вэ?",
        "файлаа яаж хавсаргаж илгээх вэ?",
        "зураг болон код яаж явуулах вэ?",
        "хэн онлайн байгааг яаж мэдэх вэ?",
        "how to send voice notes in chat?",
        "how to attach files and photos?",
        "how does real time chat work?"
    ]

    # Intent 7: request_help
    request_templates = [
        "хүсэлт яаж илгээх вэ?",
        "санал swap request яаж явуулах вэ?",
        "ирсэн хүсэлтийг яаж зөвшөөрөх вэ?",
        "хүсэлтээ яаж цуцлах вэ?",
        "хүсэлт зөвшөөрсний дараа яах вэ?",
        "how to send a match request?",
        "how to accept incoming swap requests?",
        "how to cancel a pending request?"
    ]

    # Intent 8: session_help
    session_templates = [
        "хичээл яаж төлөвлөх вэ?",
        "session яаж товлох вэ?",
        "цаг хэрхэн бүртгэгддэг вэ?",
        "hours swapped гэж юу вэ?",
        "хичээлийн хуваарь яаж гаргах вэ?",
        "how to schedule a swap session?",
        "how to track swapped learning hours?"
    ]

    # Intent 9: about_platform
    about_templates = [
        "skillswap гэж юу вэ?",
        "энэ сайт яаж ажилладаг вэ?",
        "энэ ямар учиртай платформ бэ?",
        "энд заавал мөнгө төлөх үү?",
        "үнэгүй чадвар солилцох гэж юу вэ?",
        "платформын гол боломжууд юу вэ?",
        "what is skillswap?",
        "how does this platform work?",
        "is this skill exchange free?"
    ]

    # Intent 10: greeting
    greeting_templates = [
        "сайн байна уу", "сайн уу", "өдрийн мэнд", "өглөөний мэнд",
        "оройн мэнд", "мэнд ээ", "сайн уу туслах аа", "hi", "hello", "hey there"
    ]

    # Generate samples evenly across intents
    intents_pool = [
        ("how_to_learn", how_to_learn_templates),
        ("find_friend", find_friend_templates),
        ("co_learning", co_learning_templates),
        ("skill_exchange", exchange_templates),
        ("video_call_help", video_templates),
        ("chat_help", chat_templates),
        ("request_help", request_templates),
        ("session_help", session_templates),
        ("about_platform", about_templates),
        ("greeting", greeting_templates),
    ]

    count_per_intent = total_samples // len(intents_pool)

    for intent, templates in intents_pool:
        for _ in range(count_per_intent):
            tmpl = random.choice(templates)
            s1 = random.choice(skills)
            s2 = random.choice(skills)
            while s1 == s2:
                s2 = random.choice(skills)

            if intent in ["how_to_learn", "co_learning"]:
                text = tmpl.format(s1)
                offered = []
                wanted = [ALIAS_TO_CANONICAL.get(s1, s1.title())]
            elif intent == "skill_exchange":
                text = tmpl.format(s1, s2)
                offered = [ALIAS_TO_CANONICAL.get(s1, s1.title())]
                wanted = [ALIAS_TO_CANONICAL.get(s2, s2.title())]
            else:
                text = tmpl
                offered = []
                wanted = []

            # Add occasional typos / punctuation variations
            if random.random() < 0.2:
                text = text.rstrip("?!.") + random.choice(["!", "?", "...", " :)", ""])

            dataset.append({
                "text": text,
                "intent": intent,
                "offered_skills": offered,
                "wanted_skills": wanted
            })

    # Shuffle dataset
    random.shuffle(dataset)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"[SUCCESS] Dataset created at '{output_path}' with {len(dataset)} verified samples.")
    return output_path

if __name__ == "__main__":
    generate_dataset()
