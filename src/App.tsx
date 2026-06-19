import React, { useState, useEffect } from 'react';
import { fetchTideAndWeather, fetchRecommendation } from './api';
import { PRESET_LOCATIONS, SPECIES_DB } from './data';
import { FishingLocation, TidePrediction, WeatherCondition, CatchRecord } from './types';
import { TideChart } from './components/TideChart';
import { LocationMap } from './components/LocationMap';
import { format, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { MapPin, Droplets, Wind, Moon, Thermometer, Fish, Clock, Info, CheckCircle2, ChevronRight, BookOpen, Plus, Save, X, Compass, Activity, TrendingUp, BarChart2, Download, Upload, Edit3, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import localforage from 'localforage';
import { calculateSolunarData, SolunarDayData } from './solunar';

localforage.config({
  name: 'FishingTime',
  storeName: 'logs_store'
});

const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
};

export default function App() {
  const [location, setLocation] = useState<FishingLocation>(PRESET_LOCATIONS[0]);
  const [tide, setTide] = useState<TidePrediction | null>(null);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [moonPhase, setMoonPhase] = useState<string>('');
  const [scoreRec, setScoreRec] = useState<{score: number, category: string, reason: string, simpleRec: string, verboseRec: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  const [now, setNow] = useState(new Date());
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0);
  const displayedDate = addDays(now, selectedDateOffset);
  const solunar = React.useMemo(() => {
    return calculateSolunarData(displayedDate, location.lat, location.lon);
  }, [displayedDate.getDate(), displayedDate.getMonth(), location.lat, location.lon]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'species' | 'log' | 'evaluasi'>('dashboard');
  const [isAnalisaExpanded, setIsAnalisaExpanded] = useState(false);

  const [logs, setLogs] = useState<CatchRecord[]>([]);
  const [isLogsLoaded, setIsLogsLoaded] = useState(false);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [newLogNotes, setNewLogNotes] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newSpecies, setNewSpecies] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newLength, setNewLength] = useState('');
  const [newBait, setNewBait] = useState('');
  const [searchLog, setSearchLog] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [locationSearch, setLocationSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (locationSearch.length < 3) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearch)}&format=json&limit=5`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Failed to search location:", err);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [locationSearch]);

  const handleMapClick = async (lat: number, lon: number) => {
    setIsLocating(true);
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const locName = geoData.address?.village || geoData.address?.town || geoData.address?.city || geoData.address?.county || geoData.address?.state || "Custom Spot";
        setLocation({ name: locName, type: "Laut", lat, lon });
      } else {
        setLocation({ name: "Custom Spot", type: "Laut", lat, lon });
      }
    } catch (e) {
      setLocation({ name: "Custom Spot", type: "Laut", lat, lon });
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    // Load logs on mount
    localforage.getItem<CatchRecord[]>('fishing_logs').then(savedLogs => {
      if (savedLogs) setLogs(savedLogs);
      else {
        // Migration from localStorage
        const oldLogs = localStorage.getItem('fishing_logs');
        if (oldLogs) {
          const parsed = JSON.parse(oldLogs);
          setLogs(parsed);
          localforage.setItem('fishing_logs', parsed);
        }
      }
      setIsLogsLoaded(true);
    }).catch(err => {
      console.error("Could not load logs", err);
      setIsLogsLoaded(true);
    });
  }, []);

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
    if (isLogsLoaded) {
      localforage.setItem('fishing_logs', logs).catch(err => console.error("Could not save logs", err));
    }
  }, [logs, isLogsLoaded]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { tide, weather, moonPhaseStr } = await fetchTideAndWeather(location.lat, location.lon, location.bmkgCode);
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

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fishing-log-${format(new Date(), 'yyyyMMdd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const header = 'Tanggal,Lokasi,Spesies,Berat(kg),Panjang(cm),Umpan,Cuaca,Pasang,Catatan';
    const rows = logs.map(l =>
      `"${l.date}","${l.location}","${l.species||''}","${l.weight||''}","${l.length||''}","${l.bait||''}","${l.weatherCondition||''}","${l.tideCondition||''}","${(l.notes||'').replace(/"/g, '""')}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fishing-log-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported: CatchRecord[] = JSON.parse(ev.target?.result as string);
        const existingIds = new Set(logs.map(l => l.id));
        const newLogs = imported.filter(l => !existingIds.has(l.id));
        setLogs([...logs, ...newLogs]);
        alert(`Berhasil mengimpor ${newLogs.length} catatan baru.`);
      } catch {
        alert('File tidak valid. Pastikan file JSON dari export FishingTime.');
      }
    };
    reader.readAsText(file);
  };

  const handleEditLog = (log: CatchRecord) => {
    setEditingLogId(log.id);
    setNewSpecies(log.species || '');
    setNewWeight(log.weight?.toString() || '');
    setNewLength(log.length?.toString() || '');
    setNewBait(log.bait || '');
    setNewLogNotes(log.notes);
    setNewPhotoUrl(log.photoUrl || '');
    setIsAddingLog(true);
  };

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

      <main className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 flex-1 pb-8">
        {/* Tab Navigation */}
        <nav className="static bg-slate-900/95 md:bg-transparent backdrop-blur-xl border border-slate-700 md:border-none z-50 p-2 sm:p-3 md:pb-0 md:p-0 md:mb-10 flex justify-center rounded-3xl md:rounded-none mb-6">
          <div className="md:bg-slate-800/90 md:backdrop-blur-2xl md:border md:border-slate-600/50 md:p-2 md:rounded-[2.5rem] flex items-center justify-around md:gap-2 md:shadow-2xl">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 sm:px-4 md:px-8 py-2 font-bold text-[10px] md:text-sm md:rounded-[1.5rem] transition-all rounded-xl ${activeTab === 'dashboard' ? 'text-teal-400 bg-teal-500/10 md:bg-teal-500 md:text-slate-900 md:shadow-lg md:shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <MapPin size={20} className="md:hidden mb-0.5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('species')}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 sm:px-4 md:px-8 py-2 font-bold text-[10px] md:text-sm md:rounded-[1.5rem] transition-all rounded-xl ${activeTab === 'species' ? 'text-teal-400 bg-teal-500/10 md:bg-teal-500 md:text-slate-900 md:shadow-lg md:shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Fish size={20} className="md:hidden mb-0.5" />
              <span className="whitespace-nowrap">Katalog</span>
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 sm:px-4 md:px-8 py-2 font-bold text-[10px] md:text-sm md:rounded-[1.5rem] transition-all rounded-xl ${activeTab === 'log' ? 'text-teal-400 bg-teal-500/10 md:bg-teal-500 md:text-slate-900 md:shadow-lg md:shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <BookOpen size={20} className="md:hidden mb-0.5" />
              <span>Jurnal</span>
            </button>
            <button 
              onClick={() => setActiveTab('evaluasi')}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 sm:px-4 md:px-8 py-2 font-bold text-[10px] md:text-sm md:rounded-[1.5rem] transition-all rounded-xl ${activeTab === 'evaluasi' ? 'text-teal-400 bg-teal-500/10 md:bg-teal-500 md:text-slate-900 md:shadow-lg md:shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <TrendingUp size={20} className="md:hidden mb-0.5" />
              <span>Evaluasi</span>
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 flex-1 min-h-0"
            >
              {/* LEFT COLUMN */}
            <div className="lg:col-span-5 flex flex-col gap-6 md:gap-8">
              {/* Location Selector styled as quick select block */}
              <div className="bg-slate-800/50 p-4 md:p-5 rounded-[2rem] border border-slate-700 w-full">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Lokasi Memancing</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      className="w-full h-12 md:h-14 bg-slate-900/60 border border-slate-700/50 text-slate-100 text-sm font-bold rounded-2xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-500 outline-none truncate mb-3"
                      placeholder="Cari desa, kota, muara..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-14 left-0 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden text-sm">
                        {searchResults.map(r => (
                          <button 
                            key={r.place_id} 
                            className="w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700 text-slate-200 transition"
                            onClick={() => {
                              const name = r.display_name.split(',')[0];
                              setLocation({ name, type: 'Custom', lat: parseFloat(r.lat), lon: parseFloat(r.lon) });
                              setSearchResults([]);
                              setLocationSearch('');
                            }}
                          >
                            <span className="block font-bold truncate">{r.display_name.split(',')[0]}</span>
                            <span className="block text-[10px] text-slate-400 truncate">{r.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <select 
                      className="w-full h-12 md:h-14 bg-slate-900/60 border border-slate-700/50 text-slate-100 text-sm font-bold rounded-2xl focus:ring-teal-500 focus:border-teal-500 block px-4 pr-10 appearance-none outline-none truncate"
                      value={location.name}
                      onChange={(e) => {
                        const loc = PRESET_LOCATIONS.find(l => l.name === e.target.value);
                        if(loc) setLocation(loc);
                      }}
                    >
                      {!PRESET_LOCATIONS.some(l => l.name === location.name) && (
                        <option value={location.name} className="bg-slate-800">{location.name} ({location.type})</option>
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
                        <div className="text-sm leading-relaxed text-slate-200 bg-slate-900/60 p-5 sm:p-6 rounded-[2rem] text-left border border-teal-500/30 flex flex-col gap-3 transition-all mt-4 sm:mt-6 shadow-inner w-full backdrop-blur-sm">
                          <div>
                            <strong className="text-teal-300 block mb-2 text-xs uppercase tracking-widest font-black flex items-center gap-1.5"><Info size={16} /> Analisa Singkat</strong>
                            <span className="text-slate-100 block mt-2 text-[14px] leading-[1.6]">{scoreRec.reason.charAt(0).toUpperCase() + scoreRec.reason.slice(1)}.</span>
                          </div>
                          
                          {isAnalisaExpanded && (
                            <div className="mt-2 pt-4 border-t border-slate-700 text-slate-300 text-[14px] leading-[1.6]">
                               <div className="whitespace-pre-wrap">{scoreRec.verboseRec}</div>
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
                    ) : (
                      <div className="relative z-10 w-full mb-2">
                        <p className="text-[13px] sm:text-sm font-bold leading-relaxed text-white italic drop-shadow-md">
                          Menyusun rekomendasi terbaik...
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-800/50 p-5 sm:p-6 md:p-8 rounded-[2.5rem] border border-slate-700">
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-teal-400"><Fish size={20} /></span>
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Quick Stats</h3>
                      </div>
                      <div className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                         <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                         <span className="hidden min-[360px]:inline">OpenMeteo Data</span>
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
                </>
              ) : null}
            </div>

            {/* RIGHT COLUMN (TIDE) */}
            <div className="lg:col-span-7 flex flex-col gap-6 md:gap-8">
               {isLoading ? (
                 <div className="flex-1 min-h-[300px]"></div>
               ) : tide ? (
                 <>
                  {/* Tide Chart block styled exactly like the center column in HTML */}
                  <div className="bg-slate-800/30 rounded-[2.5rem] border border-slate-700/50 p-5 md:p-6 flex flex-col flex-1 min-h-[350px] md:min-h-[400px] w-full max-w-[100vw] overflow-hidden">
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                       <Droplets className="text-teal-400" size={16} /> Grafik Pasang Surut
                    </h3>
                    <div className="flex justify-between items-start mb-8 gap-4 flex-wrap">
                      <div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter flex items-baseline">
                          {tide.currentHeight.toFixed(2)}
                          <span className="text-base lg:text-lg text-slate-400 ml-2 font-normal">meters</span>
                        </h2>
                        <p className="text-sm text-teal-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-2 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">
                          <Droplets className="w-4 h-4" />
                          {tide.status} Sekarang
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="text-[10px] text-white/75 uppercase font-black">Pasang</p>
                          <p className="font-bold text-sm text-white">
                            {tide.nextHighTide ? format(tide.nextHighTide, 'HH:mm') : '-'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-white/75 uppercase font-black">Surut</p>
                          <p className="font-bold text-sm text-white">
                            {tide.nextLowTide ? format(tide.nextLowTide, 'HH:mm') : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 overflow-x-auto p-1 pb-3 scrollbar-hide mb-6 w-full">
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
                    {tide && (
                      <div className={`
                        flex items-center gap-2 text-xs font-bold px-4 py-2.5 
                        rounded-2xl border mt-3
                        ${tide.dataSource === 'marine-api' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : tide.dataSource === 'bmkg' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }
                      `}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          tide.dataSource === 'marine-api' ? 'bg-emerald-400' :
                          tide.dataSource === 'bmkg'       ? 'bg-blue-400'    :
                                                             'bg-amber-400'
                        }`} />
                        <div className="flex flex-col gap-1 w-full">
                          {tide.dataSource === 'marine-api' && (
                            <span>Data resmi Open-Meteo Marine</span>
                          )}
                          {tide.dataSource === 'bmkg' && (
                            <span>
                              Sumber data pasang surut: BMKG ·{' '}
                              {tide.bmkgHighTide && (
                                <span>
                                  Pasang: {tide.bmkgHighTide.height.toFixed(2)}m
                                  pukul {format(tide.bmkgHighTide.time, 'HH:mm')} ·{' '}
                                </span>
                              )}
                              {tide.bmkgLowTide && (
                                <span>
                                  Surut: {tide.bmkgLowTide.height.toFixed(2)}m 
                                  pukul {format(tide.bmkgLowTide.time, 'HH:mm')}
                                </span>
                              )}
                            </span>
                          )}
                          {tide.dataSource === 'estimated' && (
                            <span>
                              ⚠️ Data pasang surut tidak tersedia untuk lokasi ini. Data saat ini adalah estimasi fallback.
                              Cek data resmi:{' '}
                              <a 
                                href="https://maritim.bmkg.go.id/cuaca/pasut" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="underline hover:text-white"
                              >
                                BMKG Pasang Surut
                              </a>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Unified Interactive Map */}
                  <div className="bg-slate-800/50 p-5 sm:p-6 md:p-8 rounded-[2.5rem] border border-slate-700">
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-teal-400"><MapPin size={20} /></span>
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Peta Interaktif</h3>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mb-3 italic">ℹ️ Klik area peta untuk merubah lokasi analisis. Info pasang surut dan cuaca difetch ulang otomatis.</div>
                    <div className="aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-inner border border-slate-700/50 bg-slate-900/50 relative z-0">
                      <LocationMap lat={location.lat} lon={location.lon} name={location.name} onLocationSelect={handleMapClick} />
                    </div>
                  </div>

                  {/* Solunar Details Table */}
                  <div className="bg-slate-800/30 p-5 sm:p-6 md:p-8 rounded-[2.5rem] border border-slate-700/50">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400"><Activity size={20} /></span>
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Tabel Solunar Harian</h3>
                      </div>
                      <div className="text-[9px] md:text-[10px] text-slate-300 uppercase font-black px-3 py-1 bg-slate-900/50 rounded-full border border-slate-700">
                        {format(displayedDate, 'dd MMM yyyy', { locale: idLocale })}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Major Periods */}
                      <div className="bg-slate-800/50 p-4 rounded-[1.5rem] border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <Activity size={80} />
                        </div>
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span> Waktu Utama (Major)
                        </h4>
                        <div className="space-y-4 relative z-10">
                          <div>
                            <p className="text-[10px] text-white/75 uppercase tracking-widest mb-1 font-bold">Transit Atas (Bulan di Puncak)</p>
                            <p className="font-bold text-slate-100">
                              {solunar.major1 ? `${format(solunar.major1.start, 'HH:mm')} - ${format(solunar.major1.end, 'HH:mm')}` : 'Tidak Ada'}
                            </p>
                          </div>
                          <div className="h-px w-full bg-slate-700/50"></div>
                          <div>
                            <p className="text-[10px] text-white/75 uppercase tracking-widest mb-1 font-bold">Transit Bawah (Bulan di Bawah)</p>
                            <p className="font-bold text-slate-100">
                              {solunar.major2 ? `${format(solunar.major2.start, 'HH:mm')} - ${format(solunar.major2.end, 'HH:mm')}` : 'Tidak Ada'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Minor Periods */}
                      <div className="bg-slate-800/50 p-4 rounded-[1.5rem] border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <Moon size={80} />
                        </div>
                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span> Waktu Minor
                        </h4>
                        <div className="space-y-4 relative z-10">
                          <div>
                            <p className="text-[10px] text-white/75 uppercase tracking-widest mb-1 font-bold">Terbit Bulan (Moonrise)</p>
                            <p className="font-bold text-slate-100">
                              {solunar.minor1 ? `${format(solunar.minor1.start, 'HH:mm')} - ${format(solunar.minor1.end, 'HH:mm')}` : 'Tidak Ada'}
                            </p>
                          </div>
                          <div className="h-px w-full bg-slate-700/50"></div>
                          <div>
                            <p className="text-[10px] text-white/75 uppercase tracking-widest mb-1 font-bold">Terbenam Bulan (Moonset)</p>
                            <p className="font-bold text-slate-100">
                              {solunar.minor2 ? `${format(solunar.minor2.start, 'HH:mm')} - ${format(solunar.minor2.end, 'HH:mm')}` : 'Tidak Ada'}
                            </p>
                          </div>
                        </div>
                      </div>
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
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input 
                      type="text" 
                      placeholder="Cari catatan..." 
                      value={searchLog}
                      onChange={(e) => setSearchLog(e.target.value)}
                      className="flex-1 min-w-[120px] bg-slate-900/60 border border-slate-700/50 text-slate-100 text-xs font-medium rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                    />
                    <button onClick={handleExportJSON} title="Export JSON" className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition">
                       <Download size={16} />
                    </button>
                    <button onClick={handleExportCSV} title="Export CSV" className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition">
                       <BarChart2 size={16} />
                    </button>
                    <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" id="import-json" />
                    <label htmlFor="import-json" title="Import JSON" className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer">
                      <UploadCloud size={16} />
                    </label>
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
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditLog(log)}
                          className="text-slate-500 hover:text-teal-400 transition-colors"
                          title="Edit Catatan"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => setLogs(logs.filter(l => l.id !== log.id))}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="Hapus Catatan"
                        >
                          <X size={16} />
                        </button>
                      </div>
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

              {isAddingLog && (() => {
                const weightError = newWeight && (parseFloat(newWeight) <= 0 || parseFloat(newWeight) > 999) ? 'Berat harus antara 0.01 - 999 kg' : null;
                const lengthError = newLength && (parseFloat(newLength) <= 0 || parseFloat(newLength) > 500) ? 'Panjang harus antara 1 - 500 cm' : null;
                return (
              <div className="bg-slate-800/80 p-5 md:p-8 rounded-[2rem] border border-slate-700 shadow-xl">
                <h2 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="text-teal-400" /> {editingLogId ? 'Edit Catatan' : 'Catat Hasil Tangkapan'}
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
                          min="0.01"
                          max="999"
                          value={newWeight}
                          onChange={(e) => setNewWeight(e.target.value)}
                          placeholder="0.0"
                          className="w-full h-12 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-600 outline-none"
                        />
                        {weightError && <p className="text-red-400 mt-1 text-[10px]">{weightError}</p>}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Panjang (cm)</label>
                        <input 
                          type="number"
                          step="1"
                          min="1"
                          max="500"
                          value={newLength}
                          onChange={(e) => setNewLength(e.target.value)}
                          placeholder="0"
                          className="w-full h-12 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-600 outline-none"
                        />
                        {lengthError && <p className="text-red-400 mt-1 text-[10px]">{lengthError}</p>}
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
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setNewPhotoUrl(compressed);
                          } catch (err) {
                            console.error("Failed to compress image", err);
                          }
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
                        setEditingLogId(null);
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
                        if (!newLogNotes.trim() || weightError || lengthError) return;
                        
                        if (editingLogId) {
                          setLogs(logs.map(l => l.id === editingLogId ? {
                            ...l,
                            notes: newLogNotes,
                            photoUrl: newPhotoUrl.trim() || undefined,
                            species: newSpecies.trim() || undefined,
                            weight: parseFloat(newWeight) || undefined,
                            length: parseFloat(newLength) || undefined,
                            bait: newBait.trim() || undefined,
                          } : l));
                          setEditingLogId(null);
                        } else {
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
                        }
                        
                        setNewLogNotes('');
                        setNewPhotoUrl('');
                        setNewSpecies('');
                        setNewWeight('');
                        setNewLength('');
                        setNewBait('');
                        setIsAddingLog(false);
                      }}
                      disabled={!newLogNotes.trim() || !!weightError || !!lengthError}
                      className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:hover:bg-teal-500 text-slate-900 font-black py-3.5 rounded-2xl shadow-lg shadow-teal-500/20 transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> Simpan
                    </button>
                  </div>
                </div>
              </div>
                );
              })()}
            
             </motion.div>
           )}

          {activeTab === 'evaluasi' && (
            <motion.div 
              key="evaluasi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              <div className="bg-slate-800/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                    <TrendingUp className="text-teal-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-200">Monitoring & Evaluasi</h2>
                    <p className="text-sm text-slate-400">Ringkasan statistik dari rekaman memancing Anda</p>
                  </div>
                </div>

                {logs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
                    Belum ada data jurnal untuk dievaluasi.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700">
                      <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Total Tangkapan Tercatat</h3>
                      <p className="text-3xl sm:text-4xl font-black text-teal-400">{logs.length}</p>
                      <p className="text-xs text-slate-400 mt-2">Sesi memancing didokumentasikan</p>
                    </div>
                    
                    <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700">
                      <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Spesies Terbanyak</h3>
                      <p className="text-xl sm:text-2xl font-bold text-slate-200 capitalize">
                        {
                          Object.entries(
                            logs.reduce((acc, log) => {
                              if (log.species) {
                                acc[log.species.toLowerCase()] = (acc[log.species.toLowerCase()] || 0) + 1;
                              }
                              return acc;
                            }, {} as Record<string, number>)
                          ).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '-'
                        }
                      </p>
                      <p className="text-xs text-slate-400 mt-2">Paling sering ditangkap</p>
                    </div>

                    <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700 md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                       <div>
                         <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Lokasi Paling Produktif</h3>
                         <p className="text-lg sm:text-xl font-bold text-slate-200">
                          {
                            Object.entries(
                              logs.reduce((acc, log) => {
                                if (log.location) {
                                  acc[log.location] = (acc[log.location] || 0) + 1;
                                }
                                return acc;
                              }, {} as Record<string, number>)
                            ).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Belum Ada'
                          }
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Spot dengan riwayat tangkapan terbanyak</p>
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                         <MapPin className="text-amber-400" size={24} />
                       </div>
                    </div>

                    <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700 md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                       <div>
                         <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Umpan Paling Ampuh</h3>
                         <p className="text-lg sm:text-xl font-bold text-slate-200 capitalize">
                          {
                            Object.entries(
                              logs.reduce((acc, log) => {
                                if (log.bait) {
                                  acc[log.bait.toLowerCase()] = (acc[log.bait.toLowerCase()] || 0) + 1;
                                }
                                return acc;
                              }, {} as Record<string, number>)
                            ).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Belum Ada Data'
                          }
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Umpan yang paling sering menghasilkan tangkapan</p>
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                         <Fish className="text-orange-400" size={24} />
                       </div>
                    </div>

                    {(() => {
                      const catchByMonth = logs.reduce((acc, log) => {
                        const parts = log.date.split(' ');
                        if (parts.length >= 3) {
                          const month = parts[1] + ' ' + parts[2].replace(',', '');
                          acc[month] = (acc[month] || 0) + 1;
                        }
                        return acc;
                      }, {} as Record<string, number>);

                      const chartData = Object.entries(catchByMonth)
                        .map(([month, count]) => ({ month, count }))
                        .slice(-6);

                      return (
                        <div className="md:col-span-2 bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700 mt-4">
                           <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Grafik Tangkapan Terakhir</h3>
                           <div className="h-[250px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                 <XAxis dataKey="month" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                 <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                                 <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#2dd4bf' }} />
                                 <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                               </BarChart>
                             </ResponsiveContainer>
                           </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          )}

         </AnimatePresence>
      </main>
    </div>
  );
}

