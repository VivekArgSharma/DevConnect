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
Answer ONLY using the context below.
If the answer is not present, say "Not mentioned in the post."

CONTEXT:
${context}

USER QUESTION:
${message}

read the whole thing well and enplain it to the user in detail but consice in 400 words answer in sub headings according to the topic give proper spacings after each sub heading and accordingly.
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
