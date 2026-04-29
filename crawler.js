async function findCorrectModelName() {
  try {
    const models = await genAI.listModels();
    console.log("--- サーバーが教えてくれる正しい名前一覧 ---");
    models.models.forEach(m => {
        // 名前の中に 'gemma' が入っているものだけ表示するよ
        if (m.name.toLowerCase().includes('gemma')) {
            console.log(`発見！正式名称: ${m.name}`);
        }
    });
  } catch (e) {
    console.error("リスト取得失敗:", e);
  }
}
findCorrectModelName();
