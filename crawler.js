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
// JSON安全パーサ
// =====================
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log("⚠️ JSONパース失敗:", text);
    return null;
  }
}

// =====================
// Gemma判定関数（強化版）
// =====================
async function verifyOfficial(text) {
  try {
    console.log(`🔍 検証中...: ${text.substring(0, 40)}...`);

    const modelId = "gemma-4-26b-a4b-it";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const prompt = `
あなたは厳密なJSON判定器です。

以下のルールを絶対に守ってください：
- 出力はJSONのみ
- 文章禁止
- Markdown禁止
- 説明禁止
- \`\`\`禁止

出力フォーマット：
{"isOfficial": true}

判定対象テキスト:
${text}
`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      console.log("⚠️ 応答なし");
      return false;
    }

    // =====================
    // クリーン処理（重要）
    // =====================
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/^\*\s+/gm, "") // ★箇条書き削除
      .trim();

    const json = safeJsonParse(cleaned);

    if (!json) return false;

    return json.isOfficial === true;

  } catch (e) {
    console.error("❌ 判定エラー:", e.message);
    return false;
  }
}

// =====================
// メイン処理
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
        console.log(`✅ 公式発見: ${item.link}`);

        await supabase.from("park_rules").upsert({
          title: item.title,
          url: item.link,
          created_at: new Date().toISOString()
        });
      } else {
        console.log(`❌ 非公式: ${item.link}`);
      }
    }
  } catch (e) {
    console.error("💥 クローラーエラー:", e.message);
  }

  console.log("🏁 完了");
}

// =====================
// 実行
// =====================
runCrawler();
