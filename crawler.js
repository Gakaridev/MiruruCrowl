// Gemma 4 判定用のコード
async function verifyOfficial(text) {
  try {
    // URLを、モデル名を含めた正確なものに修正する！
    // 正式なモデルIDは 'models/gemma-4-26b-it'
    const modelId = "gemma-4-26b-it"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `以下のテキストが自治体の公式な公園案内サイトかどうかを判定して。{"isOfficial": boolean}の形式で返して。テキスト: ${text}` }] }]
      })
    });

    const data = await response.json();
    
    // AIの返事を取り出す
    const responseText = data.candidates[0].content.parts[0].text;
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(jsonStr);
    return json.isOfficial;
  } catch (e) {
    console.error('判定エラー:', e.message);
    return false;
  }
}
