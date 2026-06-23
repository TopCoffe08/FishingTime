import React from 'react';
import { CheckCircle2, Info, Droplets, Moon, Wind, Clock, Activity } from 'lucide-react';
import { AnalysisResult } from '../types';

interface FishingScoreCardProps {
  scoreRec: AnalysisResult | null;
  isAnalisaExpanded: boolean;
  setIsAnalisaExpanded: (val: boolean) => void;
}

export const FishingScoreCard: React.FC<FishingScoreCardProps> = ({ scoreRec, isAnalisaExpanded, setIsAnalisaExpanded }) => {
  if (!scoreRec) {
    return (
      <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center">
        <div className="relative z-10 w-full mb-2">
          <p className="text-[13px] sm:text-sm font-bold leading-relaxed text-white italic drop-shadow-md">
            Menyusun rekomendasi terbaik...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-teal-100 flex items-center gap-2">
          <CheckCircle2 size={16} /> Skor Memancing
      </h3>
      <div className="relative z-10 w-full">
        <div className="flex items-end justify-center gap-1 mb-2">
          <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter">{scoreRec.score}</span>
          <span className="text-lg font-bold text-teal-200 mb-2">/100</span>
        </div>
        <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-4 border border-white/20 shadow-inner">
          <span className="text-sm font-bold text-white">{scoreRec.category}</span>
        </div>
        <div className="text-sm leading-relaxed text-slate-200 bg-slate-900/60 p-5 sm:p-6 rounded-[2rem] text-left border border-teal-500/30 flex flex-col gap-3 transition-all mt-4 sm:mt-6 shadow-inner w-full backdrop-blur-sm">
          <div>
            <strong className="text-teal-300 block mb-2 text-xs uppercase tracking-widest font-black flex items-center gap-1.5"><Info size={16} /> Analisa Singkat</strong>
            <span className="text-slate-100 block mt-2 text-[14px] leading-[1.6]">{scoreRec.reason.charAt(0).toUpperCase() + scoreRec.reason.slice(1)}.</span>
          </div>
          
          {isAnalisaExpanded && (
            <div className="mt-2 pt-4 border-t border-slate-700/50 flex flex-col gap-5 text-slate-300 text-[14px] leading-[1.6]">
              <div className="grid gap-4">
                {scoreRec.factors.map((factor, idx) => (
                  <div key={idx} className="bg-slate-800/80 p-4 rounded-[1.5rem] border border-slate-700/50">
                    <strong className="text-white block mb-1 text-sm font-bold flex items-center gap-2">
                      {factor.icon === 'water' && <Droplets size={16} className="text-blue-400" />}
                      {factor.icon === 'moon' && <Moon size={16} className="text-purple-400" />}
                      {factor.icon === 'cloud' && <Wind size={16} className="text-slate-400" />}
                      {factor.icon === 'clock' && <Clock size={16} className="text-amber-400" />}
                      {factor.icon === 'history' && <Activity size={16} className="text-emerald-400" />}
                      {factor.title}
                    </strong>
                    <span className="text-slate-300 text-[13px] leading-relaxed block">{factor.description}</span>
                  </div>
                ))}
              </div>
              <div className="bg-teal-500/10 p-5 rounded-[1.5rem] border border-teal-500/30">
                <strong className="text-teal-400 block mb-2 text-xs uppercase tracking-widest font-black">Kesimpulan & Strategi</strong>
                <span className="text-teal-50/90 text-sm leading-relaxed block">{scoreRec.conclusion}</span>
              </div>
              <div className="text-[10px] text-slate-500 italic mt-2 flex flex-col gap-1">
                <span>Sumber Data Prediksi (Cuaca & Laut): {scoreRec.overview.dataSource}</span>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsAnalisaExpanded(!isAnalisaExpanded)}
            className="text-xs uppercase font-black tracking-widest text-slate-400 hover:text-teal-300 flex items-center justify-center p-3 mt-2 w-full bg-slate-800/80 rounded-xl transition-colors"
          >
            {isAnalisaExpanded ? 'Tutup Analisa' : 'Baca Analisa Penuh'}
          </button>
        </div>
      </div>
    </div>
  );
};
