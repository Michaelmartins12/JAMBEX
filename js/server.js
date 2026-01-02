import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are a JAMB AI tutor.
Explain this past question clearly using the JAMB syllabus.
Provide a concise, step-by-step reasoning for the correct answer.
Do not just state the answer; explain WHY it is correct.
`;

app.post("/explain", async (req, res) => {
  try {
    const { question, option, answer, subject } = req.body;

    // Construct the prompt
    const prompt = `
      Subject: ${subject}
      Question: "${question}"
      Options: ${JSON.stringify(option)}
      Correct Answer: ${answer}
      
      Explain the solution.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    const explanation = data.candidates[0].content.parts[0].text;

    res.json({ answer: explanation });
  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ error: "Failed to generate explanation." });
  }
});

app.listen(3000, () =>
  console.log("Jambex Server running on http://localhost:3000")
);
