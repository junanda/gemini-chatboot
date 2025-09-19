import { GoogleGenAI } from "@google/genai";
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs/promises";
import "dotenv/config";
import extractText from "./utils/utils.mjs";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

app.post("/api/generate-from-image", upload.single("image"), async (req, res) => {
  try {
    const { prompt = "describe the uploaded image" } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }

    const buffer = req.file.buffer.toString("base64");

    const response = await ai.models.generateContent({
      model: geminiModels.image,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: req.file.mimetype, data: buffer } }
          ]
        }
      ],
    });
    return res.status(200).json({ result: extractText(response) });

  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message});
  } finally {
    // Hapus file yang diupload untuk menghemat ruang penyimpanan
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path);
    }
  }
});

app.post('/api/generate-from-document', upload.single('document'), async (req, res) => {
  try {
    const { prompt = "summarize the uploaded document" } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Document file is required." });
    }

    const docBase64 = req.file.buffer.toString('base64');

    const response = await ai.models.generateContent({
      model: geminiModels.document,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt || "summarize this document:" },
            { inlineData: { mimeType: req.file.mimetype, data: docBase64 } }
          ]
        }
      ],
    });

    return res.status(200).json({ result: extractText(response) });

  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  } finally {
    // Hapus file yang diupload untuk menghemat ruang penyimpanan
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.info(`Server is running on http://localhost:${PORT}`);
});
