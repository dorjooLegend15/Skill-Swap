import React, { useState } from 'react';
import { Calendar, Star, Clock } from 'lucide-react';
import { sessionsAPI } from '../services/api';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ sessionId: null, rating: 5, comment: '' });

  useState(() => {
    setLoading(true);
    sessionsAPI.getSessions()
      .then((res) => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submitReview = async () => {
    if (!reviewForm.sessionId) return;
    try {
      await sessionsAPI.submitReview({
        session_id: reviewForm.sessionId,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      setReviewForm({ sessionId: null, rating: 5, comment: '' });
      const res = await sessionsAPI.getSessions();
      setSessions(res.data);
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Хичээлийн хуваарь</h1>
        <p className="text-xs text-slate-500">Төлөвлөсөн 1-on-1 хичээлүүд болон үнэлгээ</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-slate-500">Ачааллаж байна...</div>
      ) : sessions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <p className="text-xs text-slate-500">Одоогоор төлөвлөсөн хичээл байхгүй.</p>
          <p className="text-[11px] text-slate-500 mt-1">Найзуудтайгаа холбогдоод хичээл товлоорой!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="glass-panel rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-800">{s.skill_name || 'Хичээл'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  s.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                  s.status === 'scheduled' ? 'bg-sky-50 text-sky-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {s.status === 'completed' ? 'Дууссан' : s.status === 'scheduled' ? 'Товлосон' : s.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration_minutes || 60} мин</span>
                {s.scheduled_at && <span>{new Date(s.scheduled_at).toLocaleDateString('mn-MN')}</span>}
              </div>

              {s.status === 'completed' && !s.reviewed && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <p className="text-[11px] text-slate-500 font-semibold">Үнэлгээ өгөх:</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <button key={n} onClick={() => setReviewForm({...reviewForm, sessionId: s.id, rating: n})}
                        className={`cursor-pointer ${(reviewForm.sessionId === s.id ? reviewForm.rating : 0) >= n ? 'text-amber-400' : 'text-slate-400'}`}>
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                  {reviewForm.sessionId === s.id && (
                    <div className="flex gap-2">
                      <input type="text" value={reviewForm.comment} onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                        placeholder="Сэтгэгдэл бичих..." className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-violet-400" />
                      <button onClick={submitReview} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl cursor-pointer">Илгээх</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
