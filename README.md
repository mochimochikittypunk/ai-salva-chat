# AI Salva-san Chat

Salvador Coffeeのオンラインショップ情報を学習したAIチャットボット「AIサルバさん」です。

## 機能
- Salvador Coffeeの商品知識に基づいた会話
- 商品の提案とリンクの提供
- コーヒーに関する一般的な質問への回答

## セットアップ手順

1. 依存パッケージのインストール
   ```bash
   npm install
   ```

2. 環境変数の設定
   `.env.example` をコピーして `.env.local` を作成し、Google AI StudioのAPIキーを設定してください。
   ```bash
   cp .env.example .env.local
   ```
   `.env.local` を編集:
   ```
   GOOGLE_API_KEY=あなたのAPIキー
   ```

3. 商品データの更新（任意）
   最新のショップ情報を取得したい場合は、スクレイピングスクリプトを実行してください。
   ```bash
   node scripts/scrape_shop.js
   ```
   ※ `data/shop_knowledge.json` にデータが保存されます。

4. 開発サーバーの起動
   ```bash
   npm run dev
   ```
   ブラウザで `http://localhost:3000` にアクセスしてください。

## 技術スタック
- Next.js (App Router)
- Google Generative AI (Gemini)
- Cheerio (Scraping)
- Vanilla CSS
