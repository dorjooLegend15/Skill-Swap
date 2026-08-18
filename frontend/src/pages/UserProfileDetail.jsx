import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Clock,
  ExternalLink,
  ArrowRightLeft,
  MessageSquare,
  Globe,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  BookOpen,
  GraduationCap,
  Calendar,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillBadge from '../components/SkillBadge';
import MatchRequestModal from '../components/MatchRequestModal';
import AuthPromptModal from '../components/AuthPromptModal';

const UserProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      usersAPI.getProfile(id).catch((err) => {
        console.error('Error fetching user profile:', err);
        return null;
      }),
      usersAPI.getReviews(id).catch((err) => {
        console.error('Error fetching reviews:', err);
        return { data: [] };
      }),
    ])
      .then(([profileRes, reviewsRes]) => {
        if (profileRes?.data) {
          setProfile(profileRes.data);
        }
        if (reviewsRes?.data) {
          setReviews(reviewsRes.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-medium">Хэрэглэгчийн мэдээллийг ачааллаж байна...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-violet-500/30">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-800">Хэрэглэгчийн профайл үзэхийн тулд нэвтэрнэ үү</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            SkillSwap нь бүртгэлтэй гишүүд хоорондын аюулгүй, итгэлтэй чадвар солилцоог хангадаг тул дэлгэрэнгүй профайл үзэх, холбогдохын тулд системд нэвтэрсэн байна.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            to="/login"
            className="py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
          >
            <LogIn className="w-4 h-4" /> Нэвтрэх
          </Link>
          <Link
            to="/register"
            className="py-3 bg-slate-100 hover:bg-violet-50 text-slate-700 hover:text-violet-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <UserPlus className="w-4 h-4" /> Бүртгүүлэх
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 mb-2">⚡ 1 товшилтоор демо хаягаар нэвтрэх:</p>
          <button
            onClick={() => login('alex.chen@skillswap.io', 'password123')}
            className="w-full p-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-xs font-bold text-violet-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            Билгүүн (alex.chen@skillswap.io) хаягаар нэвтрэх
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-4xl">🔍</div>
        <h2 className="text-base font-bold text-slate-800">Хэрэглэгч олдсонгүй</h2>
        <p className="text-xs text-slate-500">
          Таны хайсан хэрэглэгчийн бүртгэл олдсонгүй эсвэл идэвхгүй болсон байна.
        </p>
        <button
          onClick={() => navigate('/explore')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Хэрэглэгчид рүү буцах
        </button>
      </div>
    );
  }

  const isSelf = currentUser && String(currentUser.id) === String(profile.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Буцах
        </button>
      </div>

      {/* Profile Header Banner Card */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <img
            src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`}
            alt={profile.full_name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white shadow-md shrink-0 bg-slate-100"
          />

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {profile.full_name}
                <CheckCircle2 className="w-4 h-4 text-emerald-500" title="Баталгаажсан гишүүн" />
              </h1>
              {profile.compatibility_score && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200">
                  {profile.compatibility_score}% тохирол
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {profile.headline || 'SkillSwap талбарын идэвхтэй гишүүн'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1 font-semibold text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {profile.rating ? profile.rating.toFixed(1) : '5.0'} ({profile.review_count || reviews.length} үнэлгээ)
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {profile.hours_swapped || 0} цаг солилцсон
              </span>
            </div>

            {profile.bio && (
              <p className="text-xs text-slate-600 pt-2 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {profile.bio}
              </p>
            )}

            {/* Links */}
            {(profile.github_url || profile.linkedin_url || profile.portfolio_url) && (
              <div className="flex items-center gap-2 pt-2">
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                  >
                    <Globe className="w-3 h-3 text-slate-500" /> GitHub
                  </a>
                )}
                {profile.portfolio_url && (
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-500" /> Portfolio
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons (only if not viewing self) */}
        {!isSelf && (
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowAuthModal(true);
                  return;
                }
                setShowSwapModal(true);
              }}
              className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <ArrowRightLeft className="w-4 h-4" /> Чадвар солилцох санал илгээх
            </button>
            <Link
              to={`/chat/${profile.id}`}
              className="px-5 py-2.5 bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Зурвас бичих
            </Link>
          </div>
        )}
      </div>

      {/* Skills Grid: Offered vs Wanted */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Offered Skills */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-violet-600" /> Заах чадварууд (Offered)
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">
              {profile.skills_offered?.length || 0} чадвар
            </span>
          </div>

          <div className="space-y-2.5">
            {profile.skills_offered && profile.skills_offered.length > 0 ? (
              profile.skills_offered.map((s, i) => (
                <div key={i} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <SkillBadge name={s.skill_name} type="offered" proficiency={s.proficiency_level} size="sm" />
                    {s.years_experience && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {s.years_experience} жил туршлагатай
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-[11px] text-slate-500 pt-1 leading-normal">{s.description}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-3 text-center">Заах чадвар оруулаагүй байна.</p>
            )}
          </div>
        </div>

        {/* Wanted Skills */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-600" /> Сурах хүсэлтэй чадварууд (Wanted)
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">
              {profile.skills_wanted?.length || 0} чадвар
            </span>
          </div>

          <div className="space-y-2.5">
            {profile.skills_wanted && profile.skills_wanted.length > 0 ? (
              profile.skills_wanted.map((s, i) => (
                <div key={i} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <SkillBadge name={s.skill_name} type="wanted" proficiency={s.target_level} size="sm" />
                    {s.priority && (
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">
                        {s.priority} priority
                      </span>
                    )}
                  </div>
                  {s.goals && (
                    <p className="text-[11px] text-slate-500 pt-1 leading-normal">
                      Зорилго: {s.goals}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-3 text-center">Сурах чадвар оруулаагүй байна.</p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            Хүлээн авсан үнэлгээ & сэтгэгдлүүд
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            {reviews.length} сэтгэгдэл
          </span>
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-2.5">
            {reviews.map((r, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={r.reviewer_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.reviewer_name || 'User'}`}
                      alt=""
                      className="w-6 h-6 rounded-lg object-cover"
                    />
                    <span className="text-xs font-bold text-slate-800">{r.reviewer_name || 'Хэрэглэгч'}</span>
                    {r.skill_name && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 font-medium">
                        {r.skill_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {r.rating}
                  </div>
                </div>
                {r.comment && <p className="text-xs text-slate-600 leading-relaxed pl-8">{r.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
            Одоогоор үнэлгээ бүртгэгдээгүй байна.
          </div>
        )}
      </div>

      {/* Match Request Modal */}
      {showSwapModal && (
        <MatchRequestModal
          isOpen={showSwapModal}
          targetUser={profile}
          onClose={() => setShowSwapModal(false)}
          onSuccess={() => setShowSwapModal(false)}
        />
      )}

      {showAuthModal && (
        <AuthPromptModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          message="Чадвар солилцох санал илгээхийн тулд системд нэвтэрнэ үү."
        />
      )}
    </div>
  );
};

export default UserProfileDetail;
