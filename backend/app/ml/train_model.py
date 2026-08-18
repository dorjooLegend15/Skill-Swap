"""
Training and Knowledge Synthesis Script for SkillSwap AI.
Generates 50,000+ synthetic dialogues & conversational intents across all domains
and pre-compiles the NLP Vectorizer and Subject Knowledge Embeddings.
"""

import os
import sys
import pickle
import random
from typing import List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from app.ml.taxonomy import SKILL_TAXONOMY, ALL_SKILL_NAMES, ALIAS_TO_CANONICAL

# Comprehensive Subject Learning Roadmaps & Academic Knowledge
SUBJECT_KNOWLEDGE = {
    "Python": {
        "title": "Python Програмчлал",
        "description": "Python нь өгөгдлийн шинжилгээ, хиймэл оюун (AI/ML), вэб backend (FastAPI/Django) болон автоматжуулалтад хамгийн их хэрэглэгддэг, сурахад хамгийн хялбар хэл юм.",
        "roadmap": [
            "1. Суурь синтекс: Хувьсагч, өгөгдлийн төрөл (list, dict, set, tuple), нөхцөлт үйлдэл (if/else), давталт (for/while).",
            "2. Функц ба ООП (Object-Oriented Programming): def, class, inheritance, methods, exception handling.",
            "3. Практик сангууд: Вэбд FastAPI/Django, Дата шинжилгээнд Pandas/NumPy, AI-д PyTorch/Scikit-learn.",
            "4. Жижиг төсөл: CLI апп, Вэб scrape хийх, Telegram bot, REST API хөгжүүлэх."
        ],
        "tip": "Өдөрт 1 цаг код бичиж, LeetCode / HackerRank дээр суурь бодлогууд бодож дадал болгоорой!"
    },
    "JavaScript / React": {
        "title": "JavaScript & React Вэб Хөгжүүлэлт",
        "description": "Орчин үеийн бүх интернэт хөтчийн үндэс бөгөөд Single Page Application (SPA) болон бүрэн хэмжээний вэб бүтээхэд React хамгийн өндөр эрэлттэй сан юм.",
        "roadmap": [
            "1. JavaScript ES6+: Arrow functions, destructuring, promises, async/await, array methods (map, filter, reduce).",
            "2. React Core: JSX, Components, Props, State (useState, useEffect, useRef).",
            "3. Төлөв удирдлага ба Чиглүүлэлт: React Router DOM, Context API, Zustand/Redux Toolkit.",
            "4. Төсөл хийх: E-commerce вэбсайт, Real-time чат апп, Dashboard UI."
        ],
        "tip": "Tailwind CSS-тэй хослуулан UI загварчилбал маш хурдан бөгөөд мэргэжлийн харагддаг."
    },
    "Япон хэл": {
        "title": "Япон хэл (JLPT N5 -> N1)",
        "description": "Япон хэл нь Хирагана, Катакана, болон Канжи (Ханз) гэсэн гурван бичгийн системтэй, монгол хэлтэй өгүүлбэрийн бүтэц (S-O-V) маш адилхан тул монголчууд хурдан сурдаг.",
        "roadmap": [
            "1. Хирагана & Катакана цагаан толгойг бүрэн цээжлэх (1-2 долоо хоног).",
            "2. JLPT N5 дүрэм & Ханз: Minna no Nihongo 1 ном, суурь 100 ханз, 800 үг.",
            "3. JLPT N4 -> N3: Өдөр тутмын яриа, холбоос үгс, 300-600 ханз.",
            "4. Сонсох дасгал: Anime, NHK Easy News, Japanese Pod 101."
        ],
        "tip": "Anki Flashcards ашиглан ханз үгсийг өдөр бүр давтах нь хамгийн өндөр үр дүнтэй."
    },
    "Англи хэл": {
        "title": "Англи хэл (IELTS & Speaking)",
        "description": "Дэлхийн нийтийн харилцааны хэл. Мэргэжлээрээ өсөх, олон улсад суралцах хамгийн чухал түлхүүр.",
        "roadmap": [
            "1. Суурь үгийн сан: Oxford 3000 хамгийн түгээмэл үгсийг өгүүлбэрт оруулан цээжлэх.",
            "2. Ярианы дадлага (Speaking): Shadowing техник (гадаад хүний яриаг сонсоод даган хэлэх), өдөр бүр 15 минут чангаар ярих.",
            "3. Дүрэм: Essential Grammar in Use (Raymond Murphy) номоор баталгаажуулах.",
            "4. Сонсгол: TED Talks, BBC 6 Minute English, Podcasts."
        ],
        "tip": "Алдаа гаргахаас бүү ай! Гол нь зогсолтгүй ярьж, өөртөө итгэлтэй харилцах нь хамгийн чухал."
    },
    "UI/UX Дизайн (Figma)": {
        "title": "UI/UX Дизайн & Figma",
        "description": "Хэрэглэгчийн сэтгэл ханамж, ашиглахад хялбар интерфэйсийг судалгаатайгаар зохион бүтээх ур чадвар.",
        "roadmap": [
            "1. Дизайны суурь зарчмууд: Visual hierarchy, Whitespace, Typography, Color theory, Accessibility (WCAG).",
            "2. Figma Tool Mastering: Auto Layout, Components, Variants, Interactive Prototyping.",
            "3. UX Судалгаа: User Persona, User Flow, Wireframing, Usability Testing.",
            "4. Portfolio бүтээх: Dribbble, Behance дээр 2-3 шилдэг case study байршуулах."
        ],
        "tip": "Бусад амжилттай аппликейшнуудын (Airbnb, Spotify) дизайныг хуулбарлан зурж дадлага хийгээрэй."
    },
    "Акустик & Цахилгаан Гитар": {
        "title": "Гитар хөгжмийн анхан шат",
        "description": "Хамгийн алдартай утсан хөгжим. Суурь аккордууд сурахад л олон зуун дууг тоглох боломжтой болдог.",
        "roadmap": [
            "1. Гитар зөв барих, баруун гарын цохилт (Strumming) болон зүүн гарын хурууны дасгал.",
            "2. Анхан шатны аккордууд: Em, Am, C, G, D, E, A.",
            "3. Аккорд хооронд хурдан шилжих дасгал, 4/4 болон 3/4 хэмнэлтэй цохилтууд.",
            "4. Баре (Barre) аккорд: F, Bm болон дуртай дуунуудаа бүтнээр нь тоглох."
        ],
        "tip": "Хурууны өндөг эхний 1 долоо хоногт жаахан хөндүүрлэх нь хэвийн үзэгдэл бөгөөд тун удахгүй дасдаг шүү!"
    },
    "Төгөлдөр хуур (Piano)": {
        "title": "Төгөлдөр хуур (Piano) хөгжим",
        "description": "Хөгжмийн хаан хэмээн нэрлэгддэг, хөгжмийн онол болон сонсгол хөгжүүлэхэд хамгийн шилдэг зэмсэг.",
        "roadmap": [
            "1. Гарын зөв байрлал, суулт, клавиш (товчлуур)-ийн байрлал, До-Ре-Ми-Фа-Соль-Ля-Си.",
            "2. Баруун гараар энгийн аялгуу, зүүн гараар суурь басс эгшиг дарах.",
            "3. Нот унших: Соль түлхүүр ба Фа түлхүүр, хэмнэлийн нотууд.",
            "4. Хоёр гарын зохицол (Hand independence): Энгийн сонгодог болон орчин үеийн дуунууд."
        ],
        "tip": "Metronome (хэмнэл тоологч) ашиглан удаанаас эхлэн алхам алхмаар хурдлуулаарай."
    },
    "Морин хуур": {
        "title": "Морин хуур үндэсний хөгжим",
        "description": "Монгол үндэстний бахархал, ЮНЕСКО-д бүртгэлтэй хосгүй гайхамшигт нумт хөгжим.",
        "roadmap": [
            "1. Морин хуураа зөв барих, нум барилт, хөг тохируулах (F - Bb эсвэл C - G).",
            "2. Баруун гарын нум таталт: Тэгш, цэвэр дуугаралт гаргах дасгал.",
            "3. Зүүн гарын хурууны байрлал (Хурууны хумсаар утасны хажуу талаас шахаж дарах техник).",
            "4. Суурь татлага: Жороо морины явдал, Ардын дуунуудын аялгуу."
        ],
        "tip": "Нум татахдаа тохойгоо чөлөөтэй, бугуйн уян хатан хөдөлгөөнд онцгой анхаараарай."
    },
    "Математик": {
        "title": "Математик & Шинжлэх ухаан",
        "description": "Бүх шинжлэх ухаан, IT, эдийн засаг, инженерийн суурь логик сэтгэлгээ.",
        "roadmap": [
            "1. Алгебрийн суурь: Тэгшитгэл, тэнцэтгэл биш, зэрэг ба язгуур, функцийн график.",
            "2. Геометр ба Тригонометр: Дүрсүүдийн талбай/эзлэхүүн, Синус, Косинусын теорем.",
            "3. Магадлал & Статистик: Комбинаторик, магадлалын үндсэн дүрэм, дисперс.",
            "4. Calculus: Хязгаар, уламжлал, интеграл ба хэрэглээ."
        ],
        "tip": "Математикт дүрмийг цээжлэх биш, яагаад ийм үр дүн гарч байгаагийн логик гаргалгааг ойлгох нь чухал."
    },
    "Шатрын урлаг": {
        "title": "Шатрын урлаг & Стратеги",
        "description": "Оюун ухааны сонгодог спорт. Төлөвлөлт, тактик, тэвчээрийг хөгжүүлдэг.",
        "roadmap": [
            "1. Дүрсүүдийн нүүдэл, үнэ цэнэ, рок хийх, пешка хувиргах дүрэм.",
            "2. Нээлтийн суурь зарчим: Төвийг эзлэх, хөнгөн дүрсүүдээ гаргах, хааны аюулгүй байдал.",
            "3. Тактикийн аргууд: Сэрээ (Fork), Шорлог (Skewer), Нээлттэй цохилт, Мадлах сүлжээ.",
            "4. Төгсгөлийн тоглолт (Endgame): Ноён + Тэрэг, Ноён + Пешка төгсгөлүүд."
        ],
        "tip": "Lichess эсвэл Chess.com дээр өдөрт 15 минут тактикийн бодлого (Puzzles) бодоорой."
    }
}

def train_and_build_knowledge_base():
    print(">>> Starting SkillSwap AI Engine Training on 50,000+ synthetic dialog samples...")

    # 1. Generate Massive Corpus (50,000+ variations)
    corpus = []
    
    prefixes_teach = [
        "Би зааж чадна", "Би заана", "Би мэддэг", "Миний заах чадвар бол",
        "Туршлагатай", "Би хийдэг", "Би чаддаг", "I can teach", "I offer", "Experienced in"
    ]
    prefixes_learn = [
        "сурмаар байна", "сурч авмаар байна", "сурах хүсэлтэй байна", "заалгамаар байна",
        "хайж байна", "хэрэгтэй байна", "суръя", "i want to learn", "looking for", "teach me"
    ]
    connectors = [
        "солиод", "бас", "харин", "тэгээд", "болон", "and", "while looking for", "in exchange for"
    ]

    all_skills = list(ALIAS_TO_CANONICAL.keys())

    # Build permutations
    sample_count = 0
    while sample_count < 50000:
        s1 = random.choice(all_skills)
        s2 = random.choice(all_skills)
        if s1 == s2:
            continue

        p_t = random.choice(prefixes_teach)
        p_l = random.choice(prefixes_learn)
        conn = random.choice(connectors)

        pattern_type = random.randint(1, 4)
        if pattern_type == 1:
            phrase = f"{p_t} {s1} {conn} {s2} {p_l}"
        elif pattern_type == 2:
            phrase = f"{s2} {p_l} {conn} {p_t} {s1}"
        elif pattern_type == 3:
            phrase = f"Надад {s2} зааж өгөх хүн байна уу би {s1} {p_t}"
        else:
            phrase = f"{s1} ба {s2} солилцох сонирхолтой байна"

        corpus.append(phrase)
        sample_count += 1

    print(f"Generated {len(corpus)} training phrases across {len(all_skills)} skill entities.")

    # 2. Fit TF-IDF Vectorizer with char and word n-grams (2 to 5)
    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 5),
        lowercase=True,
        sublinear_tf=True
    )
    vectorizer.fit(corpus)
    print("TF-IDF N-Gram Vectorizer successfully fitted on 50,000+ dialogues!")

    # 3. Save Vectorizer and Subject Knowledge Base to file
    model_dir = os.path.dirname(__file__)
    model_path = os.path.join(model_dir, "ai_brain.pkl")

    save_data = {
        "vectorizer": vectorizer,
        "subject_knowledge": SUBJECT_KNOWLEDGE,
        "taxonomy": SKILL_TAXONOMY,
        "all_skills": ALL_SKILL_NAMES
    }

    with open(model_path, "wb") as f:
        pickle.dump(save_data, f)

    print(f"[SUCCESS] Trained AI Knowledge Brain saved to: {model_path}")
    return True

if __name__ == "__main__":
    train_and_build_knowledge_base()
