import { FishSpecies } from './types';

export const SPECIES_DB: FishSpecies[] = [
  {
    id: "s1",
    name: "Ikan Lais",
    type: "Ikan",
    habitat: ["Sungai", "Anak Sungai", "Muara"],
    activePhase: ["Pasang Naik", "Pasang Turun"],
    bait: "Udang kecil, Anakan ikan, Cacing",
    technique: "Casting, Dasaran ringan",
    imageFallback: "🐟"
  },
  {
    id: "s2",
    name: "Ikan Nila",
    type: "Ikan",
    habitat: ["Sungai", "Rawa", "Anak Sungai"],
    activePhase: ["Stabil", "Pasang Naik"],
    bait: "Cacing, Lumut, Pelet",
    technique: "Pelampung, Dasaran",
    imageFallback: "🐟"
  },
  {
    id: "s3",
    name: "Ikan Gabus (Haruan)",
    type: "Ikan",
    habitat: ["Rawa", "Anak Sungai"],
    activePhase: ["Pagi", "Sore", "Air Cenderung Surut"],
    bait: "Katak hidup, Umpan mainan (Soft frog)",
    technique: "Casting",
    imageFallback: "🐟"
  },
  {
    id: "s4",
    name: "Ikan Patin",
    type: "Ikan",
    habitat: ["Sungai"],
    activePhase: ["Malam", "Pasang Dalam"],
    bait: "Roti, Usus ayam, Cacing tanah",
    technique: "Dasaran berat",
    imageFallback: "🐟"
  },
  {
    id: "s5",
    name: "Ikan Puyau",
    type: "Ikan",
    habitat: ["Sungai", "Muara"],
    activePhase: ["Pasang Turun"],
    bait: "Cacing merah",
    technique: "Dasaran ringan",
    imageFallback: "🐟"
  },
  {
    id: "s6",
    name: "Udang Galah",
    type: "Udang",
    habitat: ["Sungai", "Muara"],
    activePhase: ["Arus Lemah", "Surut"],
    bait: "Cacing, Potongan kelapa bakar, Pelet",
    technique: "Pancing udang khusus (Hook kecil)",
    imageFallback: "🦐"
  },
  {
    id: "s7",
    name: "Udang Sungai / Kali",
    type: "Udang",
    habitat: ["Anak Sungai", "Sungai"],
    activePhase: ["Surut"],
    bait: "Cacing sawah",
    technique: "Pancing ringan di pinggiran",
    imageFallback: "🦐"
  }
];

export const PRESET_LOCATIONS = [
  { name: "Sungai Mahakam, Samarinda", type: "Sungai", lat: -0.50, lon: 117.15 },
  { name: "Pantai Manggar, Balikpapan", type: "Pantai", lat: -1.22, lon: 116.92 },
  { name: "Muara Teluk Balikpapan", type: "Muara", lat: -1.20, lon: 116.75 },
  { name: "Danau Jempang, Kukar", type: "Rawa", lat: -0.51, lon: 116.15 },
  { name: "Sungai Kelay, Berau", type: "Sungai", lat: 2.10, lon: 117.50 },
  { name: "Pantai Lamaru", type: "Pantai", lat: -1.18, lon: 116.95 }
];
