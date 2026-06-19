import * as SunCalc from 'suncalc';
import { addMinutes, startOfDay } from 'date-fns';

export interface SolunarPeriod {
  start: Date;
  end: Date;
  type: 'Major' | 'Minor';
  peak: Date;
}

export interface SolunarDayData {
  date: Date;
  major1: SolunarPeriod | null;
  major2: SolunarPeriod | null;
  minor1: SolunarPeriod | null;
  minor2: SolunarPeriod | null;
  moonPhase: number;
}

export function calculateSolunarData(date: Date, lat: number, lon: number): SolunarDayData {
  const dayStart = startOfDay(date);
  const scanStart = addMinutes(dayStart, -12 * 60); // 12 hours before
  const scanEnd = addMinutes(dayStart, 36 * 60);   // 36 hours after (total 48h)
  
  const points = [];
  for (let i = 0; i <= 48 * 60; i += 5) {
    const t = addMinutes(scanStart, i);
    const pos = SunCalc.getMoonPosition(t, lat, lon);
    points.push({ time: t, alt: pos.altitude });
  }

  const majors: Date[] = [];
  const minors: Date[] = []; // Actually moonrise/set are better from getMoonTimes, but let's stick to true transit extrema for Majors

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1].alt;
    const curr = points[i].alt;
    const next = points[i + 1].alt;

    // Local maximum (Upper Transit) or Local minimum (Lower Transit)
    if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
      // Check if it falls strictly on the target day
      if (points[i].time >= dayStart && points[i].time < addMinutes(dayStart, 24 * 60)) {
        majors.push(points[i].time);
      }
    }
  }

  // Calculate moonrise and moonset explicitly for Minors
  const moonTimes = SunCalc.getMoonTimes(date, lat, lon);
  
  const createPeriod = (peak: Date | null, durationMinutes: number, type: 'Major'|'Minor'): SolunarPeriod | null => {
    if (!peak) return null;
    return {
      peak,
      start: addMinutes(peak, -durationMinutes / 2),
      end: addMinutes(peak, durationMinutes / 2),
      type
    };
  };

  const major1 = majors.length > 0 ? createPeriod(majors[0], 120, 'Major') : null;
  const major2 = majors.length > 1 ? createPeriod(majors[1], 120, 'Major') : null;

  // Minor periods around moonrise and moonset - roughly 1.5 hours each
  const minor1 = moonTimes.rise ? createPeriod(moonTimes.rise, 90, 'Minor') : null;
  const minor2 = moonTimes.set ? createPeriod(moonTimes.set, 90, 'Minor') : null;

  const phase = SunCalc.getMoonIllumination(dayStart).phase;

  return {
    date: dayStart,
    major1,
    major2,
    minor1,
    minor2,
    moonPhase: phase
  };
}
