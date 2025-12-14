import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/chat", requireAuth, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || !context) {
      return res.status(400).json({ error: "Missing message or context" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
You are an AI assistant.

Answer STRICTLY using the context below.
If the answer is not present, say: "Not mentioned in the post."

Rules:
- Maximum 100 words
- Be concise and to the point
- Use short paragraphs or bullet points if helpful
- No unnecessary explanations

CONTEXT:
${context}

USER QUESTION:
${message}
`;


    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

export default router; // ✅ THIS LINE IS REQUIRED
