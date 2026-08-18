import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, User, MapPin, Globe, Code2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, authAPI } from '../services/api';
import SkillBadge from '../components/SkillBadge';

const PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: 'Анхан' },
  { value: 'intermediate', label: 'Дунд' },
  { value: 'advanced', label: 'Ахисан' },
  { value: 'expert', label: 'Мэргэшсэн' },
];

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ full_name: '', headline: '', bio: '', location: '', timezone: '', github_url: '', portfolio_url: '' });
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsWanted, setSkillsWanted] = useState([]);
  const [newOffered, setNewOffered] = useState({ skill_name: '', proficiency_level: 'intermediate' });
  const [newWanted, setNewWanted] = useState({ skill_name: '', target_level: 'beginner' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '', headline: user.headline || '', bio: user.bio || '',
        location: user.location || '', timezone: user.timezone || '',
        github_url: user.github_url || '', portfolio_url: user.portfolio_url || ''
      });
      setSkillsOffered(user.skills_offered || []);
      setSkillsWanted(user.skills_wanted || []);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await usersAPI.updateProfile(form);
      const res = await authAPI.getMe();
      setUser(res.data);
      setMessage('Амжилттай хадгалагдлаа!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const addOfferedSkill = async () => {
    if (!newOffered.skill_name.trim()) return;
    try {
      await usersAPI.addSkillOffered(newOffered);
      const res = await authAPI.getMe();
      setUser(res.data);
      setSkillsOffered(res.data.skills_offered);
      setNewOffered({ skill_name: '', proficiency_level: 'intermediate' });
    } catch {}
  };

  const removeOfferedSkill = async (skillId) => {
    try {
      await usersAPI.removeSkillOffered(skillId);
      const res = await authAPI.getMe();
      setUser(res.data);
      setSkillsOffered(res.data.skills_offered);
    } catch {}
  };

  const addWantedSkill = async () => {
    if (!newWanted.skill_name.trim()) return;
    try {
      await usersAPI.addSkillWanted(newWanted);
      const res = await authAPI.getMe();
      setUser(res.data);
      setSkillsWanted(res.data.skills_wanted);
    } catch {}
  };

  const removeWantedSkill = async (skillId) => {
    try {
      await usersAPI.removeSkillWanted(skillId);
      const res = await authAPI.getMe();
      setUser(res.data);
      setSkillsWanted(res.data.skills_wanted);
    } catch {}
  };

  const inputClass = "w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <h1 className="text-xl font-bold text-slate-800">Миний Профайл</h1>

      {message && (
        <div className={`p-2.5 rounded-xl text-xs font-medium ${message.includes('Амжилт') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border border-red-500/20 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Profile Info */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-emerald-600" /> Ерөнхий мэдээлэл</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1"><label className="text-[11px] font-semibold text-slate-500">Нэр</label>
            <input type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} placeholder="Бүтэн нэр" className={inputClass} /></div>
          <div className="space-y-1"><label className="text-[11px] font-semibold text-slate-500">Гарчиг</label>
            <input type="text" value={form.headline} onChange={(e) => setForm({...form, headline: e.target.value})} placeholder="ж нь: Python хөгжүүлэгч" className={inputClass} /></div>
        </div>
        <div className="space-y-1"><label className="text-[11px] font-semibold text-slate-500">Танилцуулга</label>
          <textarea value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} placeholder="Өөрийнхөө тухай товч..." rows={3} className={inputClass + " resize-none"} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1"><label className="text-[11px] font-semibold text-slate-500">Байршил</label>
            <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="Улаанбаатар" className={inputClass} /></div>
          <div className="space-y-1"><label className="text-[11px] font-semibold text-slate-500">Цагийн бүс</label>
            <input type="text" value={form.timezone} onChange={(e) => setForm({...form, timezone: e.target.value})} placeholder="UTC+8" className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1"><label className="text-[11px] font-semibold text-slate-500">GitHub</label>
            <input type="url" value={form.github_url} onChange={(e) => setForm({...form, github_url: e.target.value})} placeholder="https://github.com/..." className={inputClass} /></div>
          <div className="space-y-1"><label className="text-[11px] font-semibold text-slate-500">Портфолио</label>
            <input type="url" value={form.portfolio_url} onChange={(e) => setForm({...form, portfolio_url: e.target.value})} placeholder="https://..." className={inputClass} /></div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>

      {/* Skills Offered */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-emerald-600">Заадаг чадварууд</h2>
        <div className="flex flex-wrap gap-1.5">
          {skillsOffered.map((s) => (
            <SkillBadge key={s.id} name={s.skill_name} type="offered" proficiency={s.proficiency_level} onDelete={() => removeOfferedSkill(s.id)} />
          ))}
          {skillsOffered.length === 0 && <span className="text-xs text-slate-500 italic">Чадвар нэмээгүй</span>}
        </div>
        <div className="flex items-center gap-2">
          <input type="text" value={newOffered.skill_name} onChange={(e) => setNewOffered({...newOffered, skill_name: e.target.value})}
            placeholder="Чадвар нэмэх..." className={inputClass + " flex-1"} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOfferedSkill())} />
          <select value={newOffered.proficiency_level} onChange={(e) => setNewOffered({...newOffered, proficiency_level: e.target.value})}
            className="bg-slate-100 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-600 focus:outline-none">
            {PROFICIENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={addOfferedSkill} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Skills Wanted */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-sky-600">Сурах хүсэлтэй чадварууд</h2>
        <div className="flex flex-wrap gap-1.5">
          {skillsWanted.map((s) => (
            <SkillBadge key={s.id} name={s.skill_name} type="wanted" proficiency={s.target_level} onDelete={() => removeWantedSkill(s.id)} />
          ))}
          {skillsWanted.length === 0 && <span className="text-xs text-slate-500 italic">Чадвар нэмээгүй</span>}
        </div>
        <div className="flex items-center gap-2">
          <input type="text" value={newWanted.skill_name} onChange={(e) => setNewWanted({...newWanted, skill_name: e.target.value})}
            placeholder="Сурах чадвар нэмэх..." className={inputClass + " flex-1"} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWantedSkill())} />
          <select value={newWanted.target_level} onChange={(e) => setNewWanted({...newWanted, target_level: e.target.value})}
            className="bg-slate-100 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-600 focus:outline-none">
            {PROFICIENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={addWantedSkill} className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-xl cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
