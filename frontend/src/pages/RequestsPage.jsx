import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, UserX, Clock, MessageSquare, Users, X, Check, ArrowRightLeft } from 'lucide-react';
import { requestsAPI, usersAPI } from '../services/api';

const TABS = [
  { key: 'incoming', label: 'Ирсэн хүсэлтүүд', icon: UserCheck },
  { key: 'outgoing', label: 'Илгээсэн', icon: Clock },
  { key: 'friends', label: 'Найзууд', icon: Users },
];

const RequestsPage = () => {
  const [activeTab, setActiveTab] = useState('incoming');
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incRes, outRes, frRes] = await Promise.all([
        requestsAPI.getIncoming().catch(() => ({ data: [] })),
        requestsAPI.getOutgoing().catch(() => ({ data: [] })),
        usersAPI.getFriends().catch(() => ({ data: [] })),
      ]);
      setIncoming(incRes.data || []);
      setOutgoing(outRes.data || []);
      setFriends(frRes.data || []);
    } catch (err) {
      console.error('Error fetching requests data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id, action) => {
    setActionLoading(id);
    try {
      await requestsAPI.respond(id, action);
      await fetchData();
    } catch (err) {
      console.error('Error responding to request:', err);
      alert('Хүсэлтийг шийдвэрлэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    setActionLoading(id);
    try {
      await requestsAPI.cancel(id);
      await fetchData();
    } catch (err) {
      console.error('Error cancelling request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const renderIncoming = () => (
    <div className="space-y-3">
      {incoming.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-500 glass-panel rounded-2xl">
          Танд одоогоор ирсэн чадвар солилцох хүсэлт байхгүй байна.
        </div>
      ) : (
        incoming.map((req) => {
          const sender = req.sender || { id: req.sender_id, full_name: 'Хэрэглэгч' };
          return (
            <div
              key={req.id}
              className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.full_name}`}
                  alt={sender.full_name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <Link
                    to={`/users/${sender.id}`}
                    className="font-bold text-sm text-slate-800 hover:text-violet-600 transition-colors"
                  >
                    {sender.full_name}
                  </Link>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                      Тэр заана: {req.offered_skill_name}
                    </span>
                    <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                      Тэр сурна: {req.wanted_skill_name}
                    </span>
                  </div>
                  {req.message && (
                    <p className="text-[11px] text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{req.message}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleRespond(req.id, 'accept')}
                  disabled={actionLoading === req.id}
                  className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 transition-all"
                >
                  <Check className="w-3.5 h-3.5" /> {actionLoading === req.id ? 'Түр хүлээнэ үү...' : 'Зөвшөөрөх'}
                </button>
                <button
                  onClick={() => handleRespond(req.id, 'decline')}
                  disabled={actionLoading === req.id}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-200 disabled:opacity-50 transition-all"
                >
                  <X className="w-3.5 h-3.5" /> Татгалзах
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderOutgoing = () => (
    <div className="space-y-3">
      {outgoing.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-500 glass-panel rounded-2xl">
          Та одоогоор хэнд ч санал илгээгээгүй байна. Explore хуудаснаас хүмүүс олж санал илгээгээрэй!
        </div>
      ) : (
        outgoing.map((req) => {
          const receiver = req.receiver || { id: req.receiver_id, full_name: 'Хэрэглэгч' };
          return (
            <div
              key={req.id}
              className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={receiver.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${receiver.full_name}`}
                  alt={receiver.full_name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <Link
                    to={`/users/${receiver.id}`}
                    className="font-bold text-sm text-slate-800 hover:text-violet-600 transition-colors"
                  >
                    {receiver.full_name}
                  </Link>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                      Би заана: {req.offered_skill_name}
                    </span>
                    <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                      Би сурна: {req.wanted_skill_name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold mt-1 inline-block px-2 py-0.5 rounded-full ${
                    req.status === 'accepted'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : req.status === 'declined'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {req.status === 'accepted' ? '✅ Зөвшөөрсөн' : req.status === 'declined' ? '❌ Татгалзсан' : '⏳ Хүлээгдэж байна'}
                  </span>
                </div>
              </div>

              {req.status === 'pending' && (
                <button
                  onClick={() => handleCancel(req.id)}
                  disabled={actionLoading === req.id}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-semibold text-xs rounded-xl cursor-pointer border border-slate-200 self-end sm:self-center transition-colors"
                >
                  Цуцлах
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderFriends = () => (
    <div className="space-y-3">
      {friends.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-500 glass-panel rounded-2xl">
          Холбогдсон найз одоогоор байхгүй байна. Санал илгээж эсвэл ирсэн хүсэлтийг зөвшөөрч найз болоорой!
        </div>
      ) : (
        friends.map((friend) => (
          <div
            key={friend.id}
            className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-3 animate-fade-in"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.full_name}`}
                alt={friend.full_name}
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <Link
                  to={`/users/${friend.id}`}
                  className="font-bold text-sm text-slate-800 hover:text-violet-600 transition-colors"
                >
                  {friend.full_name}
                </Link>
                <p className="text-[11px] text-slate-500 truncate">{friend.headline || 'SkillSwap талбарын найз'}</p>
              </div>
            </div>
            <Link
              to={`/chat/${friend.id}`}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Зурвас бичих
            </Link>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-slate-800">Хүсэлтүүд & Найзууд</h1>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count =
            tab.key === 'incoming'
              ? incoming.length
              : tab.key === 'outgoing'
              ? outgoing.length
              : friends.length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-violet-700 hover:bg-violet-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-slate-500">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Ачааллаж байна...
        </div>
      ) : (
        <>
          {activeTab === 'incoming' && renderIncoming()}
          {activeTab === 'outgoing' && renderOutgoing()}
          {activeTab === 'friends' && renderFriends()}
        </>
      )}
    </div>
  );
};

export default RequestsPage;
