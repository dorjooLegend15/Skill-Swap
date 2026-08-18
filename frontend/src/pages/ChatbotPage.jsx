import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send, ArrowRightLeft, Sparkles, Settings, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { chatbotAPI } from '../services/api';
import MatchRequestModal from '../components/MatchRequestModal';

const STARTER_PROMPTS = [
  '🔍 Надад тохирох найз хайж өг',
  '🤝 Хамтран суралцах хүн олох (Study Buddy)',
  '📹 Видео дуудлага яаж хийх вэ?',
  '🔄 Чадвар солилцох санал яаж илгээх вэ?',
  '💡 SkillSwap хэрхэн ажилладаг вэ?',
  'Би Python заана, Япон хэл сурмаар байна',
  'Математик яаж сурах вэ?',
  'Морин хуур сурмаар байна цуг суралцах хүн хайж байна',
];

const PoweredBadge = ({ poweredBy }) => {
  if (!poweredBy) return null;
  const isGemini = poweredBy === 'gemini';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
        isGemini
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'bg-slate-100 text-slate-500 border border-slate-200'
      }`}
    >
      {isGemini ? (
        <>
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          Gemini AI
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
          Local ML
        </>
      )}
    </span>
  );
};

const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Сайн байна уу! Би SkillSwap платформын **AI Ухаалаг Туслах** байна.\n\nБи танд дараах зүйлсээр тусалж чадна:\n• 🔍 Танд яг тохирох чадвар солилцох найз олох\n• 🤝 Хамтдаа суралцах **Study Buddy** хайж өгөх\n• 📚 Ямар ч хичээлийн суралцах **Roadmap** болон зөвлөгөө өгөх\n• 💡 Платформын боломжуудыг тайлбарлах\n\nТанд юугаар туслах вэ?",
      recommendations: [],
      powered_by: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUserForSwap, setSelectedUserForSwap] = useState(null);
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState(null); // 'active' | 'local' | null

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText = null) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await chatbotAPI.sendMessage(text, historyPayload);
      const data = res.data;

      // Track if Gemini is active
      if (data.powered_by === 'gemini') setGeminiStatus('active');
      else if (geminiStatus === null) setGeminiStatus('local');

      const botReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply,
        recommendations: data.recommendations || [],
        extracted_offered: data.extracted_skills_offered,
        extracted_wanted: data.extracted_skills_wanted,
        powered_by: data.powered_by,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "Алдаа гарлаа. Та дахин оролдоно уу.",
          recommendations: [],
          powered_by: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 h-[calc(100vh-5.5rem)] flex flex-col space-y-3 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between p-3.5 bg-white/95 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              SkillSwap AI Ухаалаг Туслах
              {geminiStatus === 'active' ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> Gemini 2.0 Flash
                </span>
              ) : geminiStatus === 'local' ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  Local ML
                </span>
              ) : null}
            </h1>
            <p className="text-[11px] text-slate-500">
              AI чат + ML Matchmaking • Монгол хэлний NLP
            </p>
          </div>
        </div>

        {/* API Setup Button */}
        <button
          onClick={() => setShowApiSetup(!showApiSetup)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Gemini API тохиргоо"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Gemini API Setup Banner */}
      {showApiSetup && (
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs space-y-2 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-blue-800">
            <Key className="w-4 h-4" />
            Gemini API тохируулах (Үнэгүй)
          </div>
          <p className="text-blue-700 leading-relaxed">
            Хүчирхэг AI чат идэвхжүүлэхийн тулд:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold">
                aistudio.google.com
              </a>
              {' '}дээр очиж Google Account-аар нэвтрэх
            </li>
            <li>"Create API key" дарж үнэгүй API key авах</li>
            <li>
              <code className="bg-blue-100 px-1 rounded font-mono">backend/.env</code>
              {' '}файл нээж <code className="bg-blue-100 px-1 rounded font-mono">GEMINI_API_KEY=</code> дараа paste хийх
            </li>
            <li>Backend сервер дахин эхлүүлэх (start.ps1 дахин ажиллуулах)</li>
          </ol>
          <div className="flex items-center gap-1.5 text-blue-600 font-medium bg-blue-100 p-2 rounded-xl border border-blue-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Одоо <strong>Local ML</strong> mode ажиллаж байна — API key оруулсны дараа Gemini идэвхжинэ.
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 bg-white/95 rounded-2xl border border-slate-200 p-4 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
          >
            {/* Message Bubble */}
            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[90%] sm:max-w-[82%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium rounded-br-none shadow-md'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
              {m.sender === 'bot' && m.powered_by && (
                <div className="mt-1.5 flex justify-end">
                  <PoweredBadge poweredBy={m.powered_by} />
                </div>
              )}
            </div>

            {/* Extracted Entity Tags */}
            {m.sender === 'bot' && (m.extracted_offered?.length > 0 || m.extracted_wanted?.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.extracted_offered?.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-violet-100 text-violet-800 border border-violet-200 text-[10px] font-bold">
                    ✓ Заах: {s}
                  </span>
                ))}
                {m.extracted_wanted?.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold">
                    ★ Сурах: {s}
                  </span>
                ))}
              </div>
            )}

            {/* Recommendation Cards */}
            {m.recommendations?.length > 0 && (
              <div className="mt-3 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                {m.recommendations.map((rec) => {
                  const isStudyBuddy = rec.match_type === 'study_buddy';
                  const isMentor = rec.match_type === 'mentor';
                  return (
                    <div
                      key={rec.user_id}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between text-xs shadow-sm transition-all hover:shadow-md ${
                        isStudyBuddy
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : isMentor
                          ? 'bg-sky-50/70 border-sky-200'
                          : 'bg-white border-violet-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isStudyBuddy ? 'bg-emerald-200 text-emerald-800'
                            : isMentor ? 'bg-sky-200 text-sky-800'
                            : 'bg-violet-100 text-violet-800'
                          }`}>
                            {rec.match_badge || '🔄 Харилцан солилцох'}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            {rec.match_score}%
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 mb-2.5">
                          <img
                            src={rec.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.full_name}`}
                            alt={rec.full_name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-xs truncate">{rec.full_name}</h4>
                            <p className="text-[10px] text-slate-500 truncate">{rec.headline || 'SkillSwap гишүүн'}</p>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl space-y-0.5 mb-2 border border-slate-100">
                          <div>Заана: <strong className="text-violet-700">{rec.offered_skill}</strong></div>
                          <div>Сурна: <strong className="text-sky-700">{rec.wanted_skill}</strong></div>
                        </div>

                        {rec.match_reason && (
                          <p className="text-[10px] text-slate-500 italic mb-3 leading-tight line-clamp-2">
                            {rec.match_reason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/users/${rec.user_id}`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-xl text-center transition-colors"
                        >
                          Үзэх
                        </Link>
                        <button
                          onClick={() => setSelectedUserForSwap(rec)}
                          className="flex-1 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Санал илгээх</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl w-fit flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <span>AI бодож байна...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompt Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
        {STARTER_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-violet-50 hover:text-violet-700 border border-slate-200 text-[11px] font-medium text-slate-700 whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-2.5 bg-white rounded-2xl border border-slate-200 flex items-center gap-2 shrink-0 shadow-sm"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Асуух зүйл эсвэл заах/сурах чадвараа бичнэ үү..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs rounded-xl disabled:opacity-40 cursor-pointer shadow-md flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Илгээх</span>
        </button>
      </form>

      {selectedUserForSwap && (
        <MatchRequestModal
          isOpen={!!selectedUserForSwap}
          targetUser={selectedUserForSwap}
          onClose={() => setSelectedUserForSwap(null)}
          onSuccess={() => setSelectedUserForSwap(null)}
        />
      )}
    </div>
  );
};

export default ChatbotPage;
