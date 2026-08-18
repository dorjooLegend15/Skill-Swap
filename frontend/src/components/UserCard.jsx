import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, ArrowRightLeft, Sparkles, UserCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SkillBadge from './SkillBadge';
import AuthPromptModal from './AuthPromptModal';

const UserCard = ({ user, onRequestSwap, isConnected = false }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authActionMessage, setAuthActionMessage] = useState('');

  const score = user.compatibility_score;

  const handleProtectedClick = (e, actionType) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setAuthActionMessage(
        actionType === 'view'
          ? 'Хэрэглэгчийн дэлгэрэнгүй профайл болон хичээлүүдийг үзэхийн тулд нэвтэрнэ үү.'
          : 'Чадвар солилцох санал илгээхийн тулд та системд нэвтэрнэ үү.'
      );
      setShowAuthModal(true);
    }
  };

  const handleSwapClick = () => {
    if (!isAuthenticated) {
      setAuthActionMessage('Чадвар солилцох санал илгээхийн тулд та системд нэвтэрнэ үү.');
      setShowAuthModal(true);
      return;
    }
    onRequestSwap(user);
  };

  return (
    <>
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between relative group animate-fade-in">
        <div>
          {/* Top Header: Avatar & Info */}
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to={`/users/${user.id}`}
                onClick={(e) => handleProtectedClick(e, 'view')}
                className="shrink-0 relative group/avatar"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`}
                  alt={user.full_name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                />
                {!isAuthenticated && (
                  <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <Lock className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </Link>

              <div className="min-w-0">
                <Link
                  to={`/users/${user.id}`}
                  onClick={(e) => handleProtectedClick(e, 'view')}
                  className="hover:text-violet-600 transition-colors"
                >
                  <h3 className="font-bold text-sm text-slate-800 truncate flex items-center gap-1.5">
                    {user.full_name}
                    {isConnected && (
                      <UserCheck className="w-3.5 h-3.5 text-violet-500" title="Холбогдсон найз" />
                    )}
                  </h3>
                </Link>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {user.headline || 'SkillSwap гишүүн'}
                </p>
              </div>
            </div>

            {score !== undefined && score !== null && (
              <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200 shrink-0">
                {score}% match
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="space-y-2.5 mb-5 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-violet-600 block mb-1">
                Заана:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.skills_offered && user.skills_offered.length > 0 ? (
                  user.skills_offered.slice(0, 2).map((s, idx) => (
                    <SkillBadge
                      key={idx}
                      name={s.skill_name}
                      proficiency={s.proficiency_level}
                      type="offered"
                      size="sm"
                    />
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Оруулаагүй</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-sky-600 block mb-1">
                Сурна:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.skills_wanted && user.skills_wanted.length > 0 ? (
                  user.skills_wanted.slice(0, 2).map((s, idx) => (
                    <SkillBadge
                      key={idx}
                      name={s.skill_name}
                      proficiency={s.target_level}
                      type="wanted"
                      size="sm"
                    />
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Оруулаагүй</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          {isAuthenticated ? (
            <Link
              to={`/users/${user.id}`}
              className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 transition-colors"
            >
              Үзэх
            </Link>
          ) : (
            <button
              onClick={(e) => handleProtectedClick(e, 'view')}
              className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Үзэх</span>
            </button>
          )}

          <button
            onClick={handleSwapClick}
            className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Санал илгээх</span>
          </button>
        </div>
      </div>

      {showAuthModal && (
        <AuthPromptModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          message={authActionMessage}
        />
      )}
    </>
  );
};

export default UserCard;
