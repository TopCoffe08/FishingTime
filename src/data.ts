import { FishSpecies, FishingLocation } from './types';

export const SPECIES_DB: FishSpecies[] = [
  // 1. ZONA AIR TAWAR & ALIRAN SUNGAI
  {
    id: "s1",
    name: "Baung / Patin Liar",
    type: "Ikan",
    habitat: ["Sungai"],
    locations: ["Sungai Mahakam"],
    activePhase: ["Malam", "Pasang Naik"],
    bait: "Umpan Kucur, cacing tanah besar / nipah",
    technique: "Dasaran berat",
    imageFallback: "🐟"
  },
  {
    id: "s2",
    name: "Udang Galah",
    type: "Udang",
    habitat: ["Sungai"],
    locations: ["Sungai Mahakam"],
    activePhase: ["Arus Lemah", "Surut"],
    bait: "Cacing nipah, cacing tanah besar",
    technique: "Pancing udang khusus (Hook kecil) joran lentur",
    imageFallback: "🦐"
  },
  {
    id: "s3",
    name: "Lais / Kendia",
    type: "Ikan",
    habitat: ["Sungai", "Anak Sungai"],
    locations: ["Sungai Mahakam", "Karang Mumus"],
    activePhase: ["Pagi", "Pasang Turun"],
    bait: "Udang kecil, Anakan ikan, Cacing",
    technique: "Dasaran ringan / Pelampung",
    imageFallback: "🐟"
  },
  {
    id: "s4",
    name: "Ikan Gabus (Haruan) / Toman",
    type: "Ikan",
    habitat: ["Anak Sungai"],
    locations: ["Karang Mumus"],
    activePhase: ["Pagi", "Sore", "Air Tenang"],
    bait: "Katak hidup (live frog), Soft Frog, cacing tanah",
    technique: "Casting (top water)",
    imageFallback: "🐟"
  },

  // 2. ZONA MUARA & DELTA (PAYAU / ESTUARI)
  {
    id: "s5",
    name: "Barramundi (Kakap Putih)",
    type: "Ikan",
    habitat: ["Muara"],
    locations: ["Muara Pegah", "Muara Sanga-Sanga", "Muara Berau", "Muara Manggar", "Muara Sangatta"],
    activePhase: ["Pasang Puncak", "Arus Jalan (Neap Tide)"],
    bait: "Udang hidup, Ikan Belanak hidup, Lure Minnow Sinking",
    technique: "Casting / Dasaran / Konceran",
    imageFallback: "🐟"
  },
  {
    id: "s6",
    name: "Mangrove Jack",
    type: "Ikan",
    habitat: ["Muara"],
    locations: ["Muara Pegah", "Muara Berau", "Muara Sangatta"],
    activePhase: ["Pasang Naik", "Air Masuk"],
    bait: "Udang hidup besar, Soft Bait Paddle Tail",
    technique: "Casting akurasi di sela akar bakau / Dasaran",
    imageFallback: "🐟"
  },
  {
    id: "s7",
    name: "Sembilang Laut",
    type: "Ikan",
    habitat: ["Muara"],
    locations: ["Muara Pegah", "Muara Manggar"],
    activePhase: ["Malam", "Fajar"],
    bait: "Cacing laut (umpan pasir/nipah), Udang hidup",
    technique: "Dasaran",
    imageFallback: "🐟"
  },
  {
    id: "s8",
    name: "Kerapu Lumpur / Bekuku",
    type: "Ikan",
    habitat: ["Muara"],
    locations: ["Muara Sanga-Sanga", "Muara Manggar"],
    activePhase: ["Subuh", "Malam"],
    bait: "Udang hidup, cumi iris, irisan ikan segar",
    technique: "Dasaran dekat struktur dasar/karang",
    imageFallback: "🐟"
  },
  {
    id: "s9",
    name: "Kepiting Bakau",
    type: "Kepiting",
    habitat: ["Muara"],
    locations: ["Muara Berau"],
    activePhase: ["Pasang Naik"],
    bait: "Potongan ikan mentah, kepala ayam",
    technique: "Bubu / Perangkap Bintur",
    imageFallback: "🦀"
  },
  {
    id: "s10",
    name: "Tetengkek",
    type: "Ikan",
    habitat: ["Muara"],
    locations: ["Muara Sangatta"],
    activePhase: ["Surut Turun"],
    bait: "Ikan Belanak kecil hidup, Udang hidup, Minnow",
    technique: "Casting / Dasaran",
    imageFallback: "🐟"
  },
  {
    id: "s11",
    name: "Kakap Merah Muara / Puput",
    type: "Ikan",
    habitat: ["Laut", "Muara"],
    locations: ["Pantai Kenyamukan"],
    activePhase: ["Sore", "Pasang Naik"],
    bait: "Udang hidup, umpan potongan cumi segar",
    technique: "Dasaran menengah",
    imageFallback: "🐟"
  },

  // 3. ZONA TELUK & PESISIR PANTAI
  {
    id: "s12",
    name: "Kuwe (Trevally) / Bulan-bulan",
    type: "Ikan",
    habitat: ["Laut"],
    locations: ["Teluk Balikpapan"],
    activePhase: ["Fajar", "Pagi"],
    bait: "Micro Jig",
    technique: "Ultra Light (UL) Casting / Jigging",
    imageFallback: "🐟"
  },
  {
    id: "s13",
    name: "Baronang",
    type: "Ikan",
    habitat: ["Laut"],
    locations: ["Teluk Balikpapan"],
    activePhase: ["Pagi", "Siang"],
    bait: "Lumut hijau",
    technique: "Garong / Pelampung",
    imageFallback: "🐟"
  },
  {
    id: "s14",
    name: "Kerapu Karang / Kakap Tompel",
    type: "Ikan",
    habitat: ["Laut"],
    locations: ["Pulau Beras Basah"],
    activePhase: ["Pagi", "Sore"],
    bait: "Udang hidup, potongan cumi",
    technique: "Dasaran ringan dekat terumbu",
    imageFallback: "🐟"
  },
  {
    id: "s15",
    name: "Cendro",
    type: "Ikan",
    habitat: ["Laut"],
    locations: ["Pulau Beras Basah"],
    activePhase: ["Siang", "Sore"],
    bait: "Casting spoon mengkilap",
    technique: "Permukaan (Top water casting)",
    imageFallback: "🐟"
  },

  // 4. ZONA LAUT LEPAS & LAUT DALAM (DEEP SEA)
  {
    id: "s16",
    name: "Tenggiri / Barakuda",
    type: "Ikan",
    habitat: ["Laut"],
    locations: ["Pantai Sepinggan", "Selat Maratua"],
    activePhase: ["Arus Kuat (Spring Tide)"],
    bait: "Ikan Kembung/Banyar hidup, Metal Jig",
    technique: "Drifting, Speed Jigging, Trolling",
    imageFallback: "🐟"
  },
  {
    id: "s17",
    name: "Kuwe GT (Giant Trevally)",
    type: "Ikan",
    habitat: ["Laut"],
    locations: ["Pantai Sepinggan", "Pulau Derawan"],
    activePhase: ["Arus Kuat"],
    bait: "Popper besar, Ikan Kembung hidup",
    technique: "Heavy Casting (Popping) / Drifting",
    imageFallback: "🐟"
  },
  {
    id: "s18",
    name: "Tuna Gigi Anjing (Dogtooth)",
    type: "Ikan",
    habitat: ["Laut"],
    locations: ["Pulau Derawan", "Selat Maratua"],
    activePhase: ["Pergantian Arus Pasang ke Surut"],
    bait: "Metal Jig berat (100-200g), Stickbait",
    technique: "Vertical Jigging / Deep Drop",
    imageFallback: "🐟"
  },
  {
    id: "s19",
    name: "Kakap Merah Ruby",
    type: "Ikan",
    habitat: ["Laut"],
    locations: ["Pulau Derawan"],
    activePhase: ["Malam", "Subuh"],
    bait: "Cumi utuh besar",
    technique: "Dasaran berat (Deep Drop / Bottom Fishing)",
    imageFallback: "🐟"
  },
  {
    id: "s20",
    name: "Tongkol Kraton",
    type: "Ikan",
    habitat: ["Laut"],
    locations: ["Selat Maratua"],
    activePhase: ["Siang", "Sore"],
    bait: "Stickbait, Metal Jig",
    technique: "Casting, Jigging",
    imageFallback: "🐟"
  }
];

export const PRESET_LOCATIONS: FishingLocation[] = [
  // === SUNGAI MAHAKAM (Default) ===
  { 
    name: "Sungai Mahakam", type: "Sungai", lat: -0.509420, lon: 117.126430, bmkgCode: null, bmkgSlug: null,
    targets: "Baung, Patin Liar, Lais, Kendia, Udang Galah",
    conditions: "Fase 'Air Bangkai' (peralihan jernih-keruh). Malam hari menjelang pasang penuh (arus mulai tenang).",
    bait: "Umpan Kucur (fermentasi usus/lemak), cacing tanah besar, cacing nipah"
  },
  { 
    name: "Karang Mumus", type: "Anak Sungai", lat: -0.505280, lon: 117.152420, bmkgCode: null, bmkgSlug: null,
    targets: "Haruan (Gabus), Toman, Lais kecil",
    conditions: "Pagi hari (06.00 - 09.00) saat predator naik mengambil oksigen. Air tenang.",
    bait: "Katak hidup, Soft Frog, cacing tanah"
  },

  // === BALIKPAPAN ===
  { 
    name: "Teluk Balikpapan", type: "Laut", lat: -1.218450, lon: 116.808900, bmkgCode: 'XY004', bmkgSlug: 'pelabuhan-kariangau-balikpapan',
    targets: "Kuwe (Trevally), Indo-Pacific Tarpon (Bulan-bulan), Baronang",
    conditions: "Perairan dalam terlindung. Paling bagus fajar hingga jam 10.00 pagi.",
    bait: "Lumut hijau, Teknik Ultra Light (UL) dengan Micro Jig"
  },
  { 
    name: "Pantai Sepinggan", type: "Laut", lat: -1.345000, lon: 116.965000, bmkgCode: 'XY002', bmkgSlug: 'pelabuhan-semayang',
    targets: "Tenggiri, Barakuda, Kuwe GT (Giant Trevally)",
    conditions: "Butuh arus kuat (Spring Tide / sekitar bulan purnama atau mati total).",
    bait: "Ikan Kembung/Banyar hidup (teknik drifting), Metal Jig"
  },
  { 
    name: "Muara Manggar", type: "Muara", lat: -1.205800, lon: 116.936200, bmkgCode: 'XY016', bmkgSlug: 'pelabuhan-tanjung-batu-balikpapan',
    targets: "Sembilang, Kakap Putih ukuran sedang, Kerapu Lumpur",
    conditions: "Malam hari atau menjelang fajar. Kondisi air tidak banjir lumpur.",
    bait: "Cacing laut, udang hidup, cumi iris"
  },

  // === PENAJAM ===
  { 
    name: "Muara Pegah", type: "Muara", lat: -0.909850, lon: 117.262150, bmkgCode: 'XY005', bmkgSlug: 'pelabuhan-penajam-paser-utara',
    targets: "Barramundi (Kakap Putih), Mangrove Jack, Sembilang Laut",
    conditions: "'Arus Jalan' (peralihan surut ke pasang atau sebaliknya). Paling pas saat Neap Tide (Pasang Mati).",
    bait: "Udang hidup, Ikan Belanak hidup, Lure Minnow Sinking"
  },

  // === KUTAI KARTANEGARA (MUARA) ===
  { 
    name: "Muara Sanga-Sanga", type: "Muara", lat: -0.592140, lon: 117.289450, bmkgCode: 'XY015', bmkgSlug: 'pelabuhan-tanjung-santan',
    targets: "Kakap Putih, Kerapu Lumpur, Bekuku",
    conditions: "Air payau jernih kehijauan. Waktu terbaik subuh atau malam hari.",
    bait: "Udang hidup, irisan daging ikan segar (kembung/tongkol)"
  },

  // === BONTANG ===
  { 
    name: "Pulau Beras Basah", type: "Laut", lat: 0.155820, lon: 117.550300, bmkgCode: 'XY014', bmkgSlug: 'pelabuhan-lhok-tuan',
    targets: "Kerapu Karang, Kakap Tompel (John's Snapper), Cendro",
    conditions: "Air laut jernih. Batas terumbu karang dangkal dan tubiran.",
    bait: "Udang hidup, potongan cumi, casting spoon mengkilap"
  },
  { 
    name: "Pantai Kenyamukan", type: "Laut", lat: 0.512200, lon: 117.615500, bmkgCode: 'XY013', bmkgSlug: 'pelabuhan-sangatta',
    targets: "Kakap Merah Muara, Kerapu, Puput",
    conditions: "Sore hari menjelang magrib atau saat air mulai pasang naik.",
    bait: "Udang hidup, potongan cumi segar"
  },

  // === KUTAI TIMUR ===
  { 
    name: "Muara Sangatta", type: "Muara", lat: 0.453100, lon: 117.589100, bmkgCode: 'XY013', bmkgSlug: 'pelabuhan-sangatta',
    targets: "Barramundi, Mangrove Jack, Tetengkek",
    conditions: "Transisi air payau-asin. Targetkan saat air bergerak surut lambat.",
    bait: "Ikan Belanak kecil hidup, Udang hidup, Minnow"
  },

  // === BERAU ===
  { 
    name: "Muara Berau", type: "Muara", lat: -0.218500, lon: 117.531100, bmkgCode: 'XY012', bmkgSlug: 'pelabuhan-mantritip',
    targets: "Barramundi besar, Mangrove Jack, Kepiting Bakau",
    conditions: "Pinggiran hutan bakau lebat. Paling aktif saat air mulai pasang.",
    bait: "Udang hidup berukuran besar, Soft Bait Paddle Tail (casting)"
  },

  // === KEPULAUAN BERAU ===
  { 
    name: "Pulau Derawan", type: "Laut", lat: 2.284500, lon: 118.242100, bmkgCode: 'XY017', bmkgSlug: 'pelabuhan-pulau-derawan',
    targets: "GT, Tuna Gigi Anjing, Kakap Merah Ruby",
    conditions: "Area drop-off. Air harus biru pekat. Hindari musim angin selatan.",
    bait: "Popper besar, cumi utuh besar (dasaran berat)"
  },
  { 
    name: "Selat Maratua", type: "Laut", lat: 2.247200, lon: 118.618400, bmkgCode: 'XY018', bmkgSlug: 'pelabuhan-pulau-maratua',
    targets: "Tuna Gigi Anjing, Tenggiri besar, Tongkol Kraton, Barakuda",
    conditions: "Arus laut sangat kuat dan dalam. Waktu terbaik saat pergantian arus pasang ke surut.",
    bait: "Metal Jig berat (100g - 200g), Stickbait"
  }
];
