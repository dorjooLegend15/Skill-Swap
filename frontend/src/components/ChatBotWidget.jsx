import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, X, Send, Sparkles, ArrowRightLeft } from 'lucide-react';
import { chatbotAPI } from '../services/api';
import MatchRequestModal from './MatchRequestModal';

const ChatBotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Сайн байна уу! Би SkillSwap-ийн **AI Туслах** байна. Заах болон сурах чадвараа бичээд тохирох найзууд болон хамтран суралцагчдаа (Study Buddy) олоорой!",
      recommendations: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUserForSwap, setSelectedUserForSwap] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend = null) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await chatbotAPI.sendMessage(query, historyPayload);
      const botReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.data.reply,
        recommendations: res.data.recommendations || [],
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error('Widget error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "Алдаа гарлаа. 'Би Python заана, Япон хэл сурмаар байна' эсвэл 'Надад найз хайж өг' гэж бичээрэй.",
          recommendations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    '🔍 Найз хайх',
    '🤝 Хамтран суралцах (Study Buddy)',
    '📹 Видео дуудлага хэрхэн хийх вэ?',
    '💡 SkillSwap гэж юу вэ?',
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-5 z-40 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold p-3.5 rounded-full shadow-xl shadow-violet-500/30 transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer ${
          !isOpen ? 'animate-bounce' : ''
        }`}
        title="AI Туслах"
      >
        <Bot className="w-5 h-5" />
        <span className="hidden sm:inline text-xs font-bold">AI Туслах</span>
      </button>

      {/* Floating Assistant Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-5 z-40 w-[92vw] max-w-[390px] h-[540px] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-white" />
              <h4 className="text-xs font-bold">AI Чадвар Солилцооны Туслах</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium rounded-br-none shadow-md'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>

                {/* Recommendations */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="mt-2 w-full space-y-2">
                    {m.recommendations.map((rec) => (
                      <div
                        key={rec.user_id}
                        className="p-2.5 rounded-xl bg-white border border-violet-200 flex flex-col gap-2 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={rec.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.full_name}`}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-slate-100"
                            />
                            <div className="min-w-0">
                              <h5 className="font-bold text-slate-800 text-xs truncate">{rec.full_name}</h5>
                              <span className="text-[10px] text-violet-700 font-semibold block">
                                {rec.match_badge || `${rec.match_score}% тохирол`}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedUserForSwap(rec)}
                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-[10px] shrink-0 cursor-pointer shadow-sm"
                          >
                            Санал илгээх
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex justify-between">
                          <span>Заана: <b>{rec.offered_skill}</b></span>
                          <span>Сурна: <b>{rec.wanted_skill}</b></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="text-[11px] text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl w-fit flex items-center gap-1.5 shadow-2xs">
                <div className="w-2.5 h-2.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                <span>AI хайж байна...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-2.5 py-1.5 bg-violet-50/70 border-t border-violet-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {starterPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap text-[10px] px-2.5 py-1 rounded-full bg-white hover:bg-violet-100 text-slate-700 font-medium border border-slate-200 shrink-0 cursor-pointer shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2 bg-white border-t border-slate-200 flex items-center gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Асуух эсвэл хайх чадвараа бичнэ үү..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl disabled:opacity-40 cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Request Modal */}
      {selectedUserForSwap && (
        <MatchRequestModal
          isOpen={!!selectedUserForSwap}
          targetUser={selectedUserForSwap}
          onClose={() => setSelectedUserForSwap(null)}
          onSuccess={() => setSelectedUserForSwap(null)}
        />
      )}
    </>
  );
};

export default ChatBotWidget;
