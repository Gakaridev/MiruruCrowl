const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// クライアント準備
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 除外したいドメインのリスト
const ignoreKeywords = ['example.com', 'ads-site.net'];

async function runCrawler() {
  console.log('--- 🚀 クローラー起動！ ---');

  // 1. Serper.dev で検索
  const response = await axios.post('https://google.serper.dev/search', {
    q: "公園 ルール",
    gl: "jp",
    hl: "ja",
    tbs: "qdr:y",
    num: 10
  }, {
    headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' }
  });

  const results = response.data.organic || [];
  
  // 2. フィルタリング（除外したいサイトを弾く）
  const filteredResults = results.filter(item => {
    return !ignoreKeywords.some(keyword => item.link.includes(keyword));
  });

  console.log(`${filteredResults.length} 件のサイトを検証するよ！`);

  // 3. 順番に判定して保存
  for (const item of filteredResults) {
    console.log(`検証中: ${item.link}`);
    
    // Geminiに判定してもらう
    const isOfficial = await verifyOfficial(item.snippet || item.title);
    
    if (isOfficial) {
      console.log('✅ 公式サイトと判定！保存するよ');
      await supabase.from('park_rules').upsert({
        title: item.title,
        url: item.link,
        created_at: new Date().toISOString()
      });
    } else {
      console.log('❌ 公式じゃないみたい。スキップ！');
    }
  }
  console.log('--- ✅ クローラー終了！ ---');
}

async function verifyOfficial(text) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      以下のテキストが、自治体の公式な公園案内サイトかどうかを判定して。
      必ず{"isOfficial": boolean}というJSON形式で返してね。
      テキスト: ${text}
    `;

    const result = await model.generateContent(prompt);
    const json = JSON.parse(result.response.text());
    return json.isOfficial;
  } catch (e) {
    console.error('Gemini判定エラー:', e.message);
    return false;
  }
}

runCrawler();
