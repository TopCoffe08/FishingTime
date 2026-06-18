import React, { useState, useEffect } from 'react';
import { fetchTideAndWeather, fetchRecommendation } from './api';
import { PRESET_LOCATIONS, SPECIES_DB } from './data';
import { FishingLocation, TidePrediction, WeatherCondition, CatchRecord } from './types';
import { TideChart } from './components/TideChart';
import { LocationMap } from './components/LocationMap';
import { format, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { MapPin, Droplets, Wind, Moon, Thermometer, Fish, Clock, Info, CheckCircle2, ChevronRight, BookOpen, Plus, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [location, setLocation] = useState<FishingLocation>(PRESET_LOCATIONS[0]);
  const [tide, setTide] = useState<TidePrediction | null>(null);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [moonPhase, setMoonPhase] = useState<string>('');
  const [scoreRec, setScoreRec] = useState<{score: number, category: string, reason: string, simpleRec: string, verboseRec: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'species' | 'log'>('dashboard');
  const [isAnalisaExpanded, setIsAnalisaExpanded] = useState(false);

  const [logs, setLogs] = useState<CatchRecord[]>(() => {
    const saved = localStorage.getItem('fishing_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLogNotes, setNewLogNotes] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newSpecies, setNewSpecies] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newLength, setNewLength] = useState('');
  const [newBait, setNewBait] = useState('');
  const [searchLog, setSearchLog] = useState('');
  const [now, setNow] = useState(new Date());
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('fishing_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { tide, weather, moonPhaseStr } = await fetchTideAndWeather(location.lat, location.lon);
        setTide(tide);
        setWeather(weather);
        setMoonPhase(moonPhaseStr);

        const rec = await fetchRecommendation({
          location: location.name,
          tideData: tide,
          weatherData: weather,
          moonPhaseStr: moonPhaseStr,
          timeOfDay: format(new Date(), 'HH:mm'),
          logs: logs
        });
        setScoreRec(rec);

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
      <header className="w-full max-w-5xl mx-auto p-4 md:p-6 relative z-10">
        <div className="flex items-center justify-between bg-slate-800/80 md:bg-slate-800/40 p-4 rounded-3xl border border-slate-700/50 backdrop-blur-xl md:backdrop-blur-md shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Droplets className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-lg md:text-xl tracking-tight text-white leading-none">FISHING <span className="text-teal-400">TIME</span></h1>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest leading-normal">Digital Angler Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{location.name}</p>
              <p className="text-xs text-slate-400">{location.type}</p>
            </div>
            {!isOnline && (
              <div className="bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/50 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-[10px] md:text-xs font-black tracking-tight text-amber-400 uppercase">Offline Mode</span>
              </div>
            )}
            {weather && (
              <div className="bg-slate-900/80 p-2 px-3 sm:px-4 rounded-2xl border border-slate-700 flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs md:text-sm font-bold tracking-tight text-emerald-400">{weather.temperature}°C</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 flex-1 pb-32 md:pb-8">
        {/* Tab Navigation - Bottom on Mobile, Top on Desktop */}
        <nav className="fixed bottom-0 left-0 right-0 md:static bg-slate-900/95 md:bg-transparent backdrop-blur-xl border-t border-slate-700 md:border-none z-50 p-3 md:p-0 md:mb-8 md:flex md:justify-center">
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
              <span className="whitespace-nowrap">Katalog Umpan</span>
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 md:px-8 py-2 md:py-2 font-bold text-[10px] md:text-sm md:rounded-[1.5rem] transition-colors ${activeTab === 'log' ? 'text-teal-400 md:bg-white md:text-slate-900 md:shadow-lg md:shadow-white/10' : 'text-slate-400 hover:text-white'}`}
            >
              <BookOpen size={24} className="md:hidden" />
              <span>Jurnal Tangkapan</span>
            </button>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0"
            >
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
                      {location.type === "Perairan/GPS" && (
                        <option value={location.name} className="bg-slate-800">{location.name} (Lokasi GPS)</option>
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
                        setIsLocating(true);
                        navigator.geolocation.getCurrentPosition(
                          async (pos) => {
                            const { latitude, longitude } = pos.coords;
                            try {
                              // Try to get a meaningful location name using OpenStreetMap Nominatim
                              const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                              if (geoRes.ok) {
                                const geoData = await geoRes.json();
                                // Prefer village, town, city, or fall back to generic label
                                const locName = geoData.address.village || geoData.address.town || geoData.address.city || geoData.address.county || geoData.address.state || "Lokasi Anda";
                                setLocation({ name: locName, type: "Perairan/GPS", lat: latitude, lon: longitude });
                              } else {
                                setLocation({ name: "Titik GPS", type: "Perairan/GPS", lat: latitude, lon: longitude });
                              }
                            } catch (e) {
                              setLocation({ name: "Titik GPS", type: "Perairan/GPS", lat: latitude, lon: longitude });
                            } finally {
                              setIsLocating(false);
                            }
                          },
                          (err) => {
                            setIsLocating(false);
                            alert("Gagal mendapatkan lokasi. Pastikan izin GPS diaktifkan.");
                          }
                        );
                      } else {
                        alert("Browser Anda tidak mendukung GPS.");
                      }
                    }}
                    disabled={isLocating}
                    style={{ width: '65.797px' }}
                    className={`mx-auto md:mx-0 flex items-center justify-center h-12 md:h-14 bg-slate-700/50 text-teal-400 rounded-2xl border border-slate-600/50 transition-colors shrink-0 ${isLocating ? 'opacity-50 cursor-wait' : 'hover:bg-slate-700'}`}
                  >
                    {isLocating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
                    ) : (
                      <MapPin size={20} />
                    )}
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
                       <CheckCircle2 size={16} /> Skor Memancing
                    </h3>
                    {scoreRec ? (
                      <div className="relative z-10 w-full">
                        <div className="flex items-end justify-center gap-1 mb-2">
                          <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter">{scoreRec.score}</span>
                          <span className="text-lg font-bold text-teal-200 mb-2">/100</span>
                        </div>
                        <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-4 border border-white/20 shadow-inner">
                          <span className="text-sm font-bold text-white">{scoreRec.category}</span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-medium leading-relaxed text-teal-50 bg-black/10 p-4 rounded-2xl text-left border border-black/5 flex flex-col gap-2 transition-all">
                          <div>
                            <strong className="text-white block mb-1.5 text-xs uppercase tracking-widest">🔍 Analisa Singkat</strong>
                            <span className="text-teal-100">{scoreRec.reason.charAt(0).toUpperCase() + scoreRec.reason.slice(1)}.</span>
                          </div>
                          
                          {isAnalisaExpanded && (
                            <div className="mt-3 pt-3 border-t border-white/10 text-teal-100/90 text-[11px] sm:text-xs">
                               <div className="whitespace-pre-wrap">{scoreRec.verboseRec}</div>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => setIsAnalisaExpanded(!isAnalisaExpanded)}
                            className="text-white/70 hover:text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest self-center mt-2 flex items-center gap-1 transition-colors"
                          >
                            {isAnalisaExpanded ? 'Tutup Analisa' : 'Baca Analisa Penuh'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 w-full mb-2">
                        <p className="text-[13px] sm:text-sm font-bold leading-relaxed text-white italic drop-shadow-md">
                          Menyusun rekomendasi terbaik...
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="hidden md:block bg-slate-800/50 p-5 sm:p-6 md:p-8 rounded-[2.5rem] border border-slate-700">
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-teal-400"><MapPin size={20} /></span>
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Peta Interaktif</h3>
                      </div>
                    </div>
                    <div className="h-[250px] md:h-[300px] w-full relative z-0">
                      <LocationMap lat={location.lat} lon={location.lon} name={location.name} />
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-5 sm:p-6 md:p-8 rounded-[2.5rem] border border-slate-700">
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-teal-400"><Fish size={20} /></span>
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Quick Stats</h3>
                      </div>
                      <div className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                         Live Data (OpenMeteo)
                      </div>
                    </div>
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-700 flex items-center gap-3 sm:gap-4">
                         <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center bg-amber-500/10">
                           <Moon className="text-amber-400" size={18} />
                         </div>
                         <div className="min-w-0">
                           <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase truncate">Fase Bulan</p>
                           <p className="text-sm border-0 font-bold text-slate-200 mt-0.5 truncate">{moonPhase}</p>
                         </div>
                      </div>
                      <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-700 flex items-center gap-3 sm:gap-4">
                         <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center bg-blue-500/10">
                           <Droplets className="text-blue-400" size={18} />
                         </div>
                         <div className="min-w-0">
                           <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase truncate">Cuaca</p>
                           <p className="text-sm font-bold text-slate-200 mt-0.5 truncate">{weather.description}</p>
                         </div>
                      </div>
                      <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-700 flex items-center gap-3 sm:gap-4">
                         <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center bg-orange-500/10">
                           <Thermometer className="text-orange-400" size={18} />
                         </div>
                         <div className="min-w-0">
                           <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase truncate">Suhu Cuaca</p>
                           <p className="text-sm font-bold text-slate-200 mt-0.5 truncate">{weather.temperature}°C</p>
                         </div>
                      </div>
                      <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-700 flex items-center gap-3 sm:gap-4">
                         <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center bg-teal-500/10">
                           <Wind className="text-teal-400" size={18} />
                         </div>
                         <div className="min-w-0">
                           <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase truncate">Kecepatan Angin</p>
                           <p className="text-sm font-bold text-slate-200 mt-0.5 truncate">{weather.windSpeed} km/h</p>
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
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                       <Droplets className="text-teal-400" size={16} /> Grafik Pasang Surut
                    </h3>
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

                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide mb-4 w-full">
                      {[
                        { label: 'Kemarin', offset: -1 },
                        { label: 'Hari Ini', offset: 0 },
                        { label: 'Besok', offset: 1 },
                        { label: 'Lusa', offset: 2 }
                      ].map(item => (
                        <button
                          key={item.offset}
                          onClick={() => setSelectedDateOffset(item.offset)}
                          className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 ${selectedDateOffset === item.offset ? 'bg-teal-500 text-slate-900 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 w-full relative">
                      <TideChart 
                        data={tide.hourlyData} 
                        displayedDate={addDays(now, selectedDateOffset)} 
                        currentTime={now} 
                        dailySolar={tide.dailySolar} 
                      />
                    </div>
                  </div>
                  
                  {/* Mobile Interactive Map */}
                  <div className="md:hidden bg-slate-800/50 p-5 sm:p-6 md:p-8 rounded-[2.5rem] border border-slate-700 mb-6">
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-teal-400"><MapPin size={20} /></span>
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Peta Interaktif</h3>
                      </div>
                    </div>
                    <div className="h-[250px] md:h-[300px] w-full relative z-0">
                      <LocationMap lat={location.lat} lon={location.lon} name={location.name} />
                    </div>
                  </div>

                  {/* Quick visual stats beneath chart if needed */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                     <div className="bg-slate-800/40 p-4 md:p-5 rounded-[2rem] border border-slate-700/50 flex flex-col items-center justify-center">
                        <p className="text-[10px] md:text-xs text-slate-500 font-black mb-1 md:mb-2 tracking-widest">WAKTU</p>
                        <p className="text-sm md:text-base font-bold text-slate-200">{format(now, 'HH:mm')}</p>
                     </div>
                     <div className="bg-slate-800/40 p-4 md:p-5 rounded-[2rem] border border-slate-700/50 flex flex-col items-center justify-center">
                        <p className="text-[10px] md:text-xs text-slate-500 font-black mb-1 md:mb-2 tracking-widest">KONDISI</p>
                        <p className="text-sm md:text-base font-bold text-amber-400 uppercase">{weather?.description || 'Stabil'}</p>
                     </div>
                     <div className="bg-slate-800/40 p-4 md:p-5 rounded-[2rem] border border-slate-700/50 flex flex-col items-center justify-center md:col-span-2 hidden md:flex">
                        <button className="w-full h-full text-xs md:text-sm font-black text-teal-400 uppercase tracking-widest hover:text-teal-300 transition-colors flex items-center justify-center gap-2">
                          <Clock size={18} /> Update Real-Time
                        </button>
                     </div>
                  </div>
                 </>
               ) : null}
            </div>
          </motion.div>
          )}

          {activeTab === 'species' && (
            <motion.div 
              key="species"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6 w-full max-w-3xl mx-auto"
            >
              <div className="bg-slate-800/80 p-5 md:p-6 rounded-[2rem] border border-slate-700 shadow-xl overflow-hidden relative mb-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Katalog Umpan & Ikan Target</h2>
              <p className="text-sm font-medium text-slate-400">Pilih umpan jitu dan teknik pancing berdasarkan kondisi riil dan tipe spesies di ekosistem perairan {location.type}.</p>
            </div>
            <div className="bg-slate-800/30 p-6 rounded-[2.5rem] border border-slate-700/50">
              <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">Daftar Rekomendasi ({location.type})</h2>
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
            </motion.div>
          )}

          {activeTab === 'log' && (
            <motion.div 
              key="log"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6 w-full max-w-2xl mx-auto md:mt-4"
            >
              
              {!isAddingLog && logs.length === 0 && (
              <div className="bg-slate-800/30 px-6 py-16 rounded-[3rem] border border-slate-700/50 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl border border-slate-700 transform rotate-3">
                  <BookOpen className="text-teal-500 opacity-80" size={48} />
                </div>
                <h2 className="text-xl font-black text-white mb-3">Jurnal Tangkapan (Catatan Personal)</h2>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed font-medium">Catat spesies ikan, berat, umpan yang dipakai, cuaca riil saat ini, dan dokumentasi foto untuk setiap trip memancing.</p>
                <button 
                  onClick={() => setIsAddingLog(true)}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-black py-4 px-8 rounded-3xl shadow-xl shadow-teal-500/20 uppercase tracking-[0.2em] text-xs transition-colors flex items-center gap-2">
                  <Plus size={16} /> Tambah Catatan
                </button>
              </div>
            )}

            {!isAddingLog && logs.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-3">
                  <h2 className="text-lg font-black text-white px-2">Jurnal Tangkapan Saya</h2>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input 
                      type="text" 
                      placeholder="Cari catatan..." 
                      value={searchLog}
                      onChange={(e) => setSearchLog(e.target.value)}
                      className="flex-1 bg-slate-900/60 border border-slate-700/50 text-slate-100 text-xs font-medium rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                    />
                    <button 
                      onClick={() => setIsAddingLog(true)}
                      className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold py-2 px-3 sm:px-4 rounded-xl text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shrink-0">
                      <Plus size={14} /> <span className="hidden sm:inline">Tambah Catatan</span> <span className="sm:hidden">Tambah</span>
                    </button>
                  </div>
                </div>
                
                {logs.slice().reverse()
                  .filter(log => log.notes.toLowerCase().includes(searchLog.toLowerCase()) || log.location.toLowerCase().includes(searchLog.toLowerCase()))
                  .map(log => (
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
                    {log.photoUrl && (
                      <div className="my-4 rounded-2xl overflow-hidden border border-slate-700 aspect-video w-full bg-slate-900 flex items-center justify-center relative">
                        <img src={log.photoUrl} alt="Tangkapan" className="w-full h-full object-cover" onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%23334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
                        }} />
                      </div>
                    )}
                    <div className="text-sm text-slate-400 font-medium mb-2 flex flex-col gap-1">
                      <span className="flex items-center gap-2 text-slate-300">
                        <MapPin size={14} className="text-emerald-400" /> {log.location}
                      </span>
                      {(log.weatherCondition || log.tideCondition) && (
                        <span className="flex items-center gap-2 text-slate-400 text-xs">
                          <Droplets size={12} className="text-blue-400" /> {log.weatherCondition || '-'} • {log.tideCondition || '-'}
                        </span>
                      )}
                      {(log.species || log.weight || log.length) && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {log.species && <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-1 rounded-[6px] uppercase tracking-wider">{log.species}</span>}
                          {log.weight && <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-1 rounded-[6px]">{log.weight} kg</span>}
                          {log.length && <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-1 rounded-[6px]">{log.length} cm</span>}
                        </div>
                      )}
                      {log.bait && (
                        <span className="flex items-center gap-2 text-amber-400/80 mt-1 text-xs font-bold">
                          🎯 Umpan: <span className="text-amber-400">{log.bait}</span>
                        </span>
                      )}
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
                  
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="col-span-2 lg:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Spesies Ikan</label>
                        <input 
                          type="text"
                          value={newSpecies}
                          onChange={(e) => setNewSpecies(e.target.value)}
                          placeholder="Jumbo Kakap, Patin..."
                          className="w-full h-12 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Berat (kg)</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={newWeight}
                          onChange={(e) => setNewWeight(e.target.value)}
                          placeholder="0.0"
                          className="w-full h-12 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Panjang (cm)</label>
                        <input 
                          type="number"
                          step="1"
                          value={newLength}
                          onChange={(e) => setNewLength(e.target.value)}
                          placeholder="0"
                          className="w-full h-12 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-600 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Umpan Yang Digunakan</label>
                      <input 
                        type="text"
                        value={newBait}
                        onChange={(e) => setNewBait(e.target.value)}
                        placeholder="Udang Hidup, Cacing Merah..."
                        className="w-full h-12 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center justify-between">
                        <span>Laporan/Catatan Tambahan</span>
                      </label>
                      <textarea 
                        value={newLogNotes}
                        onChange={(e) => setNewLogNotes(e.target.value)}
                        placeholder="Tangkapan lumayan hari ini..."
                        className="w-full h-24 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-2xl focus:ring-teal-500 focus:border-teal-500 block p-4 placeholder-slate-600 resize-none outline-none"
                      ></textarea>
                    </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center justify-between">
                      <span>Lampirkan Foto Hasil</span>
                      <span className="text-[8px] sm:text-[10px] opacity-75 font-normal normal-case">(Opsional) Pilih gambar</span>
                    </label>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewPhotoUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-sm text-slate-400 file:mr-4 file:py-3 file:px-4 file:rounded-[12px] file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-slate-700 file:text-teal-400 hover:file:bg-slate-600 file:transition-colors bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50"
                    />
                    {newPhotoUrl && (
                      <div className="mt-4 rounded-xl border border-teal-500/30 overflow-hidden relative group max-w-sm">
                        <img src={newPhotoUrl} className="w-full object-cover" />
                        <button 
                          onClick={() => setNewPhotoUrl('')}
                          className="absolute top-2 right-2 bg-slate-900/80 p-1 rounded-full text-red-500 hover:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        setIsAddingLog(false);
                        setNewLogNotes('');
                        setNewPhotoUrl('');
                        setNewSpecies('');
                        setNewWeight('');
                        setNewLength('');
                        setNewBait('');
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
                          notes: newLogNotes,
                          photoUrl: newPhotoUrl.trim() || undefined,
                          species: newSpecies.trim() || undefined,
                          weight: parseFloat(newWeight) || undefined,
                          length: parseFloat(newLength) || undefined,
                          bait: newBait.trim() || undefined,
                          weatherCondition: weather ? `${weather.description}, ${weather.temperature}°C` : undefined,
                          tideCondition: tide ? tide.status : undefined
                        };
                        
                        setLogs([...logs, newLog]);
                        setNewLogNotes('');
                        setNewPhotoUrl('');
                        setNewSpecies('');
                        setNewWeight('');
                        setNewLength('');
                        setNewBait('');
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
            
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

