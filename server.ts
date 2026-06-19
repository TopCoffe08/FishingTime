import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini AI Recommendations
  app.post("/api/recommendation", async (req, res) => {
    try {
      const { location, tideData, weatherData, moonPhase, timeOfDay } = req.body;
      
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Anda adalah "Asisten Pemancing Digital" yang ahli dalam ekosistem perairan.
Berdasarkan data berikut, berikan saran spesifik mengenai waktu terbaik untuk memancing, spesies (ikan atau udang) yang mungkin aktif, dan alasannya.

Lokasi: ${location || 'Tidak diketahui'}
Kondisi Air (Pasang/Surut): ${tideData}
Cuaca Saat Ini: ${weatherData}
Fase Bulan: ${moonPhase}
Waktu Saat Ini: ${timeOfDay}

Tolong berikan respon yang ringkas, mudah dipahami (seperti saran teman nelayan yang pintar), namun menggunakan data ilmiah. Jelaskan mengapa kondisinya bagus/buruk (misal: "Ikan predator biasanya aktif mencari makan saat air mulai surut turun..."). Berikan satu paragraf konklusi atau skor 0-100 secara tersurat (misal: Aktivitas Ikan: 85/100).
Gunakan bahasa Indonesia.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ recommendation: response.text });
    } catch (error) {
      const error_msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Error generating recommendation:", error_msg);
      res.json({ recommendation: "Sistem AI sedang mengalami tingginya permintaan atau dalam perbaikan. Kondisi saat ini cukup baik untuk memancing. Perhatikan kondisi air pasang dan selalu berhati-hati." });
    }
  });

  // AI Chat Assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Kamu adalah 'Angler.AI', ahli memancing yang sangat paham mengenai teknik memancing, cuaca, pasang surut, umpan, dan lokasi (sungai, laut, muara) di Indonesia. Jawab secara informatif, ramah, dan ringkas. DILARANG KERAS menggunakan format markdown seperti tanda bintang (*), tagar (#), atau simbol formatting lainnya dalam balasanmu. Gunakan murni teks biasa. Jika ditanya soal 'radar pendeteksi ikan', jelaskan bahwa aplikasi saat ini sedang mengembangkannya menggunakan data satelit kelautan (seperti klorofil dan suhu permukaan laut) dan AI untuk mendeteksi upwelling (potensi kumpulan ikan).",
        }
      });

      res.json({ response: response.text });
    } catch (error: any) {
      console.error("Error generating chat response:", error);
      res.status(500).json({ error: "Sistem AI sedang sibuk." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
