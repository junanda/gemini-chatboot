import { GoogleGenAI } from "@google/genai";
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs/promises";
import "dotenv/config";
import extractText from "./utils/utils.mjs";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({});

// inisialisasi model gemini
const geminiModels = {
  text: "gemini-2.5-flash-lite",
  image: "gemini-2.5-flash",
  audio: "gemini-2.5-flash",
  document: "gemini-2.5-flash-lite",
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res
        .status(400)
        .json({ message: "Prompt harus diisi dan bertipe string.." });
    }

    // logika dimulai disini
    const resposne = await ai.models.generateContent({
      model: geminiModels.text,
      contents: [
        {
          role: "user",
          text: prompt,
        },
      ],
    });

    // kirim response ke client
    return res.status(200).json({ result: extractText(resposne) });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.info(`Server is running on http://localhost:${PORT}`);
});
