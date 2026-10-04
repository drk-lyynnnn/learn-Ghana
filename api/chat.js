// Serverless function (Vercel). Keeps your API key secret on the server.
const syllabus = require("../data/syllabus.json");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `You are a patient study tutor for students in Ghana preparing for BECE and WASSCE (WAEC), following the GES syllabus.
Rules:
- Teach step by step. Ask a short guiding question before giving a full answer when the student is practising.
- Show full working the way WAEC marking schemes reward: formula, substitution, units, final answer.
- Use simple English and Ghanaian examples (cedis, local markets, familiar places).
- Write maths in plain text, e.g. x^2 + 3x = 10, 3/4, sqrt(16).
- Use the SYLLABUS NOTES below when relevant. If a question is outside them, say so and answer carefully.
- If you are not sure, say so. Never invent past questions or marking scheme details.
- Stay on school subjects. Be encouraging and brief.`;

function tokens(s) {
  return String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
}

function retrieve(question, k = 3) {
  const q = new Set(tokens(question));
  return syllabus
    .map((c) => {
      const words = tokens(c.topic + " " + c.keywords.join(" ") + " " + c.text);
      let score = 0;
      for (const w of words) if (q.has(w)) score++;
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => `[${x.c.subject}: ${x.c.topic}]\n${x.c.text}`);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.GEMINI_API_KEY)
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });

  const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-10) : [];
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.text)
    return res.status(400).json({ error: "No question received." });
  if (String(last.text).length > 2000)
    return res.status(400).json({ error: "Question is too long." });

  const notes = retrieve(last.text);
  const system =
    SYSTEM_PROMPT + "\n\nSYLLABUS NOTES:\n" + (notes.length ? notes.join("\n\n") : "(none matched)");

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: String(m.text).slice(0, 2000) }],
    })),
  };

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify(body),
      }
    );
    if (r.status === 429)
      return res.status(429).json({ error: "Too many students right now. Try again in a minute." });
    const data = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    if (!r.ok || !reply)
      console.error("Gemini error", r.status, JSON.stringify(data));
      return res.status(502).json({ error: "The tutor could not answer. (Google says: " + (data?.error?.message || "empty reply") + ")" });
    }
    res.status(200).json({ reply });
  } catch (e) {
    res.status(502).json({ error: "Network problem. Check your connection and retry." });
  }
};
