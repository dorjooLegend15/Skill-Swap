import React from 'react';

const PROFICIENCY_LABELS = {
  beginner: 'Анхан',
  intermediate: 'Дунд',
  advanced: 'Ахисан',
  expert: 'Мэргэшсэн',
};

const SkillBadge = ({
  name,
  type = 'offered',
  proficiency = 'intermediate',
  showProficiency = true,
  size = 'md',
  onDelete = null,
}) => {
  const isOffered = type === 'offered';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-xs px-3 py-1.5',
  };

  const levelText = PROFICIENCY_LABELS[proficiency?.toLowerCase()] || proficiency;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl font-medium transition-transform hover:scale-110 hover:animate-wiggle ${
        isOffered
          ? 'bg-violet-100 text-violet-700 border border-violet-200'
          : 'bg-sky-100 text-sky-700 border border-sky-200'
      } ${sizeClasses[size] || sizeClasses.md}`}
    >
      <span>{name}</span>

      {showProficiency && levelText && (
        <span className="text-[10px] text-slate-500 opacity-80">
          • {levelText}
        </span>
      )}

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-1 hover:text-red-400 transition-colors cursor-pointer text-slate-400"
          title="Хасах"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SkillBadge;
