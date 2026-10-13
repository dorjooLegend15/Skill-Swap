import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, RotateCcw, Sparkles } from 'lucide-react';
import { matchesAPI } from '../services/api';

const AGE_OPTIONS = [13, 14, 15, 16, 17, 18];

const STEPS = [
  {
    title: 'Таны сонирхол',
    description: 'Нас болон сонирхлын чиглэлээ сонгоно уу.',
    fields: [
      { name: 'age', label: 'Нас', optionsKey: 'age' },
      { name: 'interest', label: 'Та юунд илүү сонирхолтой вэ?', optionsKey: 'interest' },
    ],
  },
  {
    title: 'Таны чадвар',
    description: 'Бусдад зааж болох чадвар, түвшнээ тэмдэглээрэй.',
    fields: [
      { name: 'main_skill', label: 'Таны үндсэн чадвар', optionsKey: 'main_skill' },
      { name: 'second_skill', label: 'Хоёрдогч чадвар', optionsKey: 'second_skill' },
      { name: 'skill_level', label: 'Үндсэн чадварын түвшин', optionsKey: 'skill_level' },
    ],
  },
  {
    title: 'Таны сурах зорилго',
    description: 'Ямар чадвараа, ямар түвшинд хүргэхийг хүсэж байна вэ?',
    fields: [
      { name: 'want_to_learn', label: 'Сурахыг хүсэж буй чадвар', optionsKey: 'want_to_learn' },
      { name: 'target_level', label: 'Хүрэхийг хүсэж буй түвшин', optionsKey: 'target_level' },
      { name: 'goal', label: 'Энэ чадварыг юунд ашиглах вэ?', optionsKey: 'goal' },
    ],
  },
  {
    title: 'Танд тохирох сурах арга',
    description: 'Таны хэв маягтай ойролцоо хариултуудтай survey оролцогчдын сонголтоор үр дүнг эрэмбэлнэ.',
    fields: [
      { name: 'learning_style', label: 'Та яаж сурахыг илүүд үздэг вэ?', optionsKey: 'learning_style' },
      { name: 'availability', label: 'Хэзээ суралцах боломжтой вэ?', optionsKey: 'availability' },
      { name: 'preferred_partner_level', label: 'Хамтрагчийн ямар түвшнийг илүүд үзэх вэ?', optionsKey: 'preferred_partner_level' },
    ],
  },
];

const REQUIRED_FIELDS = new Set([
  'age',
  'interest',
  'main_skill',
  'skill_level',
  'want_to_learn',
  'target_level',
  'goal',
  'learning_style',
  'availability',
  'preferred_partner_level',
]);

const emptyForm = {
  age: '',
  main_skill: '',
  second_skill: 'Байхгүй',
  skill_level: '',
  want_to_learn: '',
  target_level: '',
  interest: '',
  goal: '',
  learning_style: '',
  availability: '',
  preferred_partner_level: '',
};

function OptionField({ field, values, value, onChange }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{field.label}</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(field.name, event.target.value)}
        required={REQUIRED_FIELDS.has(field.name)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
      >
        {!REQUIRED_FIELDS.has(field.name) && <option value="">Сонголт хийхгүй</option>}
        {REQUIRED_FIELDS.has(field.name) && <option value="" disabled>Сонгоно уу</option>}
        {(values || []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function RecommendationCard({ item, index }) {
  return (
    <article className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-800">{item.skill_name}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Таны хариултад тулгуурласан зөвлөмж
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
          {Math.round(item.match_score)} оноо
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`Эрэмбийн оноо ${Math.round(item.match_score)} / 100`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all duration-700"
          style={{ width: `${Math.max(3, Math.min(100, item.match_score))}%` }}
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Яагаад санал болгож байна вэ?</p>
        <ul className="space-y-2">
          {item.reasons.map((reason) => (
            <li key={reason} className="flex gap-2 text-sm leading-relaxed text-slate-600">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

    </article>
  );
}

export default function SkillRecommendations() {
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentStep = STEPS[stepIndex];
  const progress = useMemo(() => ((stepIndex + 1) / STEPS.length) * 100, [stepIndex]);

  useEffect(() => {
    let active = true;
    matchesAPI.getSurveyOptions()
      .then((response) => {
        if (active) setOptions(response.data);
      })
      .catch(() => {
        if (active) setError('Судалгааны сонголтыг ачаалж чадсангүй. Дахин оролдоно уу.');
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });
    return () => { active = false; };
  }, []);

  const updateAnswer = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
  };

  const continueQuiz = () => {
    const missing = currentStep.fields.find(
      (field) => REQUIRED_FIELDS.has(field.name) && !form[field.name],
    );
    if (missing) {
      setError('Үргэлжлүүлэхийн өмнө бүх шаардлагатай асуултад хариулна уу.');
      return;
    }
    setError('');
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  };

  const submitAnswers = async () => {
    const missing = currentStep.fields.find(
      (field) => REQUIRED_FIELDS.has(field.name) && !form[field.name],
    );
    if (missing) {
      setError('Үр дүн гаргахын өмнө бүх шаардлагатай асуултад хариулна уу.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await matchesAPI.getSkillRecommendations({
        ...form,
        age: Number(form.age),
      });
      setResults(response.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Санал зөвлөмж гаргаж чадсангүй. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setResults(null);
    setForm(emptyForm);
    setStepIndex(0);
    setError('');
  };

  if (loadingOptions) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
          <p className="text-sm font-medium text-slate-600">Survey сонголтуудыг ачаалж байна...</p>
        </div>
      </main>
    );
  }

  if (!options) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white">
            Дахин ачаалах
          </button>
        </div>
      </main>
    );
  }

  if (results) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              {results.dataset_source === 'synthetic_demo'
                ? 'Синтетик демо өгөгдөл — бодит сурагчийн мэдээлэл агуулаагүй'
                : 'Нууц runtime судалгааны өгөгдлөөр эрэмбэлэв'}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">Танд санал болгох чадварууд</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Таны сонголт болон ижил хариулттай оролцогчдын сурах хүсэлд тулгуурлан эрэмбэлэв.
            </p>
          </div>
          <button onClick={resetQuiz} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-violet-200 hover:text-violet-700">
            <RotateCcw className="h-4 w-4" />
            Хариултаа шинэчлэх
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-sm leading-relaxed text-sky-900">
          <div className="flex gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
            <p>{results.scoring_note} Жагсаалт зөвхөн survey-д байгаа чадварын нэрсийг ашиглана; мэргэжлийн үнэлгээ биш.</p>
          </div>
        </div>

        {results.recommendations.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {results.recommendations.map((item, index) => (
              <RecommendationCard
                key={item.skill_name}
                item={item}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-10 text-center text-slate-600">
            Таны хариултад тохирох чадвар олдсонгүй. Сонголтоо өөрчлөөд дахин оролдоорой.
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
          <Sparkles className="h-3.5 w-3.5" />
          {options.dataset_source === 'synthetic_demo'
            ? 'Синтетик демо өгөгдөл — бодит сурагчийн мэдээлэл агуулаагүй'
            : 'Нууц runtime судалгааны өгөгдөл'}
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">Танд тохирох чадвараа олоорой</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Хариултуудыг судалгааны хэв маягтай харьцуулж, сонголт бүрийн шалтгааныг тайлбарлана.
        </p>
      </div>

      <section className="glass-panel rounded-3xl p-5 sm:p-8">
        <div className="mb-7">
          <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Алхам {stepIndex + 1} / {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">SkillSwap асуулга</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">{currentStep.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{currentStep.description}</p>
        </div>

        <div className="grid gap-5">
          {currentStep.fields.map((field) => (
            <OptionField
              key={field.name}
              field={field}
              values={field.name === 'age' ? AGE_OPTIONS : options.fields[field.optionsKey]}
              value={form[field.name]}
              onChange={updateAnswer}
            />
          ))}
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => { setError(''); setStepIndex((index) => Math.max(index - 1, 0)); }}
            disabled={stepIndex === 0 || submitting}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Буцах
          </button>

          {stepIndex < STEPS.length - 1 ? (
            <button type="button" onClick={continueQuiz} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700">
              Үргэлжлүүлэх
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={submitAnswers} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">
              {submitting ? 'Хариултыг боловсруулж байна...' : 'Миний зөвлөмжийг харах'}
              {!submitting && <Sparkles className="h-4 w-4" />}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}