import React, { useState, useEffect } from 'react';
import { fetchTideAndWeather, fetchAIRecommendation } from './api';
import { PRESET_LOCATIONS, SPECIES_DB } from './data';
import { FishingLocation, TidePrediction, WeatherCondition, CatchRecord } from './types';
import { TideChart } from './components/TideChart';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MapPin, Droplets, Wind, Moon, Thermometer, Fish, Clock, Info, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';

export default function App() {
  const [location, setLocation] = useState<FishingLocation>(PRESET_LOCATIONS[0]);
  const [tide, setTide] = useState<TidePrediction | null>(null);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [moonPhase, setMoonPhase] = useState<string>('');
  const [aiRec, setAiRec] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'species' | 'log'>('dashboard');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { tide, weather, moonPhaseStr } = await fetchTideAndWeather(location.lat, location.lon);
        setTide(tide);
        setWeather(weather);
        setMoonPhase(moonPhaseStr);

        const rec = await fetchAIRecommendation({
          location: location.name,
          tideData: `${tide.status} (${tide.currentHeight}m)`,
          weatherData: `${weather.description}, ${weather.temperature}°C`,
          moonPhase: moonPhaseStr,
          timeOfDay: format(new Date(), 'HH:mm')
        });
        setAiRec(rec);

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [location]);

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 pb-20 md:pb-0 font-sans flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto p-4 md:p-6 sticky top-0 z-10">
        <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-3xl border border-slate-700/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Droplets className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white">FISHING TIDE <span className="text-teal-400">INTEL</span></h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-widest hidden sm:block">Digital Angler Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{location.name}</p>
              <p className="text-xs text-slate-400">{location.type}</p>
            </div>
            {weather && (
              <div className="bg-slate-900/80 p-2 px-3 sm:px-4 rounded-2xl border border-slate-700 flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-bold tracking-tight text-emerald-400">{weather.temperature}°C</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto p-4 md:px-6 space-y-6 flex-1">
        {/* Tab Navigation */}
        <nav className="flex justify-center mb-6">
          <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 p-2 rounded-[2.5rem] flex gap-1 sm:gap-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 sm:px-8 py-2 font-bold text-sm rounded-[1.5rem] transition-colors ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-lg shadow-white/10 flex items-center gap-2' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="hidden sm:inline">Home</span>
              <span className="sm:hidden">Dash</span>
            </button>
            <button 
              onClick={() => setActiveTab('species')}
              className={`px-4 sm:px-8 py-2 font-bold text-sm rounded-[1.5rem] transition-colors ${activeTab === 'species' ? 'bg-white text-slate-900 shadow-lg shadow-white/10 flex items-center gap-2' : 'text-slate-400 hover:text-white'}`}
            >
              Spesies
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className={`px-4 sm:px-8 py-2 font-bold text-sm rounded-[1.5rem] transition-colors ${activeTab === 'log' ? 'bg-white text-slate-900 shadow-lg shadow-white/10 flex items-center gap-2' : 'text-slate-400 hover:text-white'}`}
            >
              Catatan
            </button>
          </div>
        </nav>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
            {/* LEFT COLUMN */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
              {/* Location Selector styled as quick select block */}
              <div className="bg-slate-800/50 p-5 rounded-[2rem] border border-slate-700">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Lokasi Memancing</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-900/60 border border-slate-700/50 text-slate-100 text-sm font-bold rounded-2xl focus:ring-teal-500 focus:border-teal-500 block p-3.5 appearance-none outline-none"
                    value={location.name}
                    onChange={(e) => {
                      const loc = PRESET_LOCATIONS.find(l => l.name === e.target.value);
                      if(loc) setLocation(loc);
                    }}
                  >
                    {PRESET_LOCATIONS.map(loc => (
                      <option key={loc.name} value={loc.name} className="bg-slate-800">{loc.name} ({loc.type})</option>
                    ))}
                  </select>
                  <MapPin className="text-teal-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} />
                </div>
              </div>

              {isLoading ? (
                <div className="bg-slate-800/30 rounded-[2.5rem] border border-slate-700/50 p-6 flex flex-col flex-1 items-center justify-center text-teal-500/50 min-h-[300px]">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mb-4"></div>
                  <p className="font-bold tracking-tight text-sm">Menganalisa kondisi...</p>
                </div>
              ) : tide && weather ? (
                <>
                  <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-teal-100 flex items-center gap-2">
                       <CheckCircle2 size={16} /> AI Asisten
                    </h3>
                    <div className="relative z-10 w-full mb-2">
                      <p className="text-[13px] sm:text-sm font-bold leading-relaxed text-white italic drop-shadow-md">
                        "{aiRec || "Menyusun rekomendasi terbaik..."}"
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-5 rounded-[2rem] border border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-teal-400"><Fish size={18} /></span>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Quick Stats</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-700 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                           <Moon className="text-amber-400" size={16} />
                         </div>
                         <div>
                           <p className="text-[10px] text-slate-500 font-black uppercase">Fase Bulan</p>
                           <p className="text-xs font-bold text-slate-200 mt-0.5">{moonPhase}</p>
                         </div>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-700 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                           <Wind className="text-blue-400" size={16} />
                         </div>
                         <div>
                           <p className="text-[10px] text-slate-500 font-black uppercase">Angin & Cuaca</p>
                           <p className="text-xs font-bold text-slate-200 mt-0.5">{weather.description}</p>
                         </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* RIGHT COLUMN (TIDE) */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6">
               {isLoading ? (
                 <div className="flex-1 min-h-[300px]"></div>
               ) : tide ? (
                 <>
                  {/* Tide Chart block styled exactly like the center column in HTML */}
                  <div className="bg-slate-800/30 rounded-[2.5rem] border border-slate-700/50 p-6 flex flex-col flex-1 min-h-[400px]">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">{tide.currentHeight.toFixed(2)}<span className="text-lg text-slate-500 ml-1 font-normal">meters</span></h2>
                        <p className="text-sm text-teal-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-1 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">
                          <Droplets className="w-4 h-4" />
                          {tide.status} Sekarang
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-black">Pasang</p>
                          <p className="font-bold text-sm text-white">
                            {tide.nextHighTide ? format(tide.nextHighTide, 'HH:mm') : '-'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-black">Surut</p>
                          <p className="font-bold text-sm text-white">
                            {tide.nextLowTide ? format(tide.nextLowTide, 'HH:mm') : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 w-full relative">
                      <TideChart data={tide.hourlyData} currentTime={new Date()} />
                    </div>
                  </div>
                  
                  {/* Quick visual stats beneath chart if needed */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-slate-800/40 p-4 rounded-3xl border border-slate-700/50 flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-500 font-black mb-1 tracking-widest">WAKTU</p>
                        <p className="text-sm font-bold text-slate-200">{format(new Date(), 'HH:mm')}</p>
                     </div>
                     <div className="bg-slate-800/40 p-4 rounded-3xl border border-slate-700/50 flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-500 font-black mb-1 tracking-widest">KONDISI</p>
                        <p className="text-sm font-bold text-amber-400 uppercase">{weather?.description || 'Stabil'}</p>
                     </div>
                     <div className="bg-slate-800/40 p-4 rounded-3xl border border-slate-700/50 flex flex-col items-center justify-center md:col-span-2 hidden md:flex">
                        <button className="w-full h-full text-xs font-black text-teal-400 uppercase tracking-widest hover:text-teal-300 transition-colors flex items-center justify-center gap-2">
                          <Clock size={16} /> Update Real-Time
                        </button>
                     </div>
                  </div>
                 </>
               ) : null}
            </div>
          </div>
        )}

        {activeTab === 'species' && (
          <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
            <div className="bg-slate-800/30 p-6 rounded-[2.5rem] border border-slate-700/50">
              <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">Database Spesies ({location.type})</h2>
              <div className="grid gap-4">
                {SPECIES_DB.filter(s => s.habitat.includes(location.type)).map(s => (
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
                {SPECIES_DB.filter(s => s.habitat.includes(location.type)).length === 0 && (
                  <div className="text-slate-500 py-12 text-center bg-slate-900/40 rounded-3xl border border-slate-700 border-dashed">
                    <p className="font-bold text-sm uppercase tracking-widest">Tidak ada data spesies</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'log' && (
          <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mt-8">
            <div className="bg-slate-800/30 px-6 py-16 rounded-[3rem] border border-slate-700/50 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl border border-slate-700 transform rotate-3">
                <BookOpen className="text-teal-500 opacity-80" size={48} />
              </div>
              <h2 className="text-xl font-black text-white mb-3">Buku Catatan Tangkapan</h2>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed font-medium">Catat hasil tangkapan Anda untuk membantu AI mempelajari pola perairan di lokasi favorit Anda.</p>
              <button className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-black py-4 px-8 rounded-3xl shadow-xl shadow-teal-500/20 uppercase tracking-[0.2em] text-xs transition-colors flex items-center gap-2">
                Tambah Catatan Baru
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

