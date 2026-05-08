import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lazy-initialized AI client
let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    // 如果是在開發環境且沒有設定金鑰，拋出更詳細的指示
    throw new Error("找不到有效的 GEMINI_API_KEY。請確保已在 Settings -> Secrets 中設定金鑰。");
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Debug route
  app.get("/api/ping", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // AI Endpoint
  app.post("/api/ai", async (req, res) => {
    const { prompt, mode, context } = req.body;
    
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        return res.status(401).json({ error: "找不到有效的 GEMINI_API_KEY。請確保已在 Settings -> Secrets 中設定金鑰。" });
      }
      
      const aiClient = getGenAI();
      const model = aiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      let systemPrompt = "你是一個專業的數學解題助手。";
      if (mode === "tutor") {
        systemPrompt = "你是一個耐心且專業的數學家。請詳細展示推論過程，解釋每一個代數步驟，並確保最終結果的正確性。";
      } else if (mode === "engineer") {
        systemPrompt = "你是一個注重精確度的數學工程師。請直接給出解、相關公式與數值近似值。";
      } else if (mode === "analyst") {
        systemPrompt = "你是一個數學分析專家。分析數學對象的幾何性質、對稱性、定義域、單調性等特性。";
      } else {
        systemPrompt = "你是一個高級數學解題系統。請分析輸入的數學物件，給出精確定義、符號運算過程與最終解。";
      }

      const fullPrompt = `指令：請針對以下數學輸入進行深度解析。如果是方程式，請給出解。如果是函數，請分析其屬性。請分步展示解釋並提供結論。\n\n輸入算式：${prompt}\n\n語境：${JSON.stringify(context)}\n\n輸出要求：請使用 Markdown 格式回答，支持 LaTeX 數學公式。請使用繁體中文。回答應包含「解析步驟」與「最終結論」兩個部分。`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (error: any) {
      console.error("AI Error:", error.message);
      res.status(500).json({ error: error.message || "AI 服務異常" });
    }
  });

  // Catch-all for API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API 路由未找到: ${req.method} ${req.url}` });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error:", err);
    res.status(500).json({ error: err.message || "伺服器內部錯誤" });
  });

  console.log(`Environment: ${process.env.NODE_ENV}`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
