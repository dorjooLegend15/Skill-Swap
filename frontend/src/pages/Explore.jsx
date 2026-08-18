import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Users } from 'lucide-react';
import { matchesAPI } from '../services/api';
import UserCard from '../components/UserCard';
import MatchRequestModal from '../components/MatchRequestModal';

const CATEGORIES = [
  'Бүгд',
  'Програмчлал & IT',
  'Хиймэл оюун & Дата',
  'Гадаад хэл',
  'Шинжлэх ухаан & Хичээл',
  'Хөгжим & Аудио',
  'Дизайн & Бүтээлч',
  'Бизнес & Маркетинг',
  'Эрүүл мэнд & Спорт',
];

const Explore = () => {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'Бүгд');
  const [teachSkill, setTeachSkill] = useState(searchParams.get('teach_skill') || '');
  const [learnSkill, setLearnSkill] = useState(searchParams.get('learn_skill') || '');
  const [selectedUserForSwap, setSelectedUserForSwap] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, [selectedCategory]);

  const fetchMatches = async (overrideParams = {}) => {
    setLoading(true);
    try {
      const params = {
        category: selectedCategory === 'Бүгд' ? undefined : selectedCategory,
        q: searchQuery || undefined,
        teach_skill: teachSkill || undefined,
        learn_skill: learnSkill || undefined,
        ...overrideParams,
      };

      const res = await matchesAPI.explore(params);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMatches();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 stagger-children">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Хайх & Тохирох хүмүүс</h1>
          <p className="text-xs text-slate-500">Өөрийн заах болон сурах чадвараар тохирох хүмүүсээ олоорой</p>
        </div>
      </div>

      {/* Minimal Search & Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Нэр эсвэл түлхүүр үг..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Заадаг чадвар (ж нь: Python)..."
              value={teachSkill}
              onChange={(e) => setTeachSkill(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-violet-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Сурмаар байгаа чадвар..."
              value={learnSkill}
              onChange={(e) => setLearnSkill(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-sky-700 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
            >
              Хайх
            </button>
          </div>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white font-bold border border-violet-700 shadow-sm'
                  : 'bg-white/80 hover:bg-violet-50 text-slate-500 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div>
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            Хайж байна...
          </div>
        ) : users.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {users.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                onRequestSwap={(target) => setSelectedUserForSwap(target)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-slate-500 glass-panel rounded-2xl">
            Тохирох хэрэглэгч олдсонгүй. Хайлтын үгээ өөрчлөөд үзнэ үү.
          </div>
        )}
      </div>

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
  );
};

export default Explore;
