import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Mic, Video, ArrowLeft, Image as ImageIcon, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesAPI, usersAPI } from '../services/api';
import VoiceRecorder from '../components/VoiceRecorder';
import FileShareModal from '../components/FileShareModal';
import VideoCallModal from '../components/VideoCallModal';

const ChatPage = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected, sendChatMessage, sendTyping, isUserOnline, subscribe } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(partnerId ? parseInt(partnerId) : null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [showVoice, setShowVoice] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showSidebar, setShowSidebar] = useState(!partnerId);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (partnerId) {
      const pid = parseInt(partnerId);
      setSelectedPartner(pid);
      setShowSidebar(false);
    }
  }, [partnerId]);

  useEffect(() => {
    if (selectedPartner) {
      loadMessages(selectedPartner);
      loadPartnerInfo(selectedPartner);
    }
  }, [selectedPartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to real-time incoming messages
  useEffect(() => {
    const unsub = subscribe('message', (newMsg) => {
      if (
        (newMsg.sender_id === selectedPartner && newMsg.receiver_id === user?.id) ||
        (newMsg.sender_id === user?.id && newMsg.receiver_id === selectedPartner)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
      // Update sidebar last message
      setConversations((prev) => {
        const partnerId = newMsg.sender_id === user?.id ? newMsg.receiver_id : newMsg.sender_id;
        const exists = prev.some((c) => (c.partner?.id || c.partner_id) === partnerId);
        if (!exists) {
          loadConversations();
          return prev;
        }
        return prev.map((c) => {
          const cPid = c.partner?.id || c.partner_id;
          if (cPid === partnerId) {
            return {
              ...c,
              last_message: {
                content: newMsg.content || (newMsg.msg_type === 'voice' ? '🎤 Дуут мессеж' : '📎 Файл'),
                created_at: newMsg.created_at,
              },
            };
          }
          return c;
        });
      });
    });

    return () => {
      unsub();
    };
  }, [selectedPartner, user?.id, subscribe]);

  const loadConversations = async () => {
    try {
      const res = await messagesAPI.getRecentConversations();
      if (res.data && res.data.length > 0) {
        setConversations(res.data);
        if (!selectedPartner && !partnerId) {
          setSelectedPartner(res.data[0].partner?.id || res.data[0].partner_id);
        }
      } else {
        // Fallback to connected friends
        const frRes = await usersAPI.getFriends();
        const friendConvs = (frRes.data || []).map((f) => ({
          partner: {
            id: f.id,
            full_name: f.full_name,
            avatar: f.avatar,
            headline: f.headline,
          },
          last_message: null,
          unread_count: 0,
        }));
        setConversations(friendConvs);
        if (!selectedPartner && !partnerId && friendConvs.length > 0) {
          setSelectedPartner(friendConvs[0].partner.id);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = async (pid) => {
    try {
      const res = await messagesAPI.getHistory(pid);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Error loading message history:', err);
    }
  };

  const loadPartnerInfo = async (pid) => {
    try {
      const res = await usersAPI.getProfile(pid);
      setPartnerInfo(res.data);
    } catch {
      const conv = conversations.find((c) => (c.partner?.id || c.partner_id) === pid);
      if (conv) {
        setPartnerInfo(conv.partner || { id: pid, full_name: 'Хэрэглэгч' });
      }
    }
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedPartner || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    const tempMsg = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: selectedPartner,
      content,
      msg_type: 'text',
      created_at: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, tempMsg]);

    try {
      // 1. Try WebSocket send first
      const sentViaWs = sendChatMessage(selectedPartner, content, { msg_type: 'text' });
      if (!sentViaWs) {
        // 2. If WS not ready, fallback to REST API
        await messagesAPI.sendMessage({
          receiver_id: selectedPartner,
          content,
          msg_type: 'text',
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleMediaSent = (mediaMsg) => {
    const tempMsg = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: selectedPartner,
      content: mediaMsg.content || '',
      msg_type: mediaMsg.msg_type,
      file_url: mediaMsg.file_url,
      file_name: mediaMsg.file_name,
      file_size: mediaMsg.file_size,
      audio_duration: mediaMsg.audio_duration,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    sendChatMessage(selectedPartner, mediaMsg.content || '', {
      msg_type: mediaMsg.msg_type,
      file_url: mediaMsg.file_url,
      file_name: mediaMsg.file_name,
      file_size: mediaMsg.file_size,
      audio_duration: mediaMsg.audio_duration,
    });
  };

  const renderMessage = (msg) => {
    const isMine = msg.sender_id === user?.id;
    const mediaUrl = msg.file_url || msg.media_url;

    return (
      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
        <div
          className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
            isMine
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-br-none'
              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
          }`}
        >
          {msg.msg_type === 'photo' && mediaUrl && (
            <div className="mb-2 overflow-hidden rounded-xl">
              <img src={mediaUrl} alt="Зураг" className="max-w-full max-h-60 object-cover rounded-xl hover:scale-105 transition-transform" />
            </div>
          )}

          {msg.msg_type === 'voice' && mediaUrl && (
            <div className="my-1">
              <audio controls src={mediaUrl} className="w-full max-w-xs" />
            </div>
          )}

          {msg.msg_type === 'file' && mediaUrl && (
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 p-2 rounded-xl border mb-1.5 transition-colors ${
                isMine
                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-violet-700 font-medium'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">{msg.file_name || 'Хавсаргасан файл татах'}</span>
            </a>
          )}

          {msg.content && <p className="whitespace-pre-line">{msg.content}</p>}

          <span
            className={`text-[9px] mt-1.5 block text-right font-medium ${
              isMine ? 'text-white/70' : 'text-slate-400'
            }`}
          >
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 h-[calc(100vh-5.5rem)] flex gap-4 animate-fade-in">
      {/* Sidebar: Conversation List */}
      <div
        className={`${
          showSidebar || !selectedPartner ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-80 shrink-0 glass-panel rounded-2xl overflow-hidden border border-slate-200`}
      >
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-800">Зурвасууд & Яриа</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.length === 0 ? (
            <div className="p-6 text-xs text-slate-400 text-center space-y-2">
              <p>Одоогоор идэвхтэй яриа байхгүй байна.</p>
              <Link to="/explore" className="text-violet-600 font-bold hover:underline block pt-2">
                Найз хайх →
              </Link>
            </div>
          ) : (
            conversations.map((c) => {
              const partner = c.partner || { id: c.partner_id, full_name: c.partner_name, avatar: c.partner_avatar };
              const pid = partner.id;
              const isSelected = selectedPartner === pid;
              const online = isUserOnline(pid);

              return (
                <button
                  key={pid}
                  onClick={() => {
                    setSelectedPartner(pid);
                    setShowSidebar(false);
                    navigate(`/chat/${pid}`, { replace: true });
                  }}
                  className={`w-full flex items-center gap-3 p-3.5 transition-colors cursor-pointer text-left ${
                    isSelected ? 'bg-violet-50/90 border-l-3 border-violet-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={partner.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.full_name}`}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    {online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800 truncate">{partner.full_name}</p>
                      {c.last_message?.created_at && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {c.last_message?.content || partner.headline || 'Шинэ яриа эхлүүлэх...'}
                    </p>
                  </div>

                  {c.unread_count > 0 && (
                    <span className="px-2 py-0.5 bg-violet-600 text-white text-[10px] font-bold rounded-full">
                      {c.unread_count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area Panel */}
      <div
        className={`${
          !showSidebar || selectedPartner ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col glass-panel rounded-2xl overflow-hidden border border-slate-200`}
      >
        {selectedPartner && partnerInfo ? (
          <>
            {/* Top Chat Header */}
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="relative">
                  <img
                    src={partnerInfo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerInfo.full_name}`}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />
                  {isUserOnline(selectedPartner) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <Link
                    to={`/users/${partnerInfo.id || selectedPartner}`}
                    className="text-xs font-bold text-slate-800 hover:text-violet-600 flex items-center gap-1"
                  >
                    {partnerInfo.full_name}
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </Link>
                  <span
                    className={`text-[10px] font-medium block ${
                      isUserOnline(selectedPartner) ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {isUserOnline(selectedPartner) ? '● Одоо онлайн байна' : 'Оффлайн'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowVideo(true)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-violet-50 text-slate-600 hover:text-violet-700 transition-colors cursor-pointer"
                  title="1-on-1 Видео дуудлага"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-600">Яриа эхлээгүй байна</p>
                  <p>Эхний мэндчилгээгээ бичиж чадвар солилцоогоо эхлүүлээрэй! 👋</p>
                </div>
              ) : (
                messages.map(renderMessage)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setShowFiles(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 cursor-pointer transition-colors"
                title="Файл / Зураг илгээх"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowVoice(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 cursor-pointer transition-colors"
                title="Дуут зурвас илгээх"
              >
                <Mic className="w-4 h-4" />
              </button>

              <form onSubmit={handleSendText} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Зурвас бичих..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="p-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl disabled:opacity-40 cursor-pointer shadow-md transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400 p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center mx-auto text-xl">
              💬
            </div>
            <p className="font-semibold text-slate-700">Зурвас бичих хэрэглэгчээ сонгоно уу</p>
            <p>Зүүн талын жагсаалтаас сонгох эсвэл Explore хуудаснаас чадвар солилцох хүнээ сонгоно уу.</p>
          </div>
        )}
      </div>

      {/* Voice Recorder Modal */}
      {showVoice && (
        <VoiceRecorder
          onSend={async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'voice.webm');
            formData.append('media_type', 'audio');
            try {
              const res = await messagesAPI.uploadMedia(formData);
              handleMediaSent({
                ...res.data,
                msg_type: 'voice',
              });
            } catch (e) {
              console.error('Error uploading voice:', e);
            }
            setShowVoice(false);
          }}
          onClose={() => setShowVoice(false)}
        />
      )}

      {/* File Share Modal */}
      {showFiles && (
        <FileShareModal
          isOpen={showFiles}
          onFileSent={(mediaData) => {
            handleMediaSent(mediaData);
            setShowFiles(false);
          }}
          onClose={() => setShowFiles(false)}
        />
      )}

      {/* Video Call Modal */}
      {showVideo && (
        <VideoCallModal
          partner={partnerInfo || { id: selectedPartner, full_name: 'Swap Partner' }}
          isCaller={true}
          onClose={() => setShowVideo(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;
