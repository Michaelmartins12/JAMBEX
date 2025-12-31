import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `
You are a JAMB AI tutor.
Explain clearly using the JAMB syllabus.
Use step-by-step examples and simple language.
`;

app.post("/ask", async (req, res) => {
  try {
    const { question, subject, topic, subtopic } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `
Subject: ${subject}
Topic: ${topic}
Subtopic: ${subtopic}
Question: ${question}
          `,
        },
      ],
    });

    res.json({ answer: response.choices[0].message.content });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "AI error" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
