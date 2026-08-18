"""
Comprehensive Skill Taxonomy and Knowledge Base for SkillSwap AI (Mongolian & English supported).
Covers Tech, AI, Languages, Science, Music Instruments, Arts, Business, and Sports.
"""

SKILL_TAXONOMY = {
    "Програмчлал & IT": {
        "Python": [
            "python", "пайтон", "питон", "django", "fastapi", "flask", "pandas", "numpy",
            "pytorch", "python script", "пайтон хэл", "python3"
        ],
        "JavaScript / React": [
            "javascript", "js", "react", "reactjs", "жаваскрипт", "реакт", "nextjs", "typescript",
            "ts", "тайпскрипт", "vue", "angular", "node", "nodejs", "вэб код"
        ],
        "C++ / C# / Java": [
            "c++", "cpp", "си плюс плюс", "c#", "csharp", "си шарп", "java", "жава",
            "spring boot", "oop", "өгөгдлийн бүтэц", "алгоритм"
        ],
        "Mobile App (Flutter/iOS/Android)": [
            "flutter", "флаттер", "swift", "ios", "kotlin", "android", "апп хөгжүүлэлт",
            "react native", "гар утасны апп", "mobile app"
        ],
        "Backend & DevOps": [
            "backend", "docker", "доккер", "sql", "postgresql", "mysql", "mongodb",
            "linux", "aws", "сервер", "devops", "cloud", "кибер аюулгүй байдал", "cyber security"
        ],
        "Вэб хөгжүүлэлт": [
            "web development", "html", "css", "tailwind", "frontend", "вэбсайт", "web dev",
            "responsive design", "вэб хийх"
        ]
    },
    "Хиймэл оюун & Дата": {
        "Machine Learning & AI": [
            "machine learning", "ml", "ai", "хиймэл оюун", "deep learning", "nlp",
            "computer vision", "neural network", "машин сургалт", "хиймэл оюун ухаан"
        ],
        "Data Analytics & PowerBI": [
            "data analysis", "дата анализ", "power bi", "powerbi", "excel", "эксел",
            "өгөгдлийн шинжилгээ", "tableau", "өгөгдлийн сан", "data science"
        ],
        "Prompt Engineering & LLMs": [
            "prompt engineering", "chatgpt", "llm", "claude", "gemini", "ai agent",
            "промпт бичих", "ai хэрэгслүүд"
        ]
    },
    "Гадаад хэл": {
        "Англи хэл": [
            "english", "англи хэл", "ielts", "toefl", "speaking", "ярианы англи хэл",
            "дүрмийн англи хэл", "english speaking", "grammar", "vocabulary", "англиар"
        ],
        "Япон хэл": [
            "japanese", "япон хэл", "nihongo", "jlpt", "n5", "n4", "n3", "n2", "n1",
            "хирагана", "катакана", "канжи", "японоор", "япон яриа"
        ],
        "Солонгос хэл": [
            "korean", "солонгос хэл", "topik", "hangul", "солонгос яриа", "солонгосоор"
        ],
        "Хятад хэл": [
            "chinese", "хятад хэл", "mandarin", "hsk", "ханз", "хятадаар", "хятад яриа"
        ],
        "Герман хэл": [
            "german", "герман хэл", "deutsch", "goethe", "германаар"
        ],
        "Франц хэл": [
            "french", "франц хэл", "français", "delf", "францаар"
        ],
        "Испани хэл": [
            "spanish", "испани хэл", "español", "испаниар"
        ],
        "Орос хэл": [
            "russian", "орос хэл", "русский", "оросоор"
        ],
        "Монгол бичиг & Калиграф": [
            "монгол бичиг", "уран бичлэг", "calligraphy", "монгол хэл", "бичиг"
        ]
    },
    "Шинжлэх ухаан & Хичээл": {
        "Математик": [
            "математик", "math", "mathematics", "алгебр", "геометр", "calculus",
            "интеграл", "дифференциал", "математикийн бодлого", "тоо", "эеш математик"
        ],
        "Физик": [
            "физик", "physics", "механик", "цахилгаан", "оптик", "эеш физик", "физикийн бодлого"
        ],
        "Хими": [
            "хими", "chemistry", "органик хими", "химийн бодлого", "эеш хими"
        ],
        "Биологи": [
            "биологи", "biology", "генетик", "хүний бие", "эеш биологи"
        ],
        "Эдийн засаг & Статистик": [
            "эдийн засаг", "economics", "микро эдийн засаг", "макро эдийн засаг",
            "статистик", "statistics", "магадлал"
        ]
    },
    "Хөгжим & Аудио": {
        "Акустик & Цахилгаан Гитар": [
            "guitar", "гитар", "акустик гитар", "классик гитар", "гоцлол гитар",
            "цахилгаан гитар", "guitar chords", "аккорд", "гитар тоглох"
        ],
        "Төгөлдөр хуур (Piano)": [
            "piano", "төгөлдөр хуур", "keyboard", "пианино", "төгөлдөр хуур тоглох", "нот"
        ],
        "Морин хуур": [
            "морин хуур", "morin khuur", "татлага", "морин хуур тоглох", "хөөмий"
        ],
        "Ятга & Үндэсний хөгжим": [
            "ятга", "yatga", "шанз", "лимбэ", "үндэсний хөгжим"
        ],
        "Бөмбөр & Хийл": [
            "drums", "бөмбөр", "violin", "хийл", "цохилуур хөгжим", "хийл тоглох"
        ],
        "Хөгжмийн продюсинг & Бит": [
            "music production", "ableton", "fl studio", "дуу бичлэг", "бит хийх",
            "beatmaking", "mixing", "mastering", "logic pro", "аудио эвлүүлэг"
        ],
        "Хоолойн дасгал & Дуулалт": [
            "singing", "дуулах", "хоолой засах", "vocal", "дууны дасгал", "вокал"
        ]
    },
    "Дизайн & Бүтээлч": {
        "UI/UX Дизайн (Figma)": [
            "ui/ux", "ui design", "ux design", "юи юэкс", "апп дизайн", "вэб дизайн",
            "figma", "фигма", "wireframe", "prototyping", "хэрэглэгчийн туршлага"
        ],
        "График Дизайн (Photoshop/Illustrator)": [
            "graphic design", "график дизайн", "photoshop", "фотошоп", "illustrator",
            "иллюстрэйтор", "лого хийх", "постер дизайн", "вектор зураг"
        ],
        "Видео Эвлүүлэг (Premiere/CapCut)": [
            "video editing", "видео эвлүүлэг", "premiere pro", "capcut", "after effects",
            "монтаж", "видео хийх", "reels монтаж", "youtube видео"
        ],
        "3D Загварчлал & Анимейшн (Blender)": [
            "blender", "3d modeling", "3d", "блендер", "3d дизайн", "rendering",
            "animation", "анимейшн", "3d загвар"
        ],
        "Гэрэл зураг & Зураг авалт": [
            "photography", "гэрэл зураг", "зураг авах", "камер тохиргоо", "lightroom"
        ]
    },
    "Бизнес & Маркетинг": {
        "Дижитал Маркетинг & SMM": [
            "digital marketing", "маркетинг", "facebook ads", "smm", "сошиал медиа",
            "мета маркетинг", "контент маркетинг", "инстаграм хөгжүүлэлт", "тиктокийн контент"
        ],
        "SEO & Copywriting": [
            "seo", "copywriting", "копирайтинг", "бичвэр бичих", "контент бүтээх"
        ],
        "Илтгэх урлаг & Харилцаа": [
            "public speaking", "илтгэх урлаг", "харилцааны ур чадвар", "ярианы чадвар",
            "тайзан дээр гарах", "presentation", "илтгэл тавих"
        ],
        "Нягтлан бодох & Санхүү": [
            "accounting", "нягтлан бодох", "санхүү", "татвар", "1c", "тайлан гаргах",
            "хувийн санхүү", "хөрөнгө оруулалт", "хувьцаа"
        ],
        "Төслийн менежмент & Бүтээмж": [
            "project management", "scrum", "agile", "pm", "цагийн менежмент", "бүтээмж"
        ]
    },
    "Эрүүл мэнд & Спорт": {
        "Шатрын урлаг": [
            "chess", "шатар", "дэгээ", "нүүдэл", "шатрын нээлт", "шатар тоглох"
        ],
        "Иог & Бясалгал": [
            "yoga", "иог", "бясалгал", "mindfulness", "амьсгалын дасгал", "стресс тайлах"
        ],
        "Фитнесс & Хүчний дасгал": [
            "fitness", "фитнесс", "дасгал", "gym", "жин хасах", "булчин барих",
            "calisthenics", "туррах", "эрүүл хооллолт"
        ],
        "Усанд сэлэлт & Бокс": [
            "swimming", "усанд сэлэх", "сэлэлт", "boxing", "бокс", "тулааны урлаг"
        ],
        "Сагсан бөмбөг & Хөл бөмбөг": [
            "basketball", "сагсан бөмбөг", "football", "хөл бөмбөг", "спорт"
        ]
    }
}

ALL_SKILL_NAMES = []
SKILL_TO_CATEGORY = {}
ALIAS_TO_CANONICAL = {}

for category, skills in SKILL_TAXONOMY.items():
    for canonical_name, aliases in skills.items():
        ALL_SKILL_NAMES.append(canonical_name)
        SKILL_TO_CATEGORY[canonical_name] = category
        for alias in aliases:
            ALIAS_TO_CANONICAL[alias.lower().strip()] = canonical_name

def normalize_skill(skill_str: str) -> str:
    s = skill_str.strip().lower()
    if s in ALIAS_TO_CANONICAL:
        return ALIAS_TO_CANONICAL[s]
    for alias, canonical in ALIAS_TO_CANONICAL.items():
        if alias in s or s in alias:
            return canonical
    return skill_str.strip().title()

def get_category_for_skill(skill_name: str) -> str:
    norm = normalize_skill(skill_name)
    return SKILL_TO_CATEGORY.get(norm, "Ерөнхий")
