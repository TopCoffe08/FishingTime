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
  { name: "Muara Sungai Barito", type: "Muara", lat: -3.4, lon: 114.4 },
  { name: "Sungai Mahakam", type: "Sungai", lat: -0.5, lon: 117.1 },
  { name: "Pantai Losari", type: "Pantai", lat: -5.1, lon: 119.4 },
  { name: "Pelabuhan Tanjung Priok", type: "Laut", lat: -6.1, lon: 106.8 }
];
