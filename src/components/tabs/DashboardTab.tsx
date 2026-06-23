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
import { FishingLocation, TidePrediction, WeatherCondition, ScoreRecommendation } from '../../types';
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
  scoreRec: ScoreRecommendation | null;
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
            
            {/* 7-Day Tide Summary Table */}
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
            </>
          ) : null}
      </div>
    </motion.div>
  );
};
