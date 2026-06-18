export interface FishingLocation {
  name: string;
  type: 'Sungai' | 'Anak Sungai' | 'Muara' | 'Pantai' | 'Laut' | 'Rawa';
  lat: number;
  lon: number;
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
}

export interface WeatherCondition {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  description: string;
}

export interface FishSpecies {
  id: string;
  name: string;
  type: 'Ikan' | 'Udang';
  habitat: string[];
  activePhase: string[]; // e.g. "Pasang Naik", "Surut"
  bait: string;
  technique: string;
  imageFallback: string;
}

export interface CatchRecord {
  id: string;
  date: Date;
  locationName: string;
  weather: string;
  tideCondition: string;
  bait: string;
  species: string;
  weight: number; // in kg
}
