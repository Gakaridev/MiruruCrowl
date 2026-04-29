const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// 1. Supabaseの準備
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 2. 公式判定用の関数 (fetchを使ったGemma対応版)
async function verifyOfficial(text) {
  try {
    console.log(`検証中...: ${text.substring(0, 30)}...`);
    const modelId = "gemini-3.1-flash-lite-preview"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `以下のテキストが自治体の公式な公園案内サイトかどうかを判定して。{"isOfficial": boolean}の形式で返して。余計な文字は禁止。テキスト: ${text}` }] }]
      })
    });

    const data = await response.json();
    
    // エラーチェック
    if (data.error) throw new Error(data.error.message);

    const responseText = data.candidates[0].content.parts[0].text;
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(jsonStr);
    return json.isOfficial;
  } catch (e) {
    console.error('判定エラー:', e.message);
    return false;
  }
}

// 3. メインのクローラー処理
async function runCrawler() {
  console.log("★ プログラムが起動したよ！");

  try {
    // 検索
    const response = await axios.post('https://google.serper.dev/search', {
      q: "公園 ルール",
      gl: "jp",
      hl: "ja",
      tbs: "qdr:w",
      num: 5
    }, {
      headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' }
    });

    const results = response.data.organic || [];
    console.log(`★ Serperから ${results.length} 件のデータが届いたよ！`);

    for (const item of results) {
      const isOfficial = await verifyOfficial(item.snippet || item.title);
      
      if (isOfficial) {
        console.log(`★ 公式サイト発見！保存するよ: ${item.link}`);
        await supabase.from('park_rules').upsert({
          title: item.title,
          url: item.link,
          created_at: new Date().toISOString()
        });
      } else {
        console.log(`★ 公式じゃないみたい: ${item.link}`);
      }
    }
  } catch (e) {
    console.error("エラーが発生したよ:", e.message);
  }
  console.log("★ クローラー終了！");
}

// ★一番大事！ここで関数を呼び出す！
runCrawler();
