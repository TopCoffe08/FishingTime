import React, { useState, useEffect, useRef } from 'react';
import { fetchTideAndWeather, fetchRecommendation } from './api';
import { PRESET_LOCATIONS, SPECIES_DB } from './data';
import { FishingLocation, TidePrediction, WeatherCondition, CatchRecord, AnalysisResult, TideData } from './types';
import { format, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { MapPin, Droplets, BookOpen, Fish, TrendingUp, AlertCircle, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import localforage from 'localforage';
import * as SunCalc from 'suncalc';
import { calculateSolunarData, SolunarDayData, SolunarPeriod } from './solunar';
import { DashboardTab } from './components/tabs/DashboardTab';
import { SpeciesTab } from './components/tabs/SpeciesTab';
import { LogTab } from './components/tabs/LogTab';
import { EvaluasiTab } from './components/tabs/EvaluasiTab';

localforage.config({
  name: 'FishingTime',
  storeName: 'logs_store'
});

export default function App() {
  const [location, setLocation] = useState<FishingLocation>(PRESET_LOCATIONS[0]);
  const [tide, setTide] = useState<TidePrediction | null>(null);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [moonPhase, setMoonPhase] = useState<string>('');
  const [scoreRec, setScoreRec] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission().then((res) => {
          setNotifEnabled(res === 'granted');
        });
      }, 5000);
    }
  }, []);

  const [now, setNow] = useState(new Date());
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0);
  const displayedDate = addDays(now, selectedDateOffset);
  const solunar = React.useMemo(() => {
    return calculateSolunarData(displayedDate, location.lat, location.lon);
  }, [displayedDate.getDate(), displayedDate.getMonth(), location.lat, location.lon]);
  
  const futureTideSummary = React.useMemo(() => {
    if (!tide || !tide.hourlyData || tide.hourlyData.length === 0) return [];
    
    const daysMap = new Map<string, TideData[]>();
    tide.hourlyData.forEach(d => {
      const dayStr = format(d.time, 'yyyy-MM-dd');
      if (!daysMap.has(dayStr)) daysMap.set(dayStr, []);
      daysMap.get(dayStr)!.push(d);
    });

    const summary = [];
    const todayStr = format(now, 'yyyy-MM-dd');
    
    for (const [dayStr, dayData] of Array.from(daysMap.entries())) {
      if (dayStr < todayStr) continue;
      if (summary.length >= 7) break;

      const minTide = Math.min(...dayData.map(d => d.height));
      const maxTide = Math.max(...dayData.map(d => d.height));
      const noonTime = new Date(dayData[Math.floor(dayData.length/2)].time);
      const moonIllumination = SunCalc.getMoonIllumination(noonTime);
      const phaseValue = moonIllumination.phase;

      let indikatorArus = "Arus Sedang";
      let warnaArus = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      let iconArus = "Sedang";
      
      if ((phaseValue >= 0.90 || phaseValue <= 0.10) || (phaseValue >= 0.40 && phaseValue <= 0.60)) {
          indikatorArus = "Pasang Besar (Kuat)";
          warnaArus = "text-rose-400 bg-rose-500/10 border-rose-500/20";
          iconArus = "Kuat";
      } else if ((phaseValue > 0.15 && phaseValue < 0.35) || (phaseValue > 0.65 && phaseValue < 0.85)) {
          indikatorArus = "Pasang Mati (Lemah)";
          warnaArus = "text-sky-400 bg-sky-500/10 border-sky-500/20";
          iconArus = "Lemah";
      }

      const extremes: {type: 'High' | 'Low', time: Date, height: number}[] = [];
      for (let i = 1; i < dayData.length - 1; i++) {
         const prev = dayData[i-1].height;
         const curr = dayData[i].height;
         const next = dayData[i+1].height;
         
         if (curr > prev && curr > next) {
             extremes.push({ type: 'High', time: dayData[i].time, height: curr });
         } else if (curr < prev && curr < next) {
             extremes.push({ type: 'Low', time: dayData[i].time, height: curr });
         }
      }
      
      let highPoints = extremes.filter(e => e.type === 'High').slice(0, 2);
      let lowPoints = extremes.filter(e => e.type === 'Low').slice(0, 2);

      if (highPoints.length === 0 && dayData.length > 0) {
        const maxData = dayData.reduce((prev, curr) => (prev.height > curr.height) ? prev : curr);
        highPoints.push({ type: 'High', time: maxData.time, height: maxData.height });
      }
      if (lowPoints.length === 0 && dayData.length > 0) {
        const minData = dayData.reduce((prev, curr) => (prev.height < curr.height) ? prev : curr);
        lowPoints.push({ type: 'Low', time: minData.time, height: minData.height });
      }

      summary.push({
        dateStr: format(new Date(dayStr), 'EEEE, dd MMM', { locale: idLocale }),
        minTide,
        maxTide,
        indikatorArus,
        warnaArus,
        highPoints,
        lowPoints
      });
    }
    return summary;
  }, [tide, now]);

  const recommendedSpecies = React.useMemo(() => {
    const exactMatches = SPECIES_DB.filter(s => s.locations?.includes(location.name));
    if (exactMatches.length > 0) return exactMatches;
    let fallbackType = location.type;
    if (fallbackType === 'Perairan/GPS' || fallbackType === 'Custom') fallbackType = 'Laut';
    return SPECIES_DB.filter(s => s.habitat.includes(fallbackType));
  }, [location.name, location.type]);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'species' | 'log' | 'evaluasi'>('dashboard');
  const [isAnalisaExpanded, setIsAnalisaExpanded] = useState(false);

  const [logs, setLogs] = useState<CatchRecord[]>([]);
  const logsRef = useRef<CatchRecord[]>([]);
  const [isLogsLoaded, setIsLogsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

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

  const loadExternalData = React.useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { tide, weather, moonPhaseStr } = await fetchTideAndWeather(location.lat, location.lon, location.bmkgCode, location.bmkgSlug);
      setTide(tide);
      setWeather(weather);
      setMoonPhase(moonPhaseStr);
    } catch (err) {
      console.error(err);
      setFetchError('Gagal memuat data cuaca dan pasang surut. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  }, [location.lat, location.lon, location.bmkgCode, location.bmkgSlug]);

  useEffect(() => {
    loadExternalData();
  }, [loadExternalData]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!solunar) return;
    
    const timers: ReturnType<typeof setTimeout>[] = [];
    const nowMs = Date.now();
    const ADVANCE_MS = 15 * 60 * 1000; // 15 menit sebelumnya
    
    const scheduleNotif = (period: SolunarPeriod | null, label: string) => {
      if (!period) return;
      const delay = period.start.getTime() - ADVANCE_MS - nowMs;
      if (delay <= 0 || delay > 12 * 3600 * 1000) return; // hanya dalam 12 jam ke depan
      
      const t = setTimeout(() => {
        new Notification('🎣 FishingTime — ' + label, {
          body: `Periode ${label} dimulai pukul ${format(period.start, 'HH:mm')}. Siapkan perlengkapan!`,
          icon: '/icon.svg',
          tag: 'solunar-' + period.start.getTime(), // mencegah duplikat
        });
      }, delay);
      timers.push(t);
    };
    
    scheduleNotif(solunar.major1, 'Major Solunar');
    scheduleNotif(solunar.major2, 'Major Solunar');
    scheduleNotif(solunar.minor1, 'Minor Solunar');
    scheduleNotif(solunar.minor2, 'Minor Solunar');
    
    return () => timers.forEach(clearTimeout);
  }, [solunar]);

  const handleToggleNotif = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser Anda tidak mendukung notifikasi.');
      return;
    }
    if (Notification.permission === 'granted') {
      alert('Untuk menonaktifkan, buka Settings browser > Notifikasi > FishingTime');
    } else {
      const result = await Notification.requestPermission();
      setNotifEnabled(result === 'granted');
    }
  };

  useEffect(() => {
    async function updateRecommendation() {
      if (!tide || !weather || !moonPhase) return;
      try {
        const rec = await fetchRecommendation({
          location: location.name,
          tideData: tide,
          weatherData: weather,
          moonPhaseStr: moonPhase,
          timeOfDay: format(new Date(), 'HH:mm'),
          logs: logsRef.current,
          solunarData: solunar,
          locationType: location.type
        });
        setScoreRec(rec);
      } catch (err) {
        console.error(err);
      }
    }
    
    updateRecommendation();
  }, [location.name, location.type, tide, weather, moonPhase, solunar]);

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
            <button
              onClick={handleToggleNotif}
              className={`p-2 rounded-xl transition border ${notifEnabled ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'}`}
              title={notifEnabled ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi'}
            >
              {notifEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
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
        {/* Error Banner */}
        <AnimatePresence>
          {fetchError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-3xl flex flex-col sm:flex-row items-center gap-4 justify-between shadow-lg mb-6"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{fetchError}</span>
              </div>
              <button 
                onClick={() => { setFetchError(null); loadExternalData(); }}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
              >
                Coba Lagi
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
            <DashboardTab
              location={location}
              setLocation={setLocation}
              locationSearch={locationSearch}
              setLocationSearch={setLocationSearch}
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              handleMapClick={handleMapClick}
              isLocating={isLocating}
              setIsLocating={setIsLocating}
              isLoading={isLoading}
              tide={tide}
              weather={weather}
              moonPhase={moonPhase}
              scoreRec={scoreRec}
              isAnalisaExpanded={isAnalisaExpanded}
              setIsAnalisaExpanded={setIsAnalisaExpanded}
              isOnline={isOnline}
              now={now}
              selectedDateOffset={selectedDateOffset}
              setSelectedDateOffset={setSelectedDateOffset}
              displayedDate={displayedDate}
              solunar={solunar}
              futureTideSummary={futureTideSummary}
            />
          )}

          {activeTab === 'species' && (
            <SpeciesTab location={location} recommendedSpecies={recommendedSpecies} />
          )}

          {activeTab === 'log' && (
            <LogTab logs={logs} setLogs={setLogs} location={location} weather={weather} tide={tide} />
          )}

          {activeTab === 'evaluasi' && (
            <EvaluasiTab logs={logs} />
          )}
         </AnimatePresence>
      </main>
    </div>
  );
}