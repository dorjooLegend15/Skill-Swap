import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, LogIn, UserPlus, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthPromptModal = ({ isOpen, onClose, message }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleQuickLogin = async (email) => {
    try {
      await login(email, 'password123');
      onClose();
    } catch (e) {
      console.error(e);
      navigate('/login');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">Системд нэвтэрнэ үү</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {message || 'Хэрэглэгчийн дэлгэрэнгүй профайл үзэх, чадвар солилцох санал илгээх болон чатлахын тулд та системд нэвтэрсэн байх шаардлагатай.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Link
            to="/login"
            onClick={onClose}
            className="py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
          >
            <LogIn className="w-3.5 h-3.5" /> Нэвтрэх
          </Link>
          <Link
            to="/register"
            onClick={onClose}
            className="py-2.5 bg-slate-100 hover:bg-violet-50 text-slate-700 hover:text-violet-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <UserPlus className="w-3.5 h-3.5" /> Бүртгүүлэх
          </Link>
        </div>

        {/* 1-Click Fast Login for Demo */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 text-center">
            ⚡ Эсвэл 1 товшилтоор демо хаягаар нэвтрэх:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('alex.chen@skillswap.io')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-violet-50 border border-slate-200 text-left transition-colors cursor-pointer"
            >
              <p className="text-[11px] font-bold text-slate-800 truncate">Билгүүн (Python)</p>
              <p className="text-[9px] text-slate-400">alex.chen@skillswap.io</p>
            </button>
            <button
              onClick={() => handleQuickLogin('yuki.tanaka@skillswap.io')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-violet-50 border border-slate-200 text-left transition-colors cursor-pointer"
            >
              <p className="text-[11px] font-bold text-slate-800 truncate">Ариунзаяа (Япон хэл)</p>
              <p className="text-[9px] text-slate-400">yuki.tanaka@skillswap.io</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPromptModal;
