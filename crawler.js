const axios = require('axios');

// キーはコードに書かずに、システムから読み込む！
const SERPER_API_KEY = process.env.SERPER_API_KEY;

let data = JSON.stringify({
  "q": "公園 ルール",
  "gl": "jp",
  "hl": "ja",
  "tbs": "qdr:w" // 過去1週間（さっきの要望を入れてみたよ！）
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://google.serper.dev/search',
  headers: { 
    'X-API-KEY': SERPER_API_KEY, // ここを修正
    'Content-Type': 'application/json'
  },
  data : data
};

async function makeRequest() {
  try {
    const response = await axios.request(config);
    // 取得したデータを確認
    console.log(response.data);
  }
  catch (error) {
    console.error('エラー発生:', error.message);
  }
}

makeRequest();
