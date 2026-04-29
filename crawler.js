const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

// =====================
// Supabase
// =====================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// =====================
// JSON抽出（最重要）
// =====================
function extractJson(text) {
  if (!text) return null;

  try {
    // まず普通に試す
    return JSON.parse(text);
  } catch {}

  // JSON部分だけ抜き出す（最重要保険）
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// =====================
// LLM判定（安定版）
// =====================
async function callGemma(text) {
  const modelId = "gemma-4-26b-a4b-it";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const prompt = `
You are a binary classifier.

Return ONLY valid JSON:
{"isOfficial": true} or {"isOfficial": false}

RULES:
- No explanation
- No markdown
- No thinking
- No extra text
- Output ONLY JSON

TEXT:
${text}
`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0
      },
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// =====================
// リトライ付き判定
// =====================
async function verifyOfficial(text, retry = 2) {
  for (let i = 0; i <= retry; i++) {
    try {
      console.log(`🔍 検証中... (${i + 1}/${retry + 1})`);

      const raw = await callGemma(text);
      const json = extractJson(raw);

      if (!json || typeof json.isOfficial !== "boolean") {
        throw new Error("Invalid JSON");
      }

      return json.isOfficial;
    } catch (e) {
      console.log("⚠️ 失敗:", e.message);

      if (i === retry) {
        return false;
      }
    }
  }
  return false;
}

// =====================
// メイン
// =====================
async function runCrawler() {
  console.log("🚀 クローラー起動");

  try {
    const response = await axios.post(
      "https://google.serper.dev/search",
      {
        q: "公園 ルール",
        gl: "jp",
        hl: "ja",
        tbs: "qdr:w",
        num: 5
      },
      {
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const results = response.data.organic || [];
    console.log(`📦 検索結果: ${results.length}件`);

    for (const item of results) {
      const text = item.snippet || item.title || "";

      const isOfficial = await verifyOfficial(text);

      if (isOfficial) {
        console.log(`✅ 公式: ${item.link}`);

        const { error } = await supabase.from("park_rules").upsert({
          title: item.title,
          url: item.link,
          created_at: new Date().toISOString()
        });

        if (error) {
          console.log("⚠️ Supabaseエラー:", error.message);
        }
      } else {
        console.log(`❌ 非公式: ${item.link}`);
      }
    }
  } catch (e) {
    console.error("💥 クローラー致命的エラー:", e.message);
  }

  console.log("🏁 完了");
}

// =====================
// 実行
// =====================
runCrawler();
