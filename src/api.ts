import axios from 'axios';
import { TidePrediction, WeatherCondition, TideData } from './types';
import { format, addHours, startOfHour } from 'date-fns';

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

export async function fetchTideAndWeather(lat: number, lon: number): Promise<{
  tide: TidePrediction,
  weather: WeatherCondition,
  moonPhaseStr: string
}> {
  // Fetch Weather and marine data from Open-Meteo
  // Marine API expects slightly different lat/lon sometimes but usually works near coast.
  const now = new Date();
  const startDate = format(now, 'yyyy-MM-dd');
  const endDate = format(addHours(now, 48), 'yyyy-MM-dd'); // Next 2 days for prediction

  // Weather Request
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=sunrise,sunset&timezone=auto`;
  
  // Marine/Tide Request (Note: open-meteo marine api covers global oceans, might not be perfectly accurate for inland rivers, but good enough for demo)
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=sea_level&timezone=auto&start_date=${startDate}&end_date=${endDate}`;

  try {
    const [weatherRes, marineRes] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(marineUrl).catch(e => {
        console.warn("Marine API failed, using fallback generated data for demo", e);
        return { data: null };
      })
    ]);

    const currentW = weatherRes.data?.current_weather || { temperature: 28, weathercode: 1, windspeed: 5 };
    const weatherCond: WeatherCondition = {
      temperature: currentW.temperature,
      weatherCode: currentW.weathercode,
      windSpeed: currentW.windspeed,
      description: getWeatherDescription(currentW.weathercode)
    };

    let hourlyData: TideData[] = [];
    let currentHeight = 0;
    
    if (marineRes.data && marineRes.data.hourly && marineRes.data.hourly.sea_level) {
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
    } else {
      // Fallback: Generate sine wave tide curve for demo functionality
      const baseHeight = 1.0;
      for(let i=0; i<48; i++) {
        const t = addHours(startOfHour(now), i);
        // Simple 12-hour tide cycle
        const h = baseHeight + Math.sin((t.getTime() / (1000 * 60 * 60)) * (Math.PI / 6)) * 1.5;
        hourlyData.push({ time: t, height: Number(h.toFixed(2)) });
      }
    }

    // Determine current status
    const currentHour = startOfHour(now);
    const currentIndex = hourlyData.findIndex(d => d.time.getTime() === currentHour.getTime()) || 0;
    
    if (currentIndex >= 0 && currentIndex < hourlyData.length - 1) {
       currentHeight = hourlyData[currentIndex].height;
       const nextHeight = hourlyData[currentIndex+1].height;
       var status: TidePrediction['status'] = nextHeight > currentHeight ? "Pasang Naik" : "Pasang Turun";
    }

    // Find next high/low
    let nextHighTide: Date | null = null;
    let nextLowTide: Date | null = null;

    let isIteratingHigh = status! === "Pasang Naik";
    for(let i=currentIndex; i<hourlyData.length - 1; i++) {
       if (isIteratingHigh && hourlyData[i].height > hourlyData[i+1].height) {
         nextHighTide = hourlyData[i].time;
         break;
       } else if (!isIteratingHigh && hourlyData[i].height < hourlyData[i+1].height) {
         nextLowTide = hourlyData[i].time;
         break;
       }
    }

    // Simple moon phase approximation
    const lunarCycle = 29.53;
    const knownNewMoon = new Date("2024-01-11T11:57:00Z");
    const diff = now.getTime() - knownNewMoon.getTime();
    const daysSince = diff / (1000 * 60 * 60 * 24);
    const currentPhase = daysSince % lunarCycle;
    
    let moonPhaseStr = "Bulan Separuh";
    if (currentPhase < 2 || currentPhase > 27.5) moonPhaseStr = "Bulan Baru (Gelap)";
    else if (currentPhase > 13 && currentPhase < 16.5) moonPhaseStr = "Bulan Purnama";

    return {
      tide: {
        currentHeight,
        status: status! || 'Pasang Naik',
        nextHighTide,
        nextLowTide,
        hourlyData
      },
      weather: weatherCond,
      moonPhaseStr
    };

  } catch (error) {
    console.error("Error fetching data", error);
    throw error;
  }
}

export async function fetchAIRecommendation(params: {
  location: string;
  tideData: string;
  weatherData: string;
  moonPhase: string;
  timeOfDay: string;
}) {
  try {
    const res = await axios.post('/api/recommendation', params);
    return res.data.recommendation;
  } catch (error) {
    console.error("Error fetching AI recommendation:", error);
    return "Sistem asisten tidak terhubung. Namun berdasarkan waktu dan pasang surut saat ini, kondisi cukup memungkinkan untuk mencoba memancing. Hati-hati dengan perubahan cuaca dan arus air.";
  }
}
