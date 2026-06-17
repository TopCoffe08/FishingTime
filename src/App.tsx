import React, { useState, useEffect } from 'react';
import { fetchTideAndWeather, fetchAIRecommendation } from './api';
import { PRESET_LOCATIONS, SPECIES_DB } from './data';
import { FishingLocation, TidePrediction, WeatherCondition, CatchRecord } from './types';
import { TideChart } from './components/TideChart';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { MapPin, Droplets, Wind, Moon, Thermometer, Fish, Clock, Info, CheckCircle2, ChevronRight, BookOpen, Plus, Save, X } from 'lucide-react';

export default function App() {
  const [location, setLocation] = useState<FishingLocation>(PRESET_LOCATIONS[0]);
  const [tide, setTide] = useState<TidePrediction | null>(null);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [moonPhase, setMoonPhase] = useState<string>('');
  const [aiRec, setAiRec] = useState<{score: number, category: string, reason: string, simpleRec: string, verboseRec: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'species' | 'log'>('dashboard');

  const [logs, setLogs] = useState<Array<{id: string, notes: string, date: string, location: string}>>(() => {
    const saved = localStorage.getItem('fishing_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLogNotes, setNewLogNotes] = useState('');

  useEffect(() => {
    localStorage.setItem('fishing_logs', JSON.stringify(logs));
  }, [logs]);

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
          timeOfDay: format(new Date(), 'HH:mm'),
          logs: logs
        });
        setAiRec(rec);

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [location, logs]);

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 pb-20 md:pb-0 font-sans flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto p-4 md:p-6 sticky top-0 z-10">
        <div className="flex items-center justify-between bg-slate-800/80 md:bg-slate-800/40 p-4 rounded-3xl border border-slate-700/50 backdrop-blur-xl md:backdrop-blur-md shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Droplets className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-lg md:text-xl tracking-tight text-white leading-none">FISHING TIDE <span className="text-teal-400">INTEL</span></h1>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest leading-normal">Digital Angler Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{location.name}</p>
              <p className="text-xs text-slate-400">{location.type}</p>
            </div>
            {weather && (
              <div className="bg-slate-900/80 p-2 px-3 sm:px-4 rounded-2xl border border-slate-700 flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs md:text-sm font-bold tracking-tight text-emerald-400">{weather.temperature}°C</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto p-4 md:px-6 space-y-6 flex-1 pb-32 md:pb-6">
        {/* Tab Navigation - Bottom on Mobile, Top on Desktop */}
        <nav className="fixed bottom-0 left-0 right-0 md:static bg-slate-900/95 md:bg-transparent backdrop-blur-xl border-t border-slate-700 md:border-none z-50 p-3 md:p-0 md:mb-6 md:flex md:justify-center">
          <div className="md:bg-slate-800/80 md:backdrop-blur-xl md:border md:border-white/10 md:p-2 md:rounded-[2.5rem] flex items-center justify-around md:gap-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 md:px-8 py-2 md:py-2 font-bold text-[10px] md:text-sm md:rounded-[1.5rem] transition-colors ${activeTab === 'dashboard' ? 'text-teal-400 md:bg-white md:text-slate-900 md:shadow-lg md:shadow-white/10' : 'text-slate-400 hover:text-white'}`}
            >
              <MapPin size={24} className="md:hidden" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('species')}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 md:px-8 py-2 md:py-2 font-bold text-[10px] md:text-sm md:rounded-[1.5rem] transition-colors ${activeTab === 'species' ? 'text-teal-400 md:bg-white md:text-slate-900 md:shadow-lg md:shadow-white/10' : 'text-slate-400 hover:text-white'}`}
            >
              <Fish size={24} className="md:hidden" />
              <span>Spesies</span>
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 md:px-8 py-2 md:py-2 font-bold text-[10px] md:text-sm md:rounded-[1.5rem] transition-colors ${activeTab === 'log' ? 'text-teal-400 md:bg-white md:text-slate-900 md:shadow-lg md:shadow-white/10' : 'text-slate-400 hover:text-white'}`}
            >
              <BookOpen size={24} className="md:hidden" />
              <span>Catatan</span>
            </button>
          </div>
        </nav>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
            {/* LEFT COLUMN */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
              {/* Location Selector styled as quick select block */}
              <div className="bg-slate-800/50 p-4 md:p-5 rounded-[2rem] border border-slate-700 w-full">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Lokasi Memancing</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <select 
                      className="w-full h-12 md:h-14 bg-slate-900/60 border border-slate-700/50 text-slate-100 text-sm font-bold rounded-2xl focus:ring-teal-500 focus:border-teal-500 block px-4 pr-10 appearance-none outline-none truncate"
                      value={location.name}
                      onChange={(e) => {
                        const loc = PRESET_LOCATIONS.find(l => l.name === e.target.value);
                        if(loc) setLocation(loc);
                      }}
                    >
                      {location.type === "Koordinat Kustom" && (
                        <option value={location.name} className="bg-slate-800">{location.name}</option>
                      )}
                      {PRESET_LOCATIONS.map(loc => (
                        <option key={loc.name} value={loc.name} className="bg-slate-800">{loc.name} ({loc.type})</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-teal-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const { latitude, longitude } = pos.coords;
                            if (latitude >= -3 && latitude <= 3 && longitude >= 113 && longitude <= 119) {
                              setLocation({ name: "Lokasi GPS Anda", type: "Koordinat Kustom", lat: latitude, lon: longitude });
                            } else {
                              alert("Lokasi Anda berada di luar area yang didukung. Sistem ini difokuskan untuk wilayah perairan Kalimantan Timur.");
                            }
                          },
                          (err) => {
                            alert("Gagal mendapatkan lokasi. Pastikan izin GPS diaktifkan.");
                          }
                        );
                      } else {
                        alert("Browser Anda tidak mendukung GPS.");
                      }
                    }}
                    className="flex items-center justify-center h-12 md:h-14 gap-2 bg-slate-700/50 hover:bg-slate-700 text-teal-400 font-bold text-xs md:text-sm px-4 md:px-6 rounded-2xl border border-slate-600/50 transition-colors shrink-0"
                  >
                    <MapPin size={16} /> <span className="uppercase tracking-wider">GPS Saya</span>
                  </button>
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
                       <CheckCircle2 size={16} /> Skor Memancing AI
                    </h3>
                    {aiRec ? (
                      <div className="relative z-10 w-full">
                        <div className="flex items-end justify-center gap-1 mb-2">
                          <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter">{aiRec.score}</span>
                          <span className="text-lg font-bold text-teal-200 mb-2">/100</span>
                        </div>
                        <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-4 border border-white/20 shadow-inner">
                          <span className="text-sm font-bold text-white">{aiRec.category}</span>
                        </div>
                        <p className="text-xs sm:text-[13px] font-medium leading-relaxed text-teal-50 bg-black/10 p-3.5 rounded-2xl text-left border border-black/5">
                          <strong className="text-white block mb-1 text-xs">🔍 Analisa:</strong> {aiRec.reason.charAt(0).toUpperCase() + aiRec.reason.slice(1)}.
                        </p>
                      </div>
                    ) : (
                      <div className="relative z-10 w-full mb-2">
                        <p className="text-[13px] sm:text-sm font-bold leading-relaxed text-white italic drop-shadow-md">
                          Menyusun rekomendasi terbaik...
                        </p>
                      </div>
                    )}
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
                  <div className="bg-slate-800/30 rounded-[2.5rem] border border-slate-700/50 p-5 md:p-6 flex flex-col flex-1 min-h-[350px] md:min-h-[400px] w-full max-w-[100vw] overflow-hidden">
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
          <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto md:mt-4">
            
            {!isAddingLog && logs.length === 0 && (
              <div className="bg-slate-800/30 px-6 py-16 rounded-[3rem] border border-slate-700/50 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl border border-slate-700 transform rotate-3">
                  <BookOpen className="text-teal-500 opacity-80" size={48} />
                </div>
                <h2 className="text-xl font-black text-white mb-3">Buku Catatan Tangkapan</h2>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed font-medium">Catat hasil tangkapan Anda untuk membantu AI mempelajari pola perairan di lokasi favorit Anda.</p>
                <button 
                  onClick={() => setIsAddingLog(true)}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-black py-4 px-8 rounded-3xl shadow-xl shadow-teal-500/20 uppercase tracking-[0.2em] text-xs transition-colors flex items-center gap-2">
                  <Plus size={16} /> Tambah Catatan
                </button>
              </div>
            )}

            {!isAddingLog && logs.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-black text-white px-2">Catatan Memancing Saya</h2>
                  <button 
                    onClick={() => setIsAddingLog(true)}
                    className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-colors flex items-center gap-2">
                    <Plus size={14} /> Tambah Catatan
                  </button>
                </div>
                
                {logs.slice().reverse().map(log => (
                  <div key={log.id} className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700 relative group overflow-hidden">
                    <div className="mb-3 flex justify-between items-start">
                      <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
                        <Clock size={12} className="text-teal-400" /> {log.date}
                      </div>
                      <button 
                        onClick={() => setLogs(logs.filter(l => l.id !== log.id))}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Hapus Catatan"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-slate-400 font-medium mb-2 flex flex-col gap-1">
                      <span className="flex items-center gap-2 text-slate-300">
                        <MapPin size={14} className="text-emerald-400" /> {log.location}
                      </span>
                    </div>
                    <p className="font-medium text-slate-200 mt-3 whitespace-pre-wrap">{log.notes}</p>
                  </div>
                ))}
              </div>
            )}

            {isAddingLog && (
              <div className="bg-slate-800/80 p-5 md:p-8 rounded-[2rem] border border-slate-700 shadow-xl">
                <h2 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="text-teal-400" /> Catat Hasil Tangkapan
                </h2>
                
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Lokasi Memancing Saat Ini</label>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-slate-300 font-bold text-sm">
                      {location.name}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Detail Tangkapan (Umpan, Cuaca, Jenis Ikan)</label>
                    <textarea 
                      value={newLogNotes}
                      onChange={(e) => setNewLogNotes(e.target.value)}
                      placeholder="Contoh: Tangkapan lumayan hari ini. Cuaca mendung dan air sedang pasang naik. Berhasil menarik Kakap Putih menggunakan umpan udang hidup."
                      className="w-full h-32 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-2xl focus:ring-teal-500 focus:border-teal-500 block p-4 placeholder-slate-600 resize-none outline-none"
                    ></textarea>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        setIsAddingLog(false);
                        setNewLogNotes('');
                      }}
                      className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white font-bold py-3.5 rounded-2xl border border-slate-600/50 transition-colors text-xs uppercase tracking-wider"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={() => {
                        if (!newLogNotes.trim()) return;
                        
                        const newLog = {
                          id: Date.now().toString(),
                          date: format(new Date(), 'dd MMM yyyy, HH:mm', { locale: idLocale }),
                          location: location.name,
                          notes: newLogNotes
                        };
                        
                        setLogs([...logs, newLog]);
                        setNewLogNotes('');
                        setIsAddingLog(false);
                      }}
                      disabled={!newLogNotes.trim()}
                      className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:hover:bg-teal-500 text-slate-900 font-black py-3.5 rounded-2xl shadow-lg shadow-teal-500/20 transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        )}
      </main>
    </div>
  );
}

