# 🌿 miruru-Crowl

**公園ルールを自動収集するクロールボット**

---

## 🧠 What is this?

miruru-Crowl は、  
インターネット上に散らばっている公園情報を収集し、  
構造化してデータベースへ保存するためのクローラーです。

---

## 🚀 Purpose

公園ルールはサイトごとにバラバラに存在しています。

- 市役所ページ
- 公園管理サイト
- 個人ブログ
- 地域情報サイト

👉 これらを自動で収集し、  
👉 「ミルル」で統一的に閲覧できるようにします。

---

## 🧱 Architecture
GitHub Actions (Scheduler)
↓
Crawler (Node.js)
↓
HTML Fetch
↓
Rule Extraction
↓
Supabase Database
↓
MIRURU Frontend


---

## ⚙️ Tech Stack

- Node.js
- GitHub Actions (cron execution)
- Cheerio / Fetch API
- Supabase (DB)
- Optional: AI rule parser

---

## 🕒 How it runs

- 定期実行（GitHub Actions）
- PC不要
- 完全自動クロール

例：


0 */6 * * *


👉 6時間ごとに実行

---

## 📦 Output Data

収集されるデータ例：

```json id="mc03"
{
  "park_name": "〇〇公園",
  "rules": [
    "ボール遊び：制限あり",
    "花火：禁止"
  ],
  "source": "https://example.com",
  "updated_at": "2026-04-29"
}
```
## 🤖 Future Plans

- AIによるルール自動抽出
- 重複データ除去
- 信頼度スコアリング
- 地域別ランキング

## ⚠️ Notes

- クロール対象サイトの規約に従うこと
- 過剰リクエスト禁止
- robots.txt を尊重する
## 🌿 Project

This is part of MIRURU [Alpha]
## 💚 Goal

公園のルールを、もっと見える世界へ
