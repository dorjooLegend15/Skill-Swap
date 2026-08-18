import React from 'react';

/**
 * FloatingSkillIcons
 * A constellation of drifting, orbiting skill icons placed behind the hero
 * to visually invite learners (pure decoration, pointer-events-none).
 */
const FloatingSkillIcons = () => {
  // Each node: icon, position, size, animation config
  const nodes = [
    { icon: '💻', size: 28, top: '8%', left: '7%', delay: 0, orbit: 18 },
    { icon: '📚', size: 32, top: '15%', left: '90%', delay: 2.5, orbit: 22 },
    { icon: '🎨', size: 26, top: '78%', left: '10%', delay: 1.2, orbit: 20 },
    { icon: '🌍', size: 30, top: '84%', left: '88%', delay: 4, orbit: 24 },
    { icon: '🎵', size: 24, top: '45%', left: '4%', delay: 0.8, orbit: 19 },
    { icon: '🧠', size: 28, top: '40%', left: '92%', delay: 3.2, orbit: 21 },
    { icon: '⚡', size: 22, top: '30%', left: '45%', delay: 1.8, orbit: 17 },
    { icon: '✨', size: 20, top: '60%', left: '50%', delay: 5, orbit: 23 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {nodes.map((node, idx) => (
        <div
          key={idx}
          className="absolute select-none"
          style={{
            top: node.top,
            left: node.left,
            fontSize: `${node.size}px`,
            animationDelay: `${node.delay}s`,
            animationDuration: `${node.orbit}s`,
          }}
        >
          <span
            className="inline-block animate-drift-float drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
            style={{ animationDelay: `${node.delay}s` }}
          >
            {node.icon}
          </span>
        </div>
      ))}

      {/* Two slow spinning orbital rings for extra motion (subtle) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-violet-300/25 animate-spin-slow"
        style={{ animationDuration: '45s' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full border border-sky-300/20 animate-spin-slow"
        style={{ animationDuration: '35s', animationDirection: 'reverse' }}
      />
    </div>
  );
};

export default FloatingSkillIcons;
