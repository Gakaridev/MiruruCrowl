const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// クライアント準備
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 除外したいドメインのリスト
const ignoreKeywords = ['example.com', 'ads-site.net'];

async function runCrawler() {
  console.log('クロールを開始');

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

  console.log(`${filteredResults.length} 件 サイト解析中`);

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
// crawler.js のこの部分を書き換える！
const model = genAI.getGenerativeModel({ 
  model: "gemma-4-26b"  // リストにあった名前に合わせる！
});

    const prompt = `
      送信されたテキストが自治体などの公式サイトか判断し、FalseかTrueのJson形式で送信
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
