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
app.use(express.static('static'))

app.post("/api/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res
        .status(400)
        .json({ success: false, data: null, message: "Prompt harus diisi dan bertipe string.." });
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
    return res.status(200).json({ success: true, data: extractText(resposne), message: "Text generated successfully." });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, data: null, message: "Internal Server Error", error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;
  // Guard clause untuk memastikan conversation adalah array
  if (!conversation || !Array.isArray(conversation)) {
    return res.status(400).json({ success: false, data: null, message: "Invalid conversation format." });
  }

  // Guad clause 2 -- cek integritas data
  let dataIsInvalid = false;
  conversation.forEach((msg) => {
    if (!msg || typeof msg !== 'object' || !msg.role || !msg.message || (msg.role !== 'user' && msg.role !== 'model')) {
      dataIsInvalid = true;
    }
  });

  if (dataIsInvalid) {
    return res.status(400).json({ success: false, data: null, message: "Invalid conversation data." });
  }

  // Mapping conversation ke format yang diharapkan oleh API Gemini
  const formattedConversation = conversation.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.message }],
  }));

  try {
    const response = await ai.models.generateContent({
      model: geminiModels.text,
      contents: formattedConversation,
    });

    return res.status(200).json({ success: true, data: response.text, message: "Chat response generated successfully." });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, data: null, message: "Internal Server Error", error: error.message });
  }

});

app.post("/api/generate-from-image", upload.single("image"), async (req, res) => {
  try {
    const { prompt = "describe the uploaded image" } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, data: null, message: "Image file is required." });
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
    return res.status(200).json({ success: true, data: extractText(response), message: "Image processed successfully." });

  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, data: null, message: "Internal Server Error", error: error.message});
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
      return res.status(400).json({ success: false, data: null, message: "Document file is required." });
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

    return res.status(200).json({ success: true, data: extractText(response), message: "Document processed successfully." });

  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, data: null, message: "Internal Server Error", error: error.message });
  } finally {
    // Hapus file yang diupload untuk menghemat ruang penyimpanan
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path);
    }
  }
});

app.post('/api/generate-from-audio', upload.single('audio'), async (req, res) => {
  try {
    const { prompt = "transcribe the uploaded audio" } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, data: null, message: "Audio file is required." });
    }

    const audioBase64 = req.file.buffer.toString('base64');

    const response = await ai.models.generateContent({
      model: geminiModels.audio,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt || "transcribe this audio:" },
            { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } }
          ]
        }
      ],
    });

    return res.status(200).json({ success: true, data: extractText(response), message: "Audio processed successfully." });

  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, data: null, message: "Internal Server Error", error: error.message });
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
