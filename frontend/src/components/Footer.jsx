import React from "react";
import { ArrowRightLeft } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-indigo-100/70 mt-auto bg-white/50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ArrowRightLeft className="w-3 h-3 text-violet-500" />
          <span>
            Skill
            <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent font-semibold">
              Swap
            </span>{" "}
            © {new Date().getFullYear()}
          </span>
        </div>
        <span className="text-[10px] text-slate-400">Skill Swap платформ</span>
      </div>
    </footer>
  );
};

export default Footer;
