import React from 'react';
import { Calendar, TrendingUp, Wind, Droplets } from 'lucide-react';
import { format } from 'date-fns';

interface FutureTideSummaryProps {
  futureTideSummary: any[];
}

export const FutureTideSummary: React.FC<FutureTideSummaryProps> = ({ futureTideSummary }) => {
  return (
    <div className="bg-slate-800/30 p-5 sm:p-6 md:p-8 rounded-[2.5rem] border border-slate-700/50 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400"><Calendar size={20} /></span>
          <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Prediksi 7 Hari Ke Depan</h3>
        </div>
        <div className="text-[10px] text-slate-400 italic bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700">Perencanaan Trip Jangka Panjang</div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar -mx-5 sm:mx-0 px-5 sm:px-0">
        <table className="w-full text-left min-w-[600px] border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="font-black uppercase tracking-widest text-[10px] text-slate-500 pb-2 border-b border-slate-700/50 w-[20%] pt-2 px-4 shadow-sm">Tanggal</th>
              <th className="font-black uppercase tracking-widest text-[10px] text-slate-500 pb-2 border-b border-slate-700/50 w-[25%] pt-2 px-4 shadow-sm">Arus Air</th>
              <th className="font-black uppercase tracking-widest text-[10px] text-slate-500 pb-2 border-b border-slate-700/50 w-[25%] pt-2 px-4 shadow-sm text-center">Pasang (Tertinggi)</th>
              <th className="font-black uppercase tracking-widest text-[10px] text-slate-500 pb-2 border-b border-slate-700/50 w-[25%] pt-2 px-4 shadow-sm text-center">Surut (Terendah)</th>
              <th className="font-black uppercase tracking-widest text-[10px] text-slate-500 pb-2 border-b border-slate-700/50 w-[5%] pt-2 px-4 shadow-sm text-center">Amp</th>
            </tr>
          </thead>
          <tbody>
            {futureTideSummary.length > 0 ? futureTideSummary.map((day, idx) => (
              <tr key={idx} className="bg-slate-800/40 hover:bg-slate-700/40 transition-colors group">
                <td className="py-4 px-4 whitespace-nowrap border border-slate-700/30 rounded-l-2xl border-r-0 group-hover:border-slate-600/50">
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block">{day.dateStr}</span>
                </td>
                <td className="py-4 px-4 border border-slate-700/30 border-x-0 group-hover:border-slate-600/50">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${day.warnaArus}`}>
                    {day.indikatorArus.includes('Kuat') && <TrendingUp size={12} className="-mt-0.5" />}
                    {day.indikatorArus.includes('Lemah') && <Wind size={12} className="-mt-0.5" />}
                    {day.indikatorArus.includes('Sedang') && <Droplets size={12} className="-mt-0.5" />}
                    {day.indikatorArus}
                  </span>
                </td>
                <td className="py-4 px-4 border border-slate-700/30 border-x-0 group-hover:border-slate-600/50 text-center">
                  <div className="flex flex-col items-center gap-1">
                    {day.highPoints.map((hp: any, i: number) => (
                      <span key={i} className="text-xs text-white font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{format(hp.time, 'HH:mm')} <span className="text-[10px] text-blue-400 font-normal">({hp.height.toFixed(2)}m)</span></span>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-4 border border-slate-700/30 border-x-0 group-hover:border-slate-600/50 text-center">
                  <div className="flex flex-col items-center gap-1">
                    {day.lowPoints.map((lp: any, i: number) => (
                      <span key={i} className="text-xs text-white font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{format(lp.time, 'HH:mm')} <span className="text-[10px] text-amber-400 font-normal">({lp.height.toFixed(2)}m)</span></span>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-4 border border-slate-700/30 rounded-r-2xl border-l-0 group-hover:border-slate-600/50 text-center text-xs font-black text-slate-400">
                  {(day.maxTide - day.minTide).toFixed(2)}m
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-sm italic border border-slate-700/50 rounded-2xl bg-slate-800/20">Data prediksi tidak tersedia</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
