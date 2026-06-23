export interface BMKGTideInfo {
  highTide: number;
  highTideTime: Date;
  lowTide: number;
  lowTideTime: Date;
  source: 'bmkg';
}

export interface FishingLocation {
  name: string;
  type: string;
  lat: number;
  lon: number;
  bmkgCode?: string | null;
  bmkgSlug?: string | null;
  targets?: string;
  conditions?: string;
  bait?: string;
}

export interface TideData {
  time: Date;
  height: number;
  type?: 'High' | 'Low';
}

export interface DailySolarData {
  date: string;
  sunrise: Date;
  sunset: Date;
}

export interface TidePrediction {
  currentHeight: number;
  status: 'Pasang Naik' | 'Pasang Turun' | 'Surut' | 'Pasang Puncak';
  nextHighTide: Date | null;
  nextLowTide: Date | null;
  hourlyData: TideData[];
  dailySolar?: DailySolarData[];
  isFallback?: boolean;
  dataSource?: 'marine-api' | 'bmkg' | 'estimated';
  bmkgHighTide?: { height: number; time: Date } | null;
  bmkgLowTide?: { height: number; time: Date } | null;
}

export interface WeatherCondition {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  windDirectionDeg?: number;
  windDirectionLabel?: string;
  description: string;
  dataSource?: 'bmkg' | 'open-meteo';
}

export interface FishSpecies {
  id: string;
  name: string;
  type: 'Ikan' | 'Udang' | 'Cumi' | 'Kepiting';
  habitat: string[];
  locations?: string[]; 
  activePhase: string[]; // e.g. "Pasang Naik", "Surut"
  bait: string;
  technique: string;
  imageFallback: string;
}

export interface CatchRecord {
  id: string;
  notes: string;
  date: string;
  location: string;
  photoUrl?: string;
  species?: string;
  weight?: number;
  length?: number;
  bait?: string;
  weatherCondition?: string;
  tideCondition?: string;
}

export interface AnalysisFactor {
  title: string;
  description: string;
  icon: 'water' | 'moon' | 'cloud' | 'clock' | 'history';
}

export interface AnalysisResult {
  score: number;
  category: string;
  reason: string;
  simpleRec: string;
  overview: {
    location: string;
    timeStr: string;
    weather: string;
    tide: string;
    moon: string;
    dataSource: string;
  };
  factors: AnalysisFactor[];
  conclusion: string;
}