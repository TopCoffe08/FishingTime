import React from 'react';
import { Fish, Moon, Droplets, Thermometer, Wind, Compass } from 'lucide-react';
import { WeatherCondition } from '../types';

interface WeatherCardProps {
  weather: WeatherCondition;
  moonPhase: string;
  isOnline: boolean;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather, moonPhase, isOnline }) => {
  return (
    <div className="bg-slate-800/50 p-5 sm:p-6 md:p-8 rounded-[2.5rem] border border-slate-700">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <span className="text-teal-400"><Fish size={20} /></span>
          <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Quick Stats</h3>
        </div>
        <div className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="hidden min-[360px]:inline">{weather.dataSource === 'bmkg' ? 'BMKG Cuaca' : 'OpenMeteo Cuaca'}</span>
            <span className="min-[360px]:hidden">Live</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-slate-900/40 p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-slate-700 flex flex-col items-center justify-center text-center gap-1 sm:gap-2">
            <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center bg-amber-500/10 mb-1">
              <Moon className="text-amber-400 w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="w-full">
              <p className="text-[9px] sm:text-[11px] md:text-xs text-slate-500 font-black uppercase truncate mb-0.5 sm:mb-1">Fase Bulan</p>
              <p className="text-[11px] sm:text-sm md:text-base font-bold text-slate-200 leading-tight px-1">{moonPhase}</p>
            </div>
        </div>
        <div className="bg-slate-900/40 p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-slate-700 flex flex-col items-center justify-center text-center gap-1 sm:gap-2">
            <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center bg-blue-500/10 mb-1">
              <Droplets className="text-blue-400 w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="w-full">
              <p className="text-[9px] sm:text-[11px] md:text-xs text-slate-500 font-black uppercase truncate mb-0.5 sm:mb-1">Cuaca</p>
              <p className="text-[11px] sm:text-sm md:text-base font-bold text-slate-200 leading-tight px-1">{weather.description}</p>
            </div>
        </div>
        <div className="bg-slate-900/40 p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-slate-700 flex flex-col items-center justify-center text-center gap-1 sm:gap-2">
            <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center bg-orange-500/10 mb-1">
              <Thermometer className="text-orange-400 w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="w-full">
              <p className="text-[9px] sm:text-[11px] md:text-xs text-slate-500 font-black uppercase truncate mb-0.5 sm:mb-1">Suhu Cuaca</p>
              <p className="text-[11px] sm:text-sm md:text-base font-bold text-slate-200 leading-tight px-1">{weather.temperature}°C</p>
            </div>
        </div>
        <div className="bg-slate-900/40 p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-slate-700 flex flex-col items-center justify-center text-center gap-1 sm:gap-2">
            <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center bg-teal-500/10 mb-1">
              <Wind className="text-teal-400 w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="w-full flex flex-col items-center">
              <p className="text-[9px] sm:text-[11px] md:text-xs text-slate-500 font-black uppercase truncate mb-0.5 sm:mb-1">Angin</p>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[11px] sm:text-sm md:text-base font-bold text-slate-200 leading-tight">{weather.windSpeed} km/h</p>
                {weather.windDirectionLabel && (
                  <span className="text-[8px] sm:text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 mt-0.5">
                    <Compass size={10} className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ transform: `rotate(${weather.windDirectionDeg || 0}deg)` }} />
                    <span className="truncate max-w-[50px] sm:max-w-none">{weather.windDirectionLabel}</span>
                  </span>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};
