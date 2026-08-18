import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Send, Sparkles, BookOpen, GraduationCap } from 'lucide-react';
import { requestsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MatchRequestModal = ({ isOpen, targetUser, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [offeredSkill, setOfferedSkill] = useState('');
  const [wantedSkill, setWantedSkill] = useState('');
  const [isCustomOffered, setIsCustomOffered] = useState(false);
  const [isCustomWanted, setIsCustomWanted] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  // Extract skills offered by current user
  const mySkills = user?.skills_offered || [];

  // Extract skills offered by target user (what current user can learn from them)
  let theirSkills = [];
  if (Array.isArray(targetUser?.skills_offered) && targetUser.skills_offered.length > 0) {
    theirSkills = targetUser.skills_offered;
  } else if (targetUser?.offered_skill) {
    theirSkills = [{ skill_name: targetUser.offered_skill }];
  }

  // Pre-fill / reset values when modal opens or targetUser changes
  useEffect(() => {
    if (isOpen && targetUser) {
      setError('');
      setSent(false);
      setIsCustomOffered(false);
      setIsCustomWanted(false);

      // Default offered skill: first of user's offered skills
      if (mySkills.length > 0) {
        setOfferedSkill(mySkills[0].skill_name);
      } else {
        setOfferedSkill('');
        setIsCustomOffered(true);
      }

      // Default wanted skill: target user's offered skill or first item
      if (targetUser.offered_skill) {
        setWantedSkill(targetUser.offered_skill);
      } else if (theirSkills.length > 0) {
        setWantedSkill(theirSkills[0].skill_name);
      } else {
        setWantedSkill('');
        setIsCustomWanted(true);
      }
    }
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

  const handleSend = async () => {
    if (!offeredSkill.trim()) {
      setError('Заах чадвараа сонгох эсвэл бичнэ үү.');
      return;
    }
    if (!wantedSkill.trim()) {
      setError('Сурах чадвараа сонгох эсвэл бичнэ үү.');
      return;
    }

    setSending(true);
    setError('');
    try {
      await requestsAPI.send({
        receiver_id: targetUser.id || targetUser.user_id,
        offered_skill_name: offeredSkill.trim(),
        wanted_skill_name: wantedSkill.trim(),
        message: message.trim() || 'Сайн байна уу! Хамтдаа чадвар солилцож, бие биедээ тусацгаая.',
      });
      setSent(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Санал илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-violet-600" /> Чадвар солилцох санал илгээх
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target User Banner */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <img
            src={targetUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.full_name}`}
            alt=""
            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{targetUser.full_name}</p>
            <p className="text-[11px] text-slate-500 truncate">{targetUser.headline || 'SkillSwap гишүүн'}</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-6 space-y-2">
            <div className="text-4xl animate-bounce">🎉</div>
            <p className="text-sm font-bold text-violet-600">Санал амжилттай илгээгдлээ!</p>
            <p className="text-xs text-slate-400">Хэрэглэгч хүлээн авсны дараа та хоёр холбогдох болно.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs leading-tight">
                {error}
              </div>
            )}

            <div className="space-y-3.5">
              {/* 1. Skill I Offer */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-violet-700 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-violet-500" /> Би заана (Таны заах чадвар):
                  </label>
                  {mySkills.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomOffered(!isCustomOffered);
                        setOfferedSkill('');
                      }}
                      className="text-[10px] text-violet-600 hover:underline cursor-pointer"
                    >
                      {isCustomOffered ? 'Жагсаалтаас сонгох' : 'Өөрөөр бичих'}
                    </button>
                  )}
                </div>

                {!isCustomOffered && mySkills.length > 0 ? (
                  <select
                    value={offeredSkill}
                    onChange={(e) => setOfferedSkill(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                  >
                    <option value="">-- Заах чадвараа сонгоно уу --</option>
                    {mySkills.map((s, i) => (
                      <option key={i} value={s.skill_name}>
                        {s.skill_name} ({s.proficiency_level || 'General'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={offeredSkill}
                    onChange={(e) => setOfferedSkill(e.target.value)}
                    placeholder="ж нь: Python, Graphic Design, Англи хэл..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                  />
                )}
              </div>

              {/* 2. Skill I Want to Learn (from Target User) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-sky-700 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-sky-500" /> Сурах чадвар ({targetUser.full_name}-аас):
                  </label>
                  {theirSkills.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomWanted(!isCustomWanted);
                        setWantedSkill('');
                      }}
                      className="text-[10px] text-sky-600 hover:underline cursor-pointer"
                    >
                      {isCustomWanted ? 'Жагсаалтаас сонгох' : 'Өөрөөр бичих'}
                    </button>
                  )}
                </div>

                {!isCustomWanted && theirSkills.length > 0 ? (
                  <select
                    value={wantedSkill}
                    onChange={(e) => setWantedSkill(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                  >
                    <option value="">-- Сурах чадвараа сонгоно уу --</option>
                    {theirSkills.map((s, i) => (
                      <option key={i} value={s.skill_name}>
                        {s.skill_name} {s.proficiency_level ? `(${s.proficiency_level})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={wantedSkill}
                    onChange={(e) => setWantedSkill(e.target.value)}
                    placeholder="ж нь: Япон хэл, React, Төгөлдөр хуур..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                  />
                )}
              </div>

              {/* 3. Proposal Message */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Зурвас (заавал биш):
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Сайн байна уу! Тантай чадвар солилцох сонирхолтой байна..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                />
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5" /> {sending ? 'Илгээж байна...' : 'Санал илгээх'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MatchRequestModal;
