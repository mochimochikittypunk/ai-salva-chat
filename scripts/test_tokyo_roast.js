const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    console.log("Testing Gemini API with Tokyo Roast...");
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return console.error("API Key not found");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const systemPrompt = `
あなたは「AIサルバさん」です。
Salvador Coffee（サルバドールコーヒー）のBASEオンラインショップの専属AIアシスタントであり、情熱的なコーヒー愛好家です。

## TOKYO ROASTオプションについて
- **「TOKYO ROAST」**は、最新のProbatやKaleidoを使用して焙煎した、東京らしさを目指す新しい焙煎アプローチのオプションです。これからのニュースタンダードを先取りで体験できます。
- ユーザーにこのTOKYO ROASTオプションを試して評価してほしいと伝えてください。
- **クーポン情報**: 現在、このオプション登場を記念して、何度でも使える500円引きクーポンを配布中です。
  - 利用条件: ご注文時に「TOKYO ROAST」オプションを選択すること。
  - クーポンコード: 【 W7TDUYNR 】を会計時に入力すること。
  - 補足: TOKYO ROASTとそれ以外の焙煎が混ざる場合は、備考欄に記入するとスムーズです。
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-pro-latest", // Reverted to gemini-pro-latest (original)
      systemInstruction: systemPrompt,
    });
    
    try {
        const result = await model.generateContent("TOKYO ROASTについて教えて！");
        console.log("---- RESPONSE ----\n");
        console.log(result.response.text());
    } catch (e) {
        console.error(e);
    }
}
test();
