import axios from 'axios';
import * as SunCalc from 'suncalc';
import { TidePrediction, WeatherCondition, TideData, BMKGTideInfo, AnalysisResult, AnalysisFactor } from './types';
import { format, addHours, startOfHour } from 'date-fns';
import { PRESET_LOCATIONS } from './data';

export const BMKG_ATTRIBUTION = 'Sumber data pasang surut: BMKG';
const BMKG_PUBLIC_API = 'https://peta-maritim.bmkg.go.id/public_api/pelabuhan';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const BULAN_ID: Record<string, string> = {
  'Jan':'Jan','Feb':'Feb','Mar':'Mar','Apr':'Apr',
  'Mei':'May','Jun':'Jun','Jul':'Jul','Agu':'Aug',
  'Sep':'Sep','Okt':'Oct','Nov':'Nov','Des':'Dec'
};

function parseBMKGDate(timeStr: string): Date {
  try {
    const parts = timeStr.split(',');
    if (parts.length < 2) return new Date();
    const timePart = parts[1].trim().replace('.', ':');
    const dateParts = parts[0].trim().split(' ');
    if (dateParts.length < 3) return new Date();
    const day  = dateParts[0];
    const mon  = BULAN_ID[dateParts[1]] || dateParts[1];
    const year = dateParts[2].length === 2 ? '20' + dateParts[2] : dateParts[2];
    const result = new Date(`${day} ${mon} ${year} ${timePart} UTC`);
    return isNaN(result.getTime()) ? new Date() : result;
  } catch {
    return new Date();
  }
}

function parseWeatherCodeFromDesc(desc: string): number {
  const d = desc.toLowerCase();
  if (d.includes('cerah') && !d.includes('berawan')) return 0;
  if (d.includes('cerah berawan') || d.includes('berawan')) return 2;
  if (d.includes('berawan tebal')) return 3;
  if (d.includes('hujan ringan') || d.includes('gerimis')) return 61;
  if (d.includes('hujan sedang')) return 63;
  if (d.includes('hujan lebat')) return 65;
  if (d.includes('petir') || d.includes('badai guntur')) return 95;
  if (d.includes('kabut')) return 45;
  return 1; // default: partly cloudy
}

function windLabelToDeg(label: string): number {
  const map: Record<string, number> = {
    'Utara':0,'Timur Laut':45,'Timur':90,'Tenggara':135,
    'Selatan':180,'Barat Daya':225,'Barat':270,'Barat Laut':315
  };
  for (const [key, val] of Object.entries(map)) {
    if (label.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return 0;
}

export async function scrapeBMKGFromSlug(slug: string): Promise<{
  hourlyTide: TideData[],
  currentWeather: WeatherCondition | null
} | null> {
  try {
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://maritim.bmkg.go.id/cuaca/pelabuhan/${slug}`)}`;
    const res = await axios.get(url, { timeout: 15000 });
    const html = res.data;
    if (!html || typeof html !== 'string') return null;

    const tbodyMatch = html.match(/<tbody.*?<\/tbody>/gis);
    if (!tbodyMatch) {
      console.warn('BMKG: halaman dirender JS, scraping tidak berhasil. Fallback ke public API.');
      return null;
    }

    const tbody = tbodyMatch[0];
    const rows = tbody.split('<tr');
    rows.shift(); // remove first chunk (before first tr)

    const hourlyTide: TideData[] = [];
    let currentWeather: WeatherCondition | null = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Time: <div class="time-main"...>24 Jun 26, 00.00</div>
      const timeMatch = row.match(/<div class="time-main"[^>]*>([^<]+)<\/div>/);
      const tds = row.split(/<td/gis);
      if (!timeMatch || tds.length < 10) continue;
      
      const timeStr = timeMatch[1].trim(); // e.g. "24 Jun 26, 00.00"
      const dateObj = parseBMKGDate(timeStr);

      // Tide (Pasut): <span class="font-medium text-gray-900"...>-0.04 <span...
      const tideMatch = tds[9]?.match(/>([^<]+)<span class="text-gray-500/);
      let height = 0;
      if (tideMatch) {
        height = parseFloat(tideMatch[1].trim());
      }

      hourlyTide.push({
        time: dateObj,
        height: height
      });

      // Capture current weather from the first row that is close to NOW
      // Or just take the first row for now if currentWeather is null
      if (i === 0) {
        // Cuaca
        const weatherMatch = tds[2]?.match(/<span class="weather-text"[^>]*>([^<]+)<\/span>/);
        const desc = weatherMatch ? weatherMatch[1].trim() : 'Berawan';
        
        // Wind speed: <div class="font-medium text-sm sm:text-base"...>Barat Daya 4 kt</div>
        const windMatch = tds[3]?.match(/<div class="font-medium[^>]*>([^<]+) (\d+) kt<\/div>/);
        let windDirLabel = 'Selatan';
        let windSpeedKt = 0;
        if (windMatch) {
          windDirLabel = windMatch[1].trim();
          windSpeedKt = parseInt(windMatch[2].trim());
        } else {
           // alternate matching
           const altWindMatch = tds[3]?.match(/<div class="font-medium[^>]*>([^<]+)<\/div>/);
           if (altWindMatch) {
              const parts = altWindMatch[1].trim().split(' ');
              const ktIndex = parts.indexOf('kt');
              if(ktIndex > 0) {
                 windSpeedKt = parseInt(parts[ktIndex-1]);
                 windDirLabel = parts.slice(0, ktIndex-1).join(' ');
              }
           }
        }
        
        // Temp: 27 °C
        const tempMatch = tds[7]?.match(/>([^<]+)<span class="text-gray-500/);
        let temp = 28;
        if (tempMatch) {
          temp = parseInt(tempMatch[1].trim());
        }

        currentWeather = {
          temperature: temp,
          weatherCode: parseWeatherCodeFromDesc(desc),
          windSpeed: Math.round(windSpeedKt * 1.852), // convert kt to km/h
          windDirectionDeg: windLabelToDeg(windDirLabel),
          windDirectionLabel: windDirLabel,
          description: desc,
          dataSource: 'bmkg'
        };
      }
    }

    if (hourlyTide.length > 0) {
      return {
        hourlyTide,
        currentWeather
      };
    }

  } catch (err) {
    console.warn(`Gagal scrape BMKG pelabuhan ${slug}:`, err);
  }
  return null;
}
export async function fetchBMKGTide(bmkgCode: string): Promise<BMKGTideInfo | null> {
  try {
    const res = await axios.get(`${CORS_PROXY}${encodeURIComponent(BMKG_PUBLIC_API)}`, {
      timeout: 10000
    });

    if (!res.data) return null;

    const allPorts = Array.isArray(res.data) ? res.data : Object.values(res.data);
    const portData: any = allPorts.find((p: any) => p.Code === bmkgCode || p.code === bmkgCode);

    if (!portData) {
      console.warn(`BMKG: Kode pelabuhan ${bmkgCode} tidak ditemukan`);
      return null;
    }

    const latestData = Array.isArray(portData.data) ? portData.data[0] : portData;
    if (!latestData) return null;

    const parseTimeStr = (timeStr: string | undefined, referenceDate: Date = new Date()): Date => {
      if (!timeStr) return referenceDate;
      const match = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (!match) return referenceDate;
      const result = new Date(referenceDate);
      result.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
      return result;
    };

    const now = new Date();
    return {
      highTide: parseFloat(latestData.high_tide ?? latestData.High_tide ?? '0'),
      highTideTime: parseTimeStr(latestData.high_tide_time ?? latestData.High_tide_time, now),
      lowTide: parseFloat(latestData.low_tide ?? latestData.Low_tide ?? '0'),
      lowTideTime: parseTimeStr(latestData.low_tide_time ?? latestData.Low_tide_time, now),
      source: 'bmkg'
    };
  } catch (err) {
    console.warn('BMKG API gagal:', err);
    return null;
  }
}

export function generateAnchoredTideCurve(
  bmkgData: BMKGTideInfo,
  startHoursAgo: number = 48,
  totalHours: number = 216
): TideData[] {
  const { highTide, highTideTime, lowTide, lowTideTime } = bmkgData;
  const avgHeight = (highTide + lowTide) / 2;
  const anchorAmplitude = (highTide - lowTide) / 2;

  const highMs = highTideTime.getTime();

  // Perairan Indonesia umumnya semi-diurnal, periode utama (M2) sekitar 12 jam 25 menit (12.4206 jam)
  const SEMIDIURNAL_PERIOD_MS = 12.4206 * 3600000;
  const angularFreq = (2 * Math.PI) / SEMIDIURNAL_PERIOD_MS;
  const referenceMs = highMs;

  const now = new Date();
  const results: TideData[] = [];
  const startTime = new Date(now.getTime() - startHoursAgo * 3600000);

  // Dapatkan fase bulan pada saat anchor point
  const anchorIllumination = SunCalc.getMoonIllumination(highTideTime);
  const anchorMultiplier = 1 + 0.3 * Math.cos(anchorIllumination.phase * Math.PI * 2 * 2);
  
  // Normalisasi amplitude
  const baseAmplitude = anchorAmplitude / anchorMultiplier;

  for (let i = 0; i <= totalHours; i++) {
    const t = new Date(startTime.getTime() + i * 3600000);
    const dtMs = t.getTime() - referenceMs;
    
    // Perubahan spring-neap tide: skalar amplitude berdasarkan fase bulan harian
    const currentPhase = SunCalc.getMoonIllumination(t).phase;
    const currentMultiplier = 1 + 0.3 * Math.cos(currentPhase * Math.PI * 2 * 2);

    const h = avgHeight + (baseAmplitude * currentMultiplier) * Math.cos(angularFreq * dtMs);
    results.push({ time: t, height: parseFloat(h.toFixed(2)) });
  }

  return results;
}

function generateFallbackSineWave(moonPhase: number, baseTime: Date): TideData[] {
  const results: TideData[] = [];
  const baseHeight = 1.0;
  const SEMIDIURNAL_PERIOD_HR = 12.4206;
  const angularFreq = (2 * Math.PI) / SEMIDIURNAL_PERIOD_HR;

  const startOfDayTime = new Date(baseTime.getFullYear(), baseTime.getMonth(), baseTime.getDate());
  for (let i = -48; i < 168; i++) {
    const t = addHours(startOfDayTime, i);
    const currentPhase = SunCalc.getMoonIllumination(t).phase;
    const currentMultiplier = 1 + 0.3 * Math.cos(currentPhase * Math.PI * 2 * 2);
    
    // Offset agar waktu pasang tidak persis sama setiap harinya (efek pengunduran waktu pasang)
    const dtHours = t.getTime() / 3600000;
    const h = baseHeight + Math.sin(dtHours * angularFreq) * 1.5 * currentMultiplier;
    results.push({ time: t, height: Number(h.toFixed(2)) });
  }
  return results;
}

export async function fetchBMKGWeather(lat: number, lon: number): Promise<WeatherCondition | null> {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`https://api-apps.bmkg.go.id/api/cuaca?lon=${lon}&lat=${lat}`)}`;
    const res = await axios.get(url, { timeout: 10000 });
    
    if (res.data && res.data.data && res.data.data.length > 0 && res.data.data[0].cuaca) {
      const cuacaList = res.data.data[0].cuaca.flat();
      if (cuacaList.length > 0) {
        // Find closest to current time
        const nowMs = Date.now();
        let closest = cuacaList[0];
        let minDiff = Infinity;
        for (const item of cuacaList) {
           const diff = Math.abs(new Date(item.utc_datetime).getTime() - nowMs);
           if (diff < minDiff) {
             minDiff = diff;
             closest = item;
           }
        }
        
        return {
          temperature: closest.t,
          weatherCode: parseInt(closest.weather) || 1,
          windSpeed: closest.ws,
          windDirectionDeg: closest.wd_deg,
          windDirectionLabel: getWindDirectionLabel(closest.wd_deg),
          description: closest.weather_desc,
          dataSource: 'bmkg'
        };
      }
    }
    return null;
  } catch(e) {
    console.warn("BMKG Weather API failed:", e);
    return null;
  }
}

function getWeatherDescription(code: number): string {
  if (code === 0) return "Cerah";
  if (code > 0 && code <= 3) return "Berawan";
  if (code >= 45 && code <= 48) return "Berkabut";
  if (code >= 51 && code <= 67) return "Hujan Ringan/Gerimis";
  if (code >= 71 && code <= 77) return "Turun Salju";
  if (code >= 80 && code <= 82) return "Hujan Deras";
  if (code >= 95) return "Badai Petir";
  return "Tidak Diketahui";
}

function getWindDirectionLabel(deg: number): string {
  if (deg >= 337.5 || deg < 22.5) return "Utara";
  if (deg >= 22.5 && deg < 67.5) return "Timur Laut";
  if (deg >= 67.5 && deg < 112.5) return "Timur";
  if (deg >= 112.5 && deg < 157.5) return "Tenggara";
  if (deg >= 157.5 && deg < 202.5) return "Selatan";
  if (deg >= 202.5 && deg < 247.5) return "Barat Daya";
  if (deg >= 247.5 && deg < 292.5) return "Barat";
  if (deg >= 292.5 && deg < 337.5) return "Barat Laut";
  return "Tidak ada angin";
}

let cachedBMKGPorts: any[] | null = null;

async function getAllBMKGPorts(): Promise<any[]> {
  if (cachedBMKGPorts) return cachedBMKGPorts;
  try {
    const res = await axios.get(`${CORS_PROXY}${encodeURIComponent(BMKG_PUBLIC_API)}`, { timeout: 10000 });
    if (res.data) {
      cachedBMKGPorts = Array.isArray(res.data) ? res.data : Object.values(res.data);
      return cachedBMKGPorts || [];
    }
  } catch (err) {
    console.warn('Gagal cache BMKG ports:', err);
  }
  return [];
}

async function findClosestBMKG(lat: number, lon: number): Promise<{ code: string | null, slug: string | null }> {
  let closestCode: string | null = null;
  let closestSlug: string | null = null;
  let minDistance = Infinity;
  // Radius max untuk pencarian port BMKG terdekat dari preset (sekitar 2 derajat lat/lon ~ 200km)
  const MAX_DISTANCE = 2.0;

  for (const loc of PRESET_LOCATIONS) {
    if (loc.bmkgSlug || loc.bmkgCode) {
      const dist = Math.sqrt(Math.pow(loc.lat - lat, 2) + Math.pow(loc.lon - lon, 2));
      if (dist < minDistance && dist < MAX_DISTANCE) {
        minDistance = dist;
        closestCode = loc.bmkgCode || null;
        closestSlug = loc.bmkgSlug || null;
      }
    }
  }

  return { code: closestCode, slug: closestSlug };
}

export async function fetchTideAndWeather(lat: number, lon: number, bmkgCode?: string | null, bmkgSlug?: string | null): Promise<{
  tide: TidePrediction,
  weather: WeatherCondition,
  moonPhaseStr: string
}> {
  if (!bmkgCode && !bmkgSlug) {
    const closest = await findClosestBMKG(lat, lon);
    bmkgCode = closest.code;
    bmkgSlug = closest.slug;
  }

  // Fetch Weather and marine data from Open-Meteo
  // Marine API expects slightly different lat/lon sometimes but usually works near coast.
  const now = new Date();
  const startDate = format(addHours(now, -48), 'yyyy-MM-dd'); // 2 days ago
  const endDate = format(addHours(now, 24 * 7), 'yyyy-MM-dd'); // Next 7 days for prediction

  // Weather Request
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=sunrise,sunset&timezone=auto&start_date=${startDate}&end_date=${endDate}`;
  
  // Marine/Tide Request (Note: open-meteo marine api covers global oceans, might not be perfectly accurate for inland rivers, but good enough for demo)
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=sea_level&timezone=auto&start_date=${startDate}&end_date=${endDate}`;

  try {
    const [weatherRes, marineRes] = await Promise.all([
      axios.get(weatherUrl).catch(e => {
        console.warn("Weather API failed, using fallback generated data for demo", e);
        return { data: null };
      }),
      axios.get(marineUrl).catch(e => {
        console.warn("Marine API failed, using fallback generated data for demo", e);
        return { data: null };
      })
    ]);

    let weatherCond: WeatherCondition | null = await fetchBMKGWeather(lat, lon);
    if (!weatherCond) {
      const currentW = weatherRes.data?.current_weather || { temperature: 28, weathercode: 1, windspeed: 5, winddirection: 0 };
      weatherCond = {
        temperature: currentW.temperature,
        weatherCode: currentW.weathercode,
        windSpeed: currentW.windspeed,
        windDirectionDeg: currentW.winddirection,
        windDirectionLabel: currentW.winddirection !== undefined ? getWindDirectionLabel(currentW.winddirection) : undefined,
        description: getWeatherDescription(currentW.weathercode),
        dataSource: 'open-meteo'
      };
    }

    let hourlyData: TideData[] = [];
    let currentHeight = 0;
    let dailySolar: any[] = [];
    
    if (weatherRes.data && weatherRes.data.daily && weatherRes.data.daily.sunrise) {
      for(let i=0; i<weatherRes.data.daily.time.length; i++) {
        dailySolar.push({
          date: weatherRes.data.daily.time[i],
          sunrise: new Date(weatherRes.data.daily.sunrise[i]),
          sunset: new Date(weatherRes.data.daily.sunset[i])
        });
      }
    }
    
    // Real-time moon phase calculation using SunCalc
    const moonIllumination = SunCalc.getMoonIllumination(now);
    const phaseValue = moonIllumination.phase; // 0 to 1
    
    let moonPhaseStr = "Bulan Separuh";
    if (phaseValue >= 0.97 || phaseValue <= 0.03) {
      moonPhaseStr = "Bulan Baru (Gelap)";
    } else if (phaseValue > 0.03 && phaseValue < 0.22) {
      moonPhaseStr = "Sabit Awal";
    } else if (phaseValue >= 0.22 && phaseValue <= 0.28) {
      moonPhaseStr = "Kuartal Pertama";
    } else if (phaseValue > 0.28 && phaseValue < 0.47) {
      moonPhaseStr = "Cembung Awal";
    } else if (phaseValue >= 0.47 && phaseValue <= 0.53) {
      moonPhaseStr = "Bulan Purnama";
    } else if (phaseValue > 0.53 && phaseValue < 0.72) {
      moonPhaseStr = "Cembung Akhir";
    } else if (phaseValue >= 0.72 && phaseValue <= 0.78) {
      moonPhaseStr = "Kuartal Terakhir";
    } else if (phaseValue > 0.78 && phaseValue < 0.97) {
      moonPhaseStr = "Sabit Akhir";
    }

    let isFallback = false;
    let dataSource: 'marine-api' | 'bmkg' | 'estimated' = 'estimated';
    let bmkgTideInfo: BMKGTideInfo | null = null;

    const hasMarineData = marineRes.data 
      && marineRes.data.hourly 
      && marineRes.data.hourly.sea_level
      && marineRes.data.hourly.sea_level.some((v: number|null) => v !== null);

    if (bmkgCode) {
      if (bmkgSlug) {
        const scraped = await scrapeBMKGFromSlug(bmkgSlug);
        if (scraped) {
          dataSource = 'bmkg';
          hourlyData = scraped.hourlyTide;
          if (scraped.currentWeather) {
             weatherCond = scraped.currentWeather;
          }
        } else {
          bmkgTideInfo = await fetchBMKGTide(bmkgCode);
          if (bmkgTideInfo) {
            dataSource = 'bmkg';
            hourlyData = generateAnchoredTideCurve(bmkgTideInfo);
          }
        }
      } else {
        bmkgTideInfo = await fetchBMKGTide(bmkgCode);
        if (bmkgTideInfo) {
          dataSource = 'bmkg';
          hourlyData = generateAnchoredTideCurve(bmkgTideInfo);
        }
      }
    }

    if (dataSource === 'estimated' && hasMarineData) {
      dataSource = 'marine-api';
      const times = marineRes.data.hourly.time;
      const levels = marineRes.data.hourly.sea_level;
      
      for(let i = 0; i < times.length; i++) {
        if(levels[i] !== null) {
          hourlyData.push({
            time: new Date(times[i]),
            height: levels[i]
          });
        }
      }
    } else if (dataSource === 'estimated') {
      isFallback = true;
      hourlyData = generateFallbackSineWave(phaseValue, now);
    }

    // Determine current status
    let currentIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < hourlyData.length; i++) {
       const diff = Math.abs(hourlyData[i].time.getTime() - now.getTime());
       if (diff < minDiff) {
         minDiff = diff;
         currentIndex = i;
       }
    }
    
    let status: TidePrediction['status'] = "Pasang Naik";
    if (currentIndex >= 0 && currentIndex < hourlyData.length - 1) {
       currentHeight = hourlyData[currentIndex].height;
       const nextHeight = hourlyData[currentIndex+1].height;
       if (nextHeight > currentHeight + 0.02) {
         status = "Pasang Naik";
       } else if (nextHeight < currentHeight - 0.02) {
         status = "Pasang Turun";
       } else {
         // Sangat kecil perubahannya, anggap sedang di puncak (high tide) atau lembah (low tide)
         status = currentHeight > (hourlyData.reduce((acc, d) => acc + d.height, 0) / hourlyData.length) ? "Pasang Puncak" : "Surut";
       }
    } else if (hourlyData.length > 0) {
       currentHeight = hourlyData[hourlyData.length - 1].height;
    }

    // Find next high/low
    let nextHighTide: Date | null = null;
    let nextLowTide: Date | null = null;

    let isIteratingHigh = status === "Pasang Naik";
    for(let i=currentIndex; i<hourlyData.length - 1; i++) {
       if (isIteratingHigh && hourlyData[i].height > hourlyData[i+1].height) {
         nextHighTide = hourlyData[i].time;
         break;
       } else if (!isIteratingHigh && hourlyData[i].height < hourlyData[i+1].height) {
         nextLowTide = hourlyData[i].time;
         break;
       }
    }

    return {
      tide: {
        currentHeight,
        status: status! || 'Pasang Naik',
        nextHighTide,
        nextLowTide,
        hourlyData,
        dailySolar,
        isFallback,
        dataSource,
        bmkgHighTide: bmkgTideInfo
          ? { height: bmkgTideInfo.highTide, time: bmkgTideInfo.highTideTime }
          : null,
        bmkgLowTide: bmkgTideInfo
          ? { height: bmkgTideInfo.lowTide, time: bmkgTideInfo.lowTideTime }
          : null,
      },
      weather: weatherCond,
      moonPhaseStr
    };

  } catch (error) {
    console.error("Error fetching data", error);
    throw error;
  }
}

export async function fetchRecommendation(params: {
  location: string;
  tideData: TidePrediction;
  weatherData: WeatherCondition;
  moonPhaseStr: string;
  timeOfDay: string;
  logs?: Array<{notes: string, date: string, location: string}>;
  solunarData?: { major1: any, major2: any, minor1: any, minor2: any } | null;
  locationType?: string;
}) {
  let score = 40; // Base score
  let reasonParts: string[] = [];

  const now = new Date();
  
  const isSungai = ['Sungai', 'Anak Sungai'].includes(params.locationType || '');
  const isMuara  = params.locationType === 'Muara';
  const isLaut   = !isSungai && !isMuara;

  // 1. Tide condition analysis
  const status = params.tideData.status;
  const isRising = status === 'Pasang Naik';
  const isFalling = status === 'Pasang Turun';
  const isPeak = status === 'Pasang Puncak';
  const isLow = status === 'Surut';
  
  if (isSungai) {
    reasonParts.push("spot sungai tidak terpengaruh pasang surut laut, fokus pada arus sungai dan musim");
  } else {
    let tideScore = 0;
    if (isRising) {
      tideScore = 25;
      reasonParts.push("air pasang naik membawa banyak oksigen dan pergerakan makanan alami ke perairan dangkal");
    } else if (isFalling) {
      tideScore = 15;
      reasonParts.push("arus surut membawa nutrien kembali ke perairan yang lebih dalam, ideal untuk mancing di area dasar / muara");
    } else if (isPeak) {
      tideScore = 5;
      reasonParts.push("air sedang pasang puncak (stagnan sejenak), aktivitas ikan cenderung pasif");
    } else if (isLow) {
      tideScore = 5;
      reasonParts.push("air sedang surut terendah (stagnan), ikan umumnya menjauhi perairan dangkal");
    } else {
      reasonParts.push("pergerakan arus laut stabil yang mungkin membuat ikan kurang aktif bergerak");
    }

    if (isMuara) {
      score += tideScore * 0.5;
    } else {
      score += tideScore;
    }
  }

  // 2. Moon phase analysis using SunCalc for better logic
  const moonPhaseVal = SunCalc.getMoonIllumination(now).phase;
  // Moon phase: 0 (New), 0.25 (First Quarter), 0.5 (Full), 0.75 (Last Quarter)
  if (moonPhaseVal >= 0.95 || moonPhaseVal <= 0.05) {
    score += 20;
    reasonParts.push("masa bulan baru (pengaruh sentimen solunar yang kuat pada aktivitas ikan)");
  } else if (moonPhaseVal > 0.45 && moonPhaseVal < 0.55) {
    score += 18;
    reasonParts.push("bulan purnama dengan gravitasi maksimal memicu jam makan ikan yang agresif");
  } else {
    score += 8;
    reasonParts.push("fase bulan reguler tidak memberikan dorongan pasang surut yang signifikan");
  }

  // 2.5 Solunar analysis
  let solunarFactorDesc = "";
  let solunarFactorTitle = "";
  if (params.solunarData) {
    const isNowInPeriod = (period: any, date: Date): boolean => {
      if (!period || !period.start || !period.end) return false;
      return date >= period.start && date <= period.end;
    };
    
    const inMajor = isNowInPeriod(params.solunarData.major1, now) || isNowInPeriod(params.solunarData.major2, now);
    const inMinor = isNowInPeriod(params.solunarData.minor1, now) || isNowInPeriod(params.solunarData.minor2, now);
    
    // Check for 30 min pre-major
    let preMajor = false;
    if (!inMajor && !inMinor) {
      const checkPre = (period: any, date: Date) => {
        if (!period || !period.start) return false;
        const preStart = new Date(period.start.getTime() - 30 * 60000);
        return date >= preStart && date < period.start;
      };
      preMajor = checkPre(params.solunarData.major1, now) || checkPre(params.solunarData.major2, now);
    }

    if (inMajor) {
      score += 20;
      reasonParts.push("sedang dalam periode major solunar (transit bulan), waktu emas mancing");
      solunarFactorTitle = "Periode Solunar [Major]";
      solunarFactorDesc = "Bulan transit di atas atau di bawah (Major period). Ini adalah waktu emas mancing di mana aktivitas makan ikan sedang pada puncaknya.";
    } else if (inMinor) {
      score += 10;
      reasonParts.push("sedang dalam periode minor solunar (moonrise/moonset)");
      solunarFactorTitle = "Periode Solunar [Minor]";
      solunarFactorDesc = "Bulan sedang terbit atau terbenam (Minor period). Ada peningkatan aktivitas ikan meski tidak sebesar Major period.";
    } else if (preMajor) {
      score += 10;
      reasonParts.push("30 menit menuju periode major solunar, segera siapkan perlengkapan");
      solunarFactorTitle = "Periode Solunar [Pre-Major]";
      solunarFactorDesc = "30 menit sebelum periode Major dimulai. Ini saat yang tepat menyiapkan posisi, alat, dan umpan sebelum ikan agresif.";
    }
  }

  // 3. Time of day analysis
  const hour = parseInt(params.timeOfDay.split(':')[0] || '12', 10);
  let timeStr = "";
  if (hour >= 5 && hour < 10) timeStr = "pagi";
  else if (hour >= 10 && hour < 15) timeStr = "siang";
  else if (hour >= 15 && hour < 19) timeStr = "sore";
  else timeStr = "malam";

  if (isSungai) {
    if (timeStr === "pagi") {
      score += 20;
      reasonParts.push("pagi hari sangat ideal ketika suhu air mulai hangat dan fitoplankton naik");
    } else if (timeStr === "sore") {
      score += 15;
      reasonParts.push("sore menjelang senja merupakan jam aktif (feeding time) bagi mayoritas ikan target");
    } else if (timeStr === "malam") {
      score += 10;
      reasonParts.push("malam hari menargetkan ikan predator atau dasar (bottom fishing)");
    } else { // Siang
      score -= 5;
      reasonParts.push("suhu air panas di siang bolong sering membuat ikan berlindung ke perairan yang lebih dalam dan pasif");
    }
  } else {
    if (timeStr === "pagi") {
      score += 20;
      reasonParts.push("pagi hari sangat ideal ketika suhu air mulai hangat dan fitoplankton naik");
    } else if (timeStr === "sore") {
      score += 20;
      reasonParts.push("sore menjelang senja merupakan jam aktif (feeding time) bagi mayoritas ikan target");
    } else if (timeStr === "malam") {
      score += 15;
      reasonParts.push("malam hari menargetkan ikan predator atau dasar (bottom fishing)");
    } else { // Siang
      score -= 5;
      reasonParts.push("suhu air panas di siang bolong sering membuat ikan berlindung ke perairan yang lebih dalam dan pasif");
    }
  }

  // 4. Weather integration
  const temp = params.weatherData.temperature;
  let wind = typeof params.weatherData.windSpeed === 'number' ? params.weatherData.windSpeed : parseInt(params.weatherData.windSpeed || "0", 10);
  if (isNaN(wind)) wind = 0;
  
  const desc = params.weatherData.description.toLowerCase();

  if (desc.includes('hujan') && !desc.includes('petir') && !desc.includes('badai')) {
    score += 5;
    reasonParts.push("gerimis/hujan ringan mampu menambah oksigen dan membawa sisa makanan dari darat tanpa mengganggu jarak pandang di air");
  } else if (desc.includes('badai') || desc.includes('petir') || wind > 50) {
    score -= 30; // Very dangerous / poor fishing
    reasonParts.push("kondisi badai, angin kencang atau ombak tinggi sangat berbahaya dan merusak jarak pandang di dalam air");
  } else if (temp > 32) {
    score -= 5;
    reasonParts.push("suhu yang cukup terik membuat oksigen terlarut menurun");
  } else if (desc.includes('cerah')) {
    reasonParts.push("cuaca cerah / stabil mendukung jarak pandang di dalam air");
  }

  // 5. Logs bonus (up to +10)
  if (params.logs && params.logs.length > 0) {
    const locationLogs = params.logs.filter(l => l.location === params.location);
    if (locationLogs.length > 0) {
      score += Math.min(locationLogs.length * 2, 10);
      reasonParts.push("pola sejarah tangkapan menunjukkan rekam jejak keberhasilan pada spot ini");
    }
  }

  // Cap score between 10 and 100
  score = Math.max(10, Math.min(score, 100));

  let category = "";
  if (score >= 90) category = "Excellent 🌟";
  else if (score >= 75) category = "Sangat Bagus 🎣";
  else if (score >= 60) category = "Bagus 👍";
  else if (score >= 40) category = "Cukup ⚠️";
  else category = "Kurang Ideal 🌧️";

  // Create simple recommendation
  const primaryReason = reasonParts[0] ? reasonParts[0].charAt(0).toUpperCase() + reasonParts[0].slice(1) : "Kondisi standar";
  const secondaryReason = reasonParts[1] ? `, dan ${reasonParts[1]}` : "";
  const simpleRec = `Apakah sekarang waktu yang tepat untuk memancing di ${timeStr} hari ini?\nSkor: ${score}/100 (${category})\nAlasan Utama: ${primaryReason}${secondaryReason}.`;
  
  let weatherSourceStr = params.weatherData.dataSource === 'bmkg' ? 'BMKG' : 'Open-Meteo';
  let tideSourceStr = 'Estimasi Fallback';
  if (params.tideData.dataSource === 'bmkg') tideSourceStr = 'BMKG';
  else if (params.tideData.dataSource === 'marine-api') tideSourceStr = 'Open-Meteo Marine';

  let sourceLabel = `Cuaca: ${weatherSourceStr} | Pasang Surut: ${tideSourceStr}`;

  const factors: AnalysisFactor[] = [];

  // Tide reasoning
  if (isSungai) {
    factors.push({
      title: "Kondisi Air Sungai",
      description: "Di perairan sungai, faktor kunci adalah debit air, kejernihan, dan musim. Musim hujan membawa hanyutan pakan alami. Targetkan lubuk dan belokan sungai.",
      icon: "water"
    });
  } else {
    let muaraStr = isMuara ? " (Muara: pengaruh pasang 50% dikombinasi arus sungai)" : "";
    if (isRising) {
      factors.push({
        title: "Kondisi Air (Pasang Naik)",
        description: "Ini adalah waktu emas (golden hours). Pergerakan air membawa masuk pakan alami ke wilayah dangkal dan muara. Ikan target besar biasanya aktif menyergap mangsa." + muaraStr,
        icon: "water"
      });
    } else if (isFalling) {
      factors.push({
        title: "Kondisi Air (Pasang Turun)",
        description: "Saat air surut turun, ikan bermigrasi kembali menuju ke posisi yang lebih dalam (palung/drop off). Targetkan titik-titik tersebut atau mulut muara (estuary)." + muaraStr,
        icon: "water"
      });
    } else if (isPeak) {
      factors.push({
        title: "Kondisi Air (Pasang Puncak)",
        description: "Air masuk fase pasang puncak (Tenang). Ikan mungkin mengurangi intensitas makan karena ketiadaan arus. Teknik mancing dasar dengan umpan atraktif disarankan." + muaraStr,
        icon: "water"
      });
    } else if (isLow) {
      factors.push({
        title: "Kondisi Air (Surut Terendah)",
        description: "Air surut terendah (Tenang). Air surut maksimal biasanya membuat perairan muara keruh. Ikan berkumpul di luar batas drop off perairan dalam." + muaraStr,
        icon: "water"
      });
    } else {
      factors.push({
        title: "Kondisi Air (Stagnan)",
        description: "Jika arus terpantau lambat (neap tide), ikan akan cenderung diam (pasif). Disarankan menggunakan umpan hidup dan teknik dasar (bottom fishing) yang lambat." + muaraStr,
        icon: "water"
      });
    }
  }

  // Time reasoning
  if (timeStr === "pagi" || timeStr === "sore") {
    factors.push({
      title: "Faktor Waktu: Feeding Frenzy",
      description: `Secara biologis, ikan sangat aktif di ${timeStr} hari. Waktu ini berpapasan dengan intensitas matahari rendah, memicu ikan mendekati permukaan. Teknik casting sangat disarankan.`,
      icon: "clock"
    });
  } else if (timeStr === "malam") {
    factors.push({
      title: "Faktor Waktu: Nokturnal",
      description: "Malam hari bagus untuk target dasar (Kakap Merah, Kerapu) atau Cumi-cumi jika perairan terang.",
      icon: "clock"
    });
  } else {
    factors.push({
      title: "Faktor Waktu: Siang Bolong",
      description: "Sinar UV panas menembus ke dalam membuat ikan berlindung di bawah struktur (karang, rumpon, bakau) atau di kedalaman. Fokuskan lemparan umpan dekat struktur.",
      icon: "clock"
    });
  }

  // Weather reasoning
  if (desc.includes('hujan') && !desc.includes('petir') && !desc.includes('badai')) {
    factors.push({
      title: "Kondisi Cuaca (Gerimis/Hujan)",
      description: "Bagus untuk menyamarkan visibilitas bayangan pemancing, menambah suplai oksigen terlarut, dan menetralkan suhu permukaan air.",
      icon: "cloud"
    });
  } else if (desc.includes('badai') || desc.includes('petir') || wind > 50) {
    factors.push({
      title: "Kondisi Cuaca BURUK (Bahaya)",
      description: "PERINGATAN: Berpotensi membahayakan keselamatan. Tekanan udara drastis memang dapat membuat ikan agresif, namun sangat tidak disarankan untuk melaut.",
      icon: "cloud"
    });
  } else if (temp > 32) {
    factors.push({
      title: "Suhu Permukaan Cukup Panas",
      description: "Ikan akan turun ke tempat yang lebih dalam (thermocline). Gunakan umpan dasar atau deep diver lure.",
      icon: "cloud"
    });
  } else {
    factors.push({
      title: "Cuaca Bersahabat",
      description: "Cuaca stabil sangat mendukung visibilitas bawah air dan menstabilkan tekanan udara, memperbesar keberhasilan strike.",
      icon: "cloud"
    });
  }

  // Moon phase reasoning
  if (moonPhaseVal > 0.45 && moonPhaseVal < 0.55) {
    factors.push({
      title: "Fase Bulan Purnama",
      description: "Gravitasi maksimal bulan memicu pasang surut yang signifikan dan insting berburu malam hari (nokturnal) yang dahsyat.",
      icon: "moon"
    });
  } else if (moonPhaseVal >= 0.95 || moonPhaseVal <= 0.05) {
    factors.push({
      title: "Fase Bulan Mati (New Moon)",
      description: "Bulan gelap total memicu arus pasang surut (Spring Tide) yang kuat, sangat direkomendasikan untuk target pelagis besar.",
      icon: "moon"
    });
  }

  if (solunarFactorTitle) {
    factors.push({
      title: solunarFactorTitle,
      description: solunarFactorDesc,
      icon: "moon"
    });
  }

  if (wind > 35) {
    factors.push({
      title: "Peringatan Angin Kencang",
      description: `Angin cukup kuat (${wind} km/h) bisa menimbulkan hempasan ombak menyulitkan. Tetap berhati-hati dan cari spot terlindung dari arah angin (Leeward)!`,
      icon: "cloud"
    });
  }

  // Catch history pattern
  if (params.logs && params.logs.length > 0) {
    const locationLogs = params.logs.filter(l => l.location === params.location);
    if (locationLogs.length > 0) {
      factors.push({
        title: "Pola Tangkapan Historis",
        description: `Berdasarkan ${locationLogs.length} trip Anda sebelumnya di spot ini, kondisi yang ada memvalidasi keberhasilan historis Anda.`,
        icon: "history"
      });
    }
  }

  let conclusion = "";
  if (score >= 80) conclusion = "Kondisi sangat sempurna. Bersiaplah untuk sesi yang intens, targetkan ikan-ikan monster di area arus utama atau struktur potensial.";
  else if (score >= 60) conclusion = "Kondisi ideal. Perlu sedikit variasi dan eksplorasi titik potensial di perairan. Pastikan membawa umpan jenis cadangan.";
  else if (score >= 40) conclusion = "Kondisi 'Menunggu'. Ikan cenderung bersembunyi atau pasif. Saran: Bermain sangat sabar di kedalaman, gunakan umpan alami beraroma kuat.";
  else conclusion = "Kondisi sangat sulit. Sangat disarankan untuk beristirahat atau menyiapkan strategi jika memaksakan diri pergi.";

  return {
    score,
    category,
    reason: reasonParts.join('; '),
    simpleRec,
    overview: {
      location: params.location,
      timeStr: `${params.timeOfDay} (${timeStr.toUpperCase()})`,
      weather: `${params.weatherData.description} (${temp}°C), Angin ${wind} km/h`,
      tide: `${status} pada level ${params.tideData.currentHeight.toFixed(2)}m`,
      moon: params.moonPhaseStr,
      dataSource: sourceLabel
    },
    factors,
    conclusion
  };
}
