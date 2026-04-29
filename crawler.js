const { GoogleGenerativeAI } = require("@google/generative-ai");

// ★まずはここでおまじない（準備）をする！
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ★その後に、リストを探すコードを動かす！
async function findCorrectModelName() {
  try {
    console.log("--- サーバーにモデル一覧を聞いているよ… ---");
    const models = await genAI.listModels();
    
    console.log("--- 発見したモデルの一覧 ---");
    models.models.forEach(m => {
        // 名前の中に 'gemma' や 'gemini' が入っているものだけ表示するよ
        if (m.name.toLowerCase().includes('gemma') || m.name.toLowerCase().includes('gemini')) {
            console.log(`名前: ${m.name}`);
        }
    });
  } catch (e) {
    console.error("リスト取得失敗:", e);
  }
}

// 実行！
findCorrectModelName();
