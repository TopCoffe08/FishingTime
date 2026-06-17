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
      console.error("Error generating recommendation:", error);
      res.status(500).json({ error: "Failed to generate recommendation" });
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
