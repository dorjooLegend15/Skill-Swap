import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  Sparkles,
  Bot,
  Search,
  Users,
  ArrowRight,
  Activity,
} from "lucide-react";
import { matchesAPI } from "../services/api";
import UserCard from "../components/UserCard";
import MatchRequestModal from "../components/MatchRequestModal";
import FloatingSkillIcons from "../components/FloatingSkillIcons";

const Home = () => {
  const navigate = useNavigate();
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const [selectedUserForSwap, setSelectedUserForSwap] = useState(null);
  const [searchTeach, setSearchTeach] = useState("");
  const [searchLearn, setSearchLearn] = useState("");

  useEffect(() => {
    matchesAPI
      .explore({ limit: 6 })
      .then((res) => setFeaturedUsers(res.data.slice(0, 6)))
      .catch(() => {});
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTeach) params.append("teach_skill", searchTeach);
    if (searchLearn) params.append("learn_skill", searchLearn);
    navigate(`/explore?${params.toString()}`);
  };

  const categories = [
    "Програмчлал & IT",
    "Гадаад хэл",
    "Дизайн & Бүтээлч",
    "Хөгжим & Аудио",
    "Бизнес & Маркетинг",
    "Эрүүл мэнд & Иог",
  ];

  return (
    <>
      <div className="space-y-16 pb-16">
        {/* Hero Section */}
        <section className="relative pt-12 md:pt-20 text-center px-4 max-w-4xl mx-auto min-h-[360px]">
          <FloatingSkillIcons />
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-600 text-xs font-semibold mb-6 animate-fade-in-up animate-border-pulse"
            style={{ animationDelay: "0.1s" }}
          >
            <Sparkles className="w-3.5 h-3.5 animate-sparkle-in" />
            <span>Skill Swap платформ</span>
          </div>

          {/* Live learners status pill — animated to draw attention */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-slate-200 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span className="font-medium">
                Онлайн суралцагчид: <b className="text-emerald-600">127</b>
              </span>
              <Activity
                className="w-3 h-3 text-emerald-500 animate-pulse-dot"
                style={{ animationDuration: "2.6s" }}
              />
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight leading-tight mb-4 stagger-children">
            <span
              className="animate-fade-in-shimmer"
              style={{ animationDelay: "0.1s" }}
            >
              Өөрийн чадвараа зааж,{" "}
            </span>
            <br />
            <span
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent animate-fade-in-shimmer"
              style={{ animationDelay: "0.2s" }}
            >
              хүссэн бүхнээ
            </span>
            <span
              className="animate-fade-in-shimmer"
              style={{ animationDelay: "0.3s" }}
            >
              {" "}
              үнэгүй сур.
            </span>
          </h1>

          <p
            className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto mb-8 font-normal leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            Програмчлал заагаад Япон хэл сурах, Дизайн заагаад Гитар тоглож
            сурах зэргээр бие биедээ 1-on-1 туслан хамтдаа хөгжье.
          </p>

          {/* Minimal Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <form
              onSubmit={handleQuickSearch}
              className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
                <span className="text-xs font-semibold text-violet-600 shrink-0">
                  Би заана:
                </span>
                <input
                  type="text"
                  placeholder="ж нь: Python, Дизайн..."
                  value={searchTeach}
                  onChange={(e) => setSearchTeach(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
                <span className="text-xs font-semibold text-sky-600 shrink-0">
                  Би сурна:
                </span>
                <input
                  type="text"
                  placeholder="ж нь: Япон хэл, Гитар..."
                  value={searchLearn}
                  onChange={(e) => setSearchLearn(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 glow-accent text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-md"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Хайх</span>
              </button>
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 text-xs font-bold">
            <Link
              to="/chatbot"
              className="px-4 py-2 rounded-xl bg-white/80 hover:bg-violet-50 border border-slate-200 text-slate-700 flex items-center gap-2 transition-colors animate-fade-in-up shadow-sm"
            >
              <Bot className="w-4 h-4 text-violet-500" />
              <span>AI-аар тохирох хүн хайх</span>
            </Link>
            <Link
              to="/explore"
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-violet-600 transition-colors animate-fade-in-up"
            >
              Бүх хэрэглэгчид →
            </Link>
          </div>
        </section>

        {/* Category Pills */}
        <section className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-2 stagger-children">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                to={`/explore?category=${encodeURIComponent(cat)}`}
                className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-violet-50 text-slate-600 hover:text-violet-600 text-xs font-medium border border-slate-200 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>

        {/* Recommended Partners */}
        <section className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Санал болгож буй суралцагчид
              </h2>
              <p className="text-xs text-slate-500">
                Өндөр тохиролтой хүмүүс рүү шууд санал илгээнэ үү
              </p>
            </div>
            <Link
              to="/explore"
              className="text-xs font-bold text-violet-500 hover:text-violet-700 hover:underline flex items-center gap-1 animate-fade-in-up"
            >
              <span>Бүгдийг харах</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {featuredUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                onRequestSwap={(target) => setSelectedUserForSwap(target)}
              />
            ))}
          </div>
        </section>

        {/* Request Modal */}
        {selectedUserForSwap && (
          <MatchRequestModal
            isOpen={!!selectedUserForSwap}
            targetUser={selectedUserForSwap}
            onClose={() => setSelectedUserForSwap(null)}
            onSuccess={() => setSelectedUserForSwap(null)}
          />
        )}
      </div>

      {/* Floating decorative elements */}
      <div className="pointer-events-none absolute top-0 right-0 -ml-10 -mr-10 opacity-50">
        <div className="w-64 h-64 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-float animate-gentle-bob md:top-20 md:right-10 lg:top-32 lg:right-20"></div>
        <div
          className="w-32 h-32 rounded-full bg-sky-500/10 border border-sky-500/20 animate-float animate-gentle-bob lg:top-40 lg:right-40"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 animate-float animate-gentle-bob lg:top-60 lg:right-60"
          style={{ animationDelay: "3s" }}
        ></div>
        <svg
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-emerald-500/20 animate-wave"
          viewBox="0 0 100 30"
        >
          <path d="M0,5 Q20,0 Q40,20 Q60,5 Q80,25 Q100,5" fill="currentColor" />
        </svg>
      </div>
    </>
  );
};

export default Home;
