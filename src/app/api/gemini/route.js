import { NextResponse } from "next/server";
import { buildSystemPrompt } from "../../../features/sigita/lib/prompt";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function mapHistoryToContents(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => typeof m?.content === "string" && m.content.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum diset di environment server." },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const userMessage = typeof body?.userMessage === "string" ? body.userMessage.trim() : "";
    const docs = Array.isArray(body?.docs) ? body.docs : [];
    const history = mapHistoryToContents(body?.history);
    const systemPrompt =
      typeof body?.systemPrompt === "string" && body.systemPrompt.trim()
        ? body.systemPrompt
        : buildSystemPrompt(docs);

    if (!userMessage) {
      return NextResponse.json({ error: "Pesan pengguna kosong." }, { status: 400 });
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [...history, { role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.9,
        thinkingConfig: { thinkingBudget: 0 },
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
      ],
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        data?.error?.message || data?.error || `Gemini request gagal (${response.status}).`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "")
        .join("")
        .trim() || "Maaf, tidak ada respons.";

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
