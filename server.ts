import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Generate Custom Battleground Theme via Gemini
  app.post("/api/battleground/generate", async (req, res) => {
    try {
      const { theme } = req.body;
      if (!theme || typeof theme !== 'string') {
        return res.status(400).json({ error: 'Theme string is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment secrets.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Design a high-fidelity cyberpunk/brutalist map generator styling JSON for this theme: "${theme}". Only return the configuration specified in the schema. Make the styling colors look beautiful and perfectly visible, contrasting well with neon icons and text on a dark console screen overlay.`,
        config: {
          systemInstruction: "You are an expert game level designer specialized in neon, brutalist, and high-intensity tech aesthetics. You generate JSON data representing custom battlefield biome configurations. Make the visual styles and names highly atmospheric (e.g., 'CORE_TEMP_SENSITIVE', 'ACID_DOME_BETA').",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["name", "color", "description", "colorA", "colorB", "gridSize", "gridColor", "label", "visualStyle", "particleCount"],
            properties: {
              name: { type: Type.STRING, description: "Highly technical gothic/neon thematic name of the sector, in all caps with underscores (e.g. CYAN_CYLINDER_NEXUS)" },
              color: { type: Type.STRING, description: "The primary neon brand color of this level (e.g. high-contrast hex code like '#00ffcc', '#ff0055')" },
              description: { type: Type.STRING, description: "One-sentence chilling cyberpunk sensory overview of the sector." },
              colorA: { type: Type.STRING, description: "Inner radial background color (very dark, e.g. '#02100d', '#150205', '#050212')" },
              colorB: { type: Type.STRING, description: "Outer radial background color (even darker, e.g. '#010504', '#080102', '#020106')" },
              gridSize: { type: Type.INTEGER, description: "Size of the layout system grid lines in pixels. Must be between 80 and 200." },
              gridColor: { type: Type.STRING, description: "CSS rgba string representing grid line color with extremely low opacity, matching level color (e.g. 'rgba(0, 255, 204, 0.015)')" },
              label: { type: Type.STRING, description: "Technical label text displayed in the margins of the level (e.g. 'SECTOR_CRITICAL_D12')" },
              visualStyle: { 
                type: Type.STRING, 
                description: "The rendering style system to paint background detail. Must be exactly one of: 'grid', 'circuits', 'nebula', 'tecton_cracks', 'snowflake_nodes'" 
              },
              particleCount: { type: Type.INTEGER, description: "Target ambient particle count. Must be between 20 and 80." }
            }
          }
        }
      });

      const outputText = response.text;
      if (!outputText) {
        throw new Error("No response text returned from Gemini API.");
      }

      const mapData = JSON.parse(outputText.trim());
      res.json(mapData);
    } catch (err: any) {
      console.error("GenAI generateContent error:", err);
      res.status(500).json({ error: err.message || 'Failed to generate battleground theme' });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/:all*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[bugsmasher-server] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
