import React from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, CheckCircle2, Info, Droplets, Moon, Wind, Clock, 
  Activity, Thermometer, Compass, Fish, Calendar, TrendingUp 
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { LocationMap } from '../LocationMap';
import { TideChart } from '../TideChart';
import { FishingScoreCard } from '../FishingScoreCard';
import { WeatherCard } from '../WeatherCard';
import { SolunarTable } from '../SolunarTable';
import { FutureTideSummary } from '../FutureTideSummary';
import { FishingLocation, TidePrediction, WeatherCondition, AnalysisResult } from '../../types';
import { PRESET_LOCATIONS } from '../../data';

interface DashboardTabProps {
  location: FishingLocation;
  setLocation: (loc: FishingLocation) => void;
  locationSearch: string;
  setLocationSearch: (val: string) => void;
  searchResults: any[];
  setSearchResults: (results: any[]) => void;
  handleMapClick: (lat: number, lon: number) => Promise<void>;
  isLocating: boolean;
  setIsLocating: (val: boolean) => void;
  isLoading: boolean;
  tide: TidePrediction | null;
  weather: WeatherCondition | null;
  moonPhase: string;
  scoreRec: AnalysisResult | null;
  isAnalisaExpanded: boolean;
  setIsAnalisaExpanded: (val: boolean) => void;
  isOnline: boolean;
  now: Date;
  selectedDateOffset: number;
  setSelectedDateOffset: (val: number) => void;
  displayedDate: Date;
  solunar: any;
  futureTideSummary: any[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  location,
  setLocation,
  locationSearch,
  setLocationSearch,
  searchResults,
  setSearchResults,
  handleMapClick,
  isLocating,
  setIsLocating,
  isLoading,
  tide,
  weather,
  moonPhase,
  scoreRec,
  isAnalisaExpanded,
  setIsAnalisaExpanded,
  isOnline,
  now,
  selectedDateOffset,
  setSelectedDateOffset,
  displayedDate,
  solunar,
  futureTideSummary
}) => {
  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 min-h-[500px]"
    >
      {/* LEFT COLUMN (WIDGETS & SCORE) */}
      <div className="lg:col-span-5 flex flex-col gap-6 md:gap-8">
        
        {/* Dynamic Headers & Location Selector */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800/50 p-5 md:p-6 rounded-[2rem] border border-slate-700/50 relative overflow-visible shadow-lg">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block flex items-center gap-2">
              <MapPin size={12} className="text-teal-400" /> Pilih Lokasi Memancing
            </label>
            <div className="flex gap-2 md:gap-3 mb-3">
              <div className="relative flex-1 z-50">
                <input 
                  type="text"
                  placeholder="Cari desa/kecamatan..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full h-10 md:h-12 bg-slate-900/60 border border-slate-700/50 text-slate-100 text-xs sm:text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 outline-none placeholder-slate-600 transition-all"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-slate-700">
                    {searchResults.map((res: any, idx) => (
                      <button 
                        key={idx}
                        className="w-full text-left px-4 py-3 hover:bg-slate-700 text-xs sm:text-sm text-slate-300 transition-colors truncate"
                        onClick={() => {
                          const locName = res.name || res.address?.village || res.address?.town || res.address?.city || res.display_name.split(',')[0];
                          setLocation({ name: locName, type: "Perairan/GPS", lat: parseFloat(res.lat), lon: parseFloat(res.lon) });
                          setLocationSearch('');
                          setSearchResults([]);
                        }}
                      >
                        {res.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={() => {
                  if (navigator.geolocation) {
                    setIsLocating(true);
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        const { latitude, longitude } = pos.coords;
                        try {
                          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                          if (geoRes.ok) {
                            const geoData = await geoRes.json();
                            const locName = geoData.address?.village || geoData.address?.town || geoData.address?.city || geoData.address?.county || geoData.address?.state || "Lokasi Anda";
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
                      },
                      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                    );
                  } else {
                    alert("Browser Anda tidak mendukung GPS.");
                  }
                }}
                disabled={isLocating}
                className={`flex items-center justify-center shrink-0 w-10 h-10 md:w-12 md:h-12 bg-slate-900/60 text-teal-400 rounded-xl border border-slate-700/50 transition-colors ${isLocating ? 'opacity-50 cursor-wait' : 'hover:bg-slate-800'}`}
                title="Deteksi Lokasi Saya"
              >
                {isLocating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
                ) : (
                  <MapPin size={16} />
                )}
              </button>
            </div>
            <div className="relative">
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
          </div>
        </div>

        {isLoading ? (
          <div className="bg-slate-800/30 rounded-[2.5rem] border border-slate-700/50 p-6 flex flex-col flex-1 items-center justify-center text-teal-500/50 min-h-[300px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mb-4"></div>
            <p className="font-bold tracking-tight text-sm">Menganalisa kondisi...</p>
          </div>
        ) : tide && weather ? (
          <>
            <FishingScoreCard 
              scoreRec={scoreRec} 
              isAnalisaExpanded={isAnalisaExpanded} 
              setIsAnalisaExpanded={setIsAnalisaExpanded} 
            />

            <WeatherCard weather={weather} moonPhase={moonPhase} isOnline={isOnline} />
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
            <SolunarTable solunar={solunar} displayedDate={displayedDate} />
            
            {/* 7-Day Tide Summary Table */}
            <FutureTideSummary futureTideSummary={futureTideSummary} />
            </>
          ) : null}
      </div>
    </motion.div>
  );
};
