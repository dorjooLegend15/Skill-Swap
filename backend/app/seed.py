"""
Rich Database Seeder for SkillSwap AI (Mongolian & Global Demo Profiles).
Populates users across Tech, Languages, Music, Science, Arts, Business, and Sports.
"""

from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import User, UserSkillOffered, UserSkillWanted, MatchRequest, Message, Review, SwapSession

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print(">>> Seeding SkillSwap database with rich diverse demo users and skills...")

    demo_password_hash = get_password_hash("password123")

    users_data = [
        {
            "email": "alex.chen@skillswap.io",
            "full_name": "Билгүүн (Bilguun)",
            "headline": "Senior Full-Stack Engineer & Python хөгжүүлэгч",
            "bio": "FastAPI, Python, React дээр 6 жил ажиллаж байна. Програмчлалын мэдлэгээ хуваалцаж, оронд нь Япон хэл эсвэл Акустик Гитар заалгах сонирхолтой байна!",
            "location": "Улаанбаатар, Монгол",
            "timezone": "UTC+8",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            "github_url": "https://github.com/bilguun",
            "portfolio_url": "https://bilguun.dev",
            "rating": 4.9,
            "review_count": 18,
            "hours_swapped": 36.0,
            "skills_offered": [
                {"skill_name": "Python", "category": "Програмчлал & IT", "proficiency_level": "expert", "years_experience": 6, "description": "Backend API дизайн, async код, өгөгдлийн сангийн архитектур."},
                {"skill_name": "JavaScript / React", "category": "Програмчлал & IT", "proficiency_level": "advanced", "years_experience": 4, "description": "React 19, Custom Hooks, Frontend бүтэц."}
            ],
            "skills_wanted": [
                {"skill_name": "Япон хэл", "category": "Гадаад хэл", "target_level": "intermediate", "priority": "high", "goals": "JLPT N3 шалгалтад бэлдэх, ярианы чадвар сайжруулах."},
                {"skill_name": "Акустик & Цахилгаан Гитар", "category": "Хөгжим & Аудио", "target_level": "beginner", "priority": "medium", "goals": "Аккорд шилжилт, үндсэн ая тоглож сурах."}
            ]
        },
        {
            "email": "yuki.tanaka@skillswap.io",
            "full_name": "Ариунзаяа (Ariunzaya)",
            "headline": "Япон хэлний багш (JLPT N1) & UI/UX Сонирхогч",
            "bio": "Токиод 4 жил суралцсан, Япон хэлний N1 зэрэгтэй. Япон хэлний зөв дуудлага, яриа, соёлын онцлогийг заана. Оронд нь Python болон хиймэл оюун сурах хүсэлтэй!",
            "location": "Улаанбаатар / Токио",
            "timezone": "UTC+8",
            "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
            "portfolio_url": "https://ariunzaya.design",
            "rating": 5.0,
            "review_count": 24,
            "hours_swapped": 48.0,
            "skills_offered": [
                {"skill_name": "Япон хэл", "category": "Гадаад хэл", "proficiency_level": "expert", "years_experience": 5, "description": "JLPT N5-N1 бэлтгэл, өдөр тутмын болон бизнесийн яриа."},
                {"skill_name": "UI/UX Дизайн (Figma)", "category": "Дизайн & Бүтээлч", "proficiency_level": "intermediate", "years_experience": 2, "description": "Figma дээр апп дизайн, wireframe гаргах."}
            ],
            "skills_wanted": [
                {"skill_name": "Python", "category": "Програмчлал & IT", "target_level": "intermediate", "priority": "high", "goals": "Вэб скрапинг, өгөгдөл автоматжуулалт сурах."},
                {"skill_name": "Machine Learning & AI", "category": "Хиймэл оюун & Дата", "target_level": "beginner", "priority": "medium", "goals": "AI загваруудын суурь ойлголттой болох."}
            ]
        },
        {
            "email": "elena.rostova@skillswap.io",
            "full_name": "Энхжин (Enkhjin)",
            "headline": "Product Designer & Figma Design System Lead",
            "bio": "Вэб болон гар утасны UI/UX дизайн, Figma системийн чиглэлээр ажилладаг. Дизайн зааж өгөөд Англи хэл эсвэл Вэб хөгжүүлэлт заалгах хүсэлтэй.",
            "location": "Улаанбаатар, Монгол",
            "timezone": "UTC+8",
            "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
            "rating": 4.9,
            "review_count": 16,
            "hours_swapped": 34.0,
            "skills_offered": [
                {"skill_name": "UI/UX Дизайн (Figma)", "category": "Дизайн & Бүтээлч", "proficiency_level": "expert", "years_experience": 5, "description": "Figma Auto-layout, Design system, Prototype."},
                {"skill_name": "График Дизайн (Photoshop/Illustrator)", "category": "Дизайн & Бүтээлч", "proficiency_level": "advanced", "years_experience": 4, "description": "Photoshop, Illustrator, Брэнд хөгжүүлэлт."}
            ],
            "skills_wanted": [
                {"skill_name": "Англи хэл", "category": "Гадаад хэл", "target_level": "intermediate", "priority": "high", "goals": "IELTS Speaking 7.0 оноо авах, ярианы чадвар."},
                {"skill_name": "JavaScript / React", "category": "Програмчлал & IT", "target_level": "beginner", "priority": "medium", "goals": "Дизайнаа код болгох суурь сурах."}
            ]
        },
        {
            "email": "marcus.vance@skillswap.io",
            "full_name": "Тэмүүлэн (Temuulen)",
            "headline": "Хөгжмийн продюсер & Төгөлдөр хуурч",
            "bio": "Ableton Live, Logic Pro дээр хөгжим найруулга болон Төгөлдөр хуур заана. Оронд нь Дижитал Маркетинг, Сошиал суваг хөгжүүлэлт сурмаар байна.",
            "location": "Улаанбаатар, Монгол",
            "timezone": "UTC+8",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
            "rating": 4.8,
            "review_count": 12,
            "hours_swapped": 22.0,
            "skills_offered": [
                {"skill_name": "Төгөлдөр хуур (Piano)", "category": "Хөгжим & Аудио", "proficiency_level": "expert", "years_experience": 10, "description": "Жазз, сонгодог төгөлдөр хуур, аялгуу зохиомж."},
                {"skill_name": "Хөгжмийн продюсинг & Бит", "category": "Хөгжим & Аудио", "proficiency_level": "advanced", "years_experience": 5, "description": "Ableton Live, дууны бичлэг, миксинг мастер."}
            ],
            "skills_wanted": [
                {"skill_name": "Дижитал Маркетинг & SMM", "category": "Бизнес & Маркетинг", "target_level": "intermediate", "priority": "high", "goals": "Facebook, Instagram зар сурталчилгаа, контент төлөвлөлт."},
                {"skill_name": "Видео Эвлүүлэг (Premiere/CapCut)", "category": "Дизайн & Бүтээлч", "target_level": "beginner", "priority": "medium", "goals": "Shorts, Reels видео эвлүүлж сурах."}
            ]
        },
        {
            "email": "sophia.martinez@skillswap.io",
            "full_name": "Сарнай (Sarnai)",
            "headline": "Digital Marketing Strategist & Испани хэлний багш",
            "bio": "Meta Ads, Google SEO чиглэлээр 5 жил ажиллаж байна. Мөн Испани хэл заана. Оронд нь Төгөлдөр хуур тоглож сурах эсвэл Франц хэл заалгах хүсэлтэй!",
            "location": "Улаанбаатар, Монгол",
            "timezone": "UTC+8",
            "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
            "rating": 5.0,
            "review_count": 15,
            "hours_swapped": 30.0,
            "skills_offered": [
                {"skill_name": "Дижитал Маркетинг & SMM", "category": "Бизнес & Маркетинг", "proficiency_level": "expert", "years_experience": 5, "description": "Performance marketing, SEO, Content strategy."},
                {"skill_name": "Испани хэл", "category": "Гадаад хэл", "proficiency_level": "advanced", "years_experience": 4, "description": "Испани хэлний суурь дүрэм ба яриа."}
            ],
            "skills_wanted": [
                {"skill_name": "Төгөлдөр хуур (Piano)", "category": "Хөгжим & Аудио", "target_level": "beginner", "priority": "high", "goals": "Нот уншиж сурах, сонгодог аянууд тоглох."},
                {"skill_name": "Франц хэл", "category": "Гадаад хэл", "target_level": "beginner", "priority": "medium", "goals": "Франц хэлний суурь дуудлага сурах."}
            ]
        },
        {
            "email": "khangal.morin@skillswap.io",
            "full_name": "Хангал (Khangal)",
            "headline": "Морин хуурч & Үндэсний урлагийн багш",
            "bio": "Морин хуур тоглох, үндэсний ардын болон орчин үеийн татлагуудыг анхан шатнаас нь заана. Оронд нь Математик (ЭЕШ) болон Англи хэлний яриа заалгах хүсэлтэй.",
            "location": "Улаанбаатар, Монгол",
            "timezone": "UTC+8",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
            "rating": 5.0,
            "review_count": 19,
            "hours_swapped": 40.0,
            "skills_offered": [
                {"skill_name": "Морин хуур", "category": "Хөгжим & Аудио", "proficiency_level": "expert", "years_experience": 8, "description": "Морин хуурын үндсэн барилт, татлага, нум таталтын техник."},
                {"skill_name": "Монгол бичиг & Калиграф", "category": "Гадаад хэл", "proficiency_level": "advanced", "years_experience": 4, "description": "Уран бичлэг, тиг, зурлага."}
            ],
            "skills_wanted": [
                {"skill_name": "Математик", "category": "Шинжлэх ухаан & Хичээл", "target_level": "intermediate", "priority": "high", "goals": "Алгебр, геометр, ЭЕШ-ийн бодлого бодох арга барил."},
                {"skill_name": "Англи хэл", "category": "Гадаад хэл", "target_level": "intermediate", "priority": "medium", "goals": "Speaking, гадаадын тоглолтод өөрийгөө танилцуулах яриа."}
            ]
        },
        {
            "email": "otgon.math@skillswap.io",
            "full_name": "Отгонбаяр (Otgonbayar)",
            "headline": "Математик, Физикийн олимпиад бэлтгэгч багш",
            "bio": "Математик, Физикийн бодлогуудыг ойлгомжтой, логиктой тайлбарлаж заана. Оронд нь Морин хуур тоглож сурах эсвэл Шатрын тактик заалгах хүсэлтэй!",
            "location": "Улаанбаатар, Монгол",
            "timezone": "UTC+8",
            "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
            "rating": 4.9,
            "review_count": 22,
            "hours_swapped": 45.0,
            "skills_offered": [
                {"skill_name": "Математик", "category": "Шинжлэх ухаан & Хичээл", "proficiency_level": "expert", "years_experience": 7, "description": "ЭЕШ математик, Олимпиад, Интеграл, Магадлал."},
                {"skill_name": "Физик", "category": "Шинжлэх ухаан & Хичээл", "proficiency_level": "advanced", "years_experience": 5, "description": "Механик, цахилгаан, квант физикийн бодлогууд."}
            ],
            "skills_wanted": [
                {"skill_name": "Морин хуур", "category": "Хөгжим & Аудио", "target_level": "beginner", "priority": "high", "goals": "Морин хуур сурч ардын аялгуу тоглох."},
                {"skill_name": "Шатрын урлаг", "category": "Эрүүл мэнд & Спорт", "target_level": "intermediate", "priority": "medium", "goals": "Нээлт болон төгсгөлийн стратеги сурах."}
            ]
        },
        {
            "email": "bat.chess@skillswap.io",
            "full_name": "Бат-Эрдэнэ (Bat-Erdene)",
            "headline": "Шатрын Дэд мастер & Иогийн дасгалжуулагч",
            "bio": "Шатрын тактик, нээлтийн онол, тооцоолол заана. Оронд нь 3D Blender эсвэл Солонгос хэл сурмаар байна.",
            "location": "Улаанбаатар, Монгол",
            "timezone": "UTC+8",
            "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
            "rating": 4.9,
            "review_count": 14,
            "hours_swapped": 26.0,
            "skills_offered": [
                {"skill_name": "Шатрын урлаг", "category": "Эрүүл мэнд & Спорт", "proficiency_level": "expert", "years_experience": 8, "description": "Тактикийн бодлого, төвийн хяналт, нээлтийн репертуар."},
                {"skill_name": "Иог & Бясалгал", "category": "Эрүүл мэнд & Спорт", "proficiency_level": "intermediate", "years_experience": 3, "description": "Амьсгалын дасгал, стресс тайлах йог."}
            ],
            "skills_wanted": [
                {"skill_name": "3D Загварчлал & Анимейшн (Blender)", "category": "Дизайн & Бүтээлч", "target_level": "beginner", "priority": "high", "goals": "Blender 3D дүрслэл, рендер хийх."},
                {"skill_name": "Солонгос хэл", "category": "Гадаад хэл", "target_level": "beginner", "priority": "medium", "goals": "Hangul үсэг, анхан шатны яриа."}
            ]
        },
        {
            "email": "nomun.blender@skillswap.io",
            "full_name": "Номундарь (Nomundari)",
            "headline": "3D Artist (Blender) & Видео эвлүүлэгч",
            "bio": "Blender дээр 3D modeling, lighting, animation хийдэг. Оронд нь Шатрын урлаг болон Солонгос хэл заалгах хүсэлтэй!",
            "location": "Улаанбаатар, Монгол",
            "timezone": "UTC+8",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            "rating": 5.0,
            "review_count": 17,
            "hours_swapped": 32.0,
            "skills_offered": [
                {"skill_name": "3D Загварчлал & Анимейшн (Blender)", "category": "Дизайн & Бүтээлч", "proficiency_level": "expert", "years_experience": 4, "description": "Hard-surface modeling, Cycles rendering, 3D assets."},
                {"skill_name": "Видео Эвлүүлэг (Premiere/CapCut)", "category": "Дизайн & Бүтээлч", "proficiency_level": "advanced", "years_experience": 3, "description": "Premiere Pro монтаж, өнгө засалт."}
            ],
            "skills_wanted": [
                {"skill_name": "Шатрын урлаг", "category": "Эрүүл мэнд & Спорт", "target_level": "intermediate", "priority": "high", "goals": "Шатрын тактик болон нүүдлийн комбинаци сурах."},
                {"skill_name": "Солонгос хэл", "category": "Гадаад хэл", "target_level": "intermediate", "priority": "medium", "goals": "K-Drama, TOPIK 2 бэлтгэл."}
            ]
        }
    ]

    created_users = []
    for u_data in users_data:
        user = User(
            email=u_data["email"],
            hashed_password=demo_password_hash,
            full_name=u_data["full_name"],
            headline=u_data["headline"],
            bio=u_data["bio"],
            location=u_data["location"],
            timezone=u_data["timezone"],
            avatar=u_data["avatar"],
            github_url=u_data.get("github_url"),
            portfolio_url=u_data.get("portfolio_url"),
            rating=u_data["rating"],
            review_count=u_data["review_count"],
            hours_swapped=u_data["hours_swapped"],
            is_active=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=60)
        )
        db.add(user)
        db.flush()

        for s in u_data["skills_offered"]:
            off = UserSkillOffered(
                user_id=user.id,
                skill_name=s["skill_name"],
                category=s["category"],
                proficiency_level=s["proficiency_level"],
                years_experience=s["years_experience"],
                description=s["description"]
            )
            db.add(off)

        for s in u_data["skills_wanted"]:
            wnt = UserSkillWanted(
                user_id=user.id,
                skill_name=s["skill_name"],
                category=s["category"],
                target_level=s["target_level"],
                priority=s["priority"],
                goals=s["goals"]
            )
            db.add(wnt)

        created_users.append(user)

    db.commit()

    # Seed Connected Friendships and Active Swap Requests
    u_bilguun = created_users[0]
    u_ariun = created_users[1]
    u_enkhjin = created_users[2]
    u_temuulen = created_users[3]
    u_sarnai = created_users[4]
    u_khangal = created_users[5]
    u_otgon = created_users[6]
    u_bat = created_users[7]
    u_nomun = created_users[8]

    # Bilguun <-> Ariunzaya: Accepted friend
    req1 = MatchRequest(
        sender_id=u_bilguun.id,
        receiver_id=u_ariun.id,
        offered_skill_name="Python",
        wanted_skill_name="Япон хэл",
        message="Сайн байна уу Ариунзаяа! Би Python backend зааж өгье, та надад Япон хэлний суурь яриа зааж өгөөрэй.",
        status="accepted",
        created_at=datetime.now(timezone.utc) - timedelta(days=10)
    )
    db.add(req1)

    # Enkhjin -> Bilguun: Pending Incoming Request
    req2 = MatchRequest(
        sender_id=u_enkhjin.id,
        receiver_id=u_bilguun.id,
        offered_skill_name="UI/UX Дизайн (Figma)",
        wanted_skill_name="Python",
        message="Сайн уу Билгүүн! Би таны Python сурах хичээлд сууж, оронд нь Figma Auto-layout болон Design System-ийг мэргэжлийн түвшинд зааж өгөх боломжтой байна.",
        status="pending",
        created_at=datetime.now(timezone.utc) - timedelta(hours=3)
    )
    db.add(req2)

    # Khangal -> Otgonbayar: Accepted
    req3 = MatchRequest(
        sender_id=u_khangal.id,
        receiver_id=u_otgon.id,
        offered_skill_name="Морин хуур",
        wanted_skill_name="Математик",
        message="Сайн байна уу багшаа! Математикийн ЭЕШ бэлтгэлд туслаач, би оронд нь Морин хуурын анхан шатны татлага зааж өгье.",
        status="accepted",
        created_at=datetime.now(timezone.utc) - timedelta(days=5)
    )
    db.add(req3)

    # Bat-Erdene <-> Nomundari: Accepted (Study Buddy & Bilateral)
    req4 = MatchRequest(
        sender_id=u_bat.id,
        receiver_id=u_nomun.id,
        offered_skill_name="Шатрын урлаг",
        wanted_skill_name="3D Загварчлал & Анимейшн (Blender)",
        message="Сайн байна уу! Шатрын нээлт, тактик заагаад оронд нь 3D Blender рендер заалгая.",
        status="accepted",
        created_at=datetime.now(timezone.utc) - timedelta(days=2)
    )
    db.add(req4)

    # Seed Initial Chat Messages
    msg1 = Message(
        sender_id=u_ariun.id,
        receiver_id=u_bilguun.id,
        content="Сайн байна уу Билгүүн! Манай эхний хичээл маргааш 19:00 цагт эхлэх боломжтой юу?",
        msg_type="text",
        is_read=True,
        created_at=datetime.now(timezone.utc) - timedelta(hours=12)
    )
    msg2 = Message(
        sender_id=u_bilguun.id,
        receiver_id=u_ariun.id,
        content="Сайн уу Ариунзаяа! Тийм ээ, маргааш 19:00 цагт видео дуудлагаараа уулзъя. Би Python суурь материалуудаа бэлдчихлээ.",
        msg_type="text",
        is_read=True,
        created_at=datetime.now(timezone.utc) - timedelta(hours=10)
    )
    db.add(msg1)
    db.add(msg2)

    # Seed Reviews
    rev1 = Review(
        reviewer_id=u_ariun.id,
        reviewee_id=u_bilguun.id,
        rating=5.0,
        skill_name="Python",
        comment="FastAPI болон өгөгдлийн сангийн ойлголтыг маш тодорхой, бодит жишээн дээр тайлбарлаж өгсөн. Маш мундаг ментор!"
    )
    rev2 = Review(
        reviewer_id=u_bilguun.id,
        reviewee_id=u_ariun.id,
        rating=5.0,
        skill_name="Япон хэл",
        comment="Япон хэлний дуудлага, дүрэм, соёлыг маш сонирхолтой аргаар заасан. Үнэхээр сэтгэл хангалуун байна!"
    )
    db.add(rev1)
    db.add(rev2)

    db.commit()
    db.close()
    print("[SUCCESS] SkillSwap database successfully seeded with rich Mongolian profiles and relationships!")

if __name__ == "__main__":
    seed_database()
