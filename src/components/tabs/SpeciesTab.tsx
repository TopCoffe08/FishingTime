import React from 'react';
import { motion } from 'motion/react';
import { Fish, Droplets, Info, CheckCircle2 } from 'lucide-react';
import { FishingLocation, SpeciesInfo } from '../../types';

interface SpeciesTabProps {
  location: FishingLocation;
  recommendedSpecies: SpeciesInfo[];
}

export const SpeciesTab: React.FC<SpeciesTabProps> = ({ location, recommendedSpecies }) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      <div className="bg-slate-800/80 p-5 md:p-6 rounded-[2rem] border border-slate-700 shadow-xl overflow-hidden relative mb-2">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Katalog Umpan & Ikan Target</h2>
        <p className="text-sm font-medium text-slate-400">Menyesuaikan kondisi dan ekosistem di: <strong className="text-teal-400">{location.name}</strong></p>
      </div>

      {/* Karakteristik Lokasi */}
      {(location.targets || location.conditions || location.bait) && (
        <div className="bg-slate-900/80 p-5 md:p-6 rounded-[2.5rem] border border-slate-700/50 text-left">
          <h4 className="text-sm md:text-md font-black text-white uppercase tracking-wider mb-5 border-b border-white/10 pb-3 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-teal-400"/>
            Karakteristik Spesifik Area Ini
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {location.targets && (
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Fish size={14} className="text-amber-400"/> Target Utama</span>
                <span className="text-sm text-slate-200 leading-relaxed block font-medium">{location.targets}</span>
              </div>
            )}
            {location.conditions && (
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Droplets size={14} className="text-blue-400"/> Kondisi Ideal</span>
                <span className="text-sm text-slate-200 leading-relaxed block font-medium">{location.conditions}</span>
              </div>
            )}
            {location.bait && (
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Info size={14} className="text-rose-400"/> Rekomendasi Umum</span>
                <span className="text-sm text-slate-200 leading-relaxed block font-medium">{location.bait}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-800/30 p-6 rounded-[2.5rem] border border-slate-700/50">
        <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">Database Spesies di Lokasi Ini</h2>
        <div className="grid gap-4">
          {recommendedSpecies.map(s => (
            <div key={s.id} className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700 flex flex-col md:flex-row gap-4 md:items-center">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 bg-teal-500/20 rounded-2xl flex items-center justify-center text-3xl font-bold border border-teal-500/30">
                  {s.imageFallback}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{s.name}</h3>
                  <span className="text-[10px] uppercase font-black px-2 py-1 bg-slate-900/60 text-teal-400 rounded-lg tracking-widest inline-block mt-1">{s.type}</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-black block mb-1">KONDISI</span>
                  <span className="font-bold text-slate-200">{s.activePhase.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-black block mb-1">UMPAN</span>
                  <span className="font-bold text-amber-400">{s.bait}</span>
                  </div>
              </div>
            </div>
          ))}
          {recommendedSpecies.length === 0 && (
            <div className="text-slate-500 py-12 text-center bg-slate-900/40 rounded-3xl border border-slate-700 border-dashed">
              <p className="font-bold text-sm uppercase tracking-widest">Tidak ada data spesies</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
