import { FishSpecies, FishingLocation } from './types';

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

export const PRESET_LOCATIONS: FishingLocation[] = [
  { name: "Sungai Mahakam", type: "Sungai", lat: -0.509420, lon: 117.126430, bmkgCode: null, bmkgSlug: null },
  { name: "Muara Pegah", type: "Muara", lat: -0.909850, lon: 117.262150, bmkgCode: null, bmkgSlug: null },
  { name: "Muara Sanga-Sanga", type: "Muara", lat: -0.592140, lon: 117.289450, bmkgCode: null, bmkgSlug: null },
  { name: "Muara Berau", type: "Muara", lat: -0.218500, lon: 117.531100, bmkgCode: null, bmkgSlug: null },
  { name: "Karang Mumus", type: "Anak Sungai", lat: -0.505280, lon: 117.152420, bmkgCode: null, bmkgSlug: null },
  
  { name: "Teluk Balikpapan", type: "Laut", lat: -1.218450, lon: 116.808900, bmkgCode: 'XY004', bmkgSlug: 'pelabuhan-kariangau-balikpapan' },
  { name: "Muara Manggar", type: "Muara", lat: -1.205800, lon: 116.936200, bmkgCode: 'XY004', bmkgSlug: 'pelabuhan-kariangau-balikpapan' },
  { name: "Pantai Sepinggan", type: "Laut", lat: -1.345000, lon: 116.965000, bmkgCode: 'XY004', bmkgSlug: 'pelabuhan-kariangau-balikpapan' },

  { name: "Pulau Beras Basah", type: "Laut", lat: 0.155820, lon: 117.550300, bmkgCode: null, bmkgSlug: null },
  { name: "Muara Sangatta", type: "Muara", lat: 0.453100, lon: 117.589100, bmkgCode: null, bmkgSlug: null },
  { name: "Pantai Kenyamukan", type: "Laut", lat: 0.512200, lon: 117.615500, bmkgCode: null, bmkgSlug: null },

  { name: "Pulau Derawan", type: "Laut", lat: 2.284500, lon: 118.242100, bmkgCode: null, bmkgSlug: null },
  { name: "Selat Maratua", type: "Laut", lat: 2.247200, lon: 118.618400, bmkgCode: null, bmkgSlug: null }
];
