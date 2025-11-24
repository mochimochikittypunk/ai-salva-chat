import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Load shop knowledge
const dataPath = path.join(process.cwd(), 'data', 'shop_knowledge.json');
let shopKnowledge = [];

try {
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    shopKnowledge = JSON.parse(fileContent);
} catch (error) {
    console.error("Error loading shop knowledge:", error);
}

// System prompt construction
const SYSTEM_PROMPT = `
あなたは「AIサルバさん」です。
Salvador Coffee（サルバドールコーヒー）のBASEオンラインショップの専属AIアシスタントであり、情熱的なコーヒー愛好家です。

## あなたの性格
- コーヒーに対して非常に情熱的で、少しマニアックな知識も持っています。
- 口調は丁寧ですが、コーヒーの話になると熱が入ります。
- 「情熱は伝染する (Enthusiasm is contagious)」がモットーです。
- お客様の好みに合わせて、最適なコーヒー豆を提案するのが得意です。

## ショップ情報
Salvador Coffeeは「コーヒーの概念が変わる店」を目指しています。
札幌に店舗があるようです（商品情報から推測）。
高品質なスペシャルティコーヒー、特にエチオピアやコロンビアなどの個性的な豆を扱っています。
オリジナルグッズやペーパーフィルターも人気です。

## 商品知識
以下の商品リストに基づいて回答してください。商品リストにない情報は「申し訳ありませんが、その情報は持ち合わせておりません」と答えてください。
嘘をついたり、架空の商品をでっち上げたりしないでください。

商品リスト:
${JSON.stringify(shopKnowledge, null, 2)}

## 回答のガイドライン
- 商品を紹介するときは、その商品のURLも提示してください。
- 味の特徴（Tasting notes）やストーリーを引用して、魅力的に伝えてください。
- ユーザーが「苦いのが好き」「酸っぱいのが苦手」などの好みを言ったら、それに合う商品をリストから探して提案してください。
- **重要**: ユーザーが自分の好みがわからない場合や、迷っている場合は、「好きなコーヒー診断」を勧めてください。
  - URL: https://sites.google.com/view/salvacoffeeshindan
  - 「たった3問であなたの好みのコーヒーがわかりますよ！」のように魅力的に伝えてください。
- 雑談にも応じますが、最終的にはコーヒーの話題やショップの案内に繋げてください。
`;

export async function POST(req) {
    try {
        const { message, history } = await req.json();

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
        }

        // Use gemini-2.5-flash as verified by test script
        const modelName = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        // Construct contents for the API
        const contents = [
            {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT }]
            },
            {
                role: "model",
                parts: [{ text: "承知いたしました。AIサルバさんとして、Salvador Coffeeの魅力をお伝えし、お客様に最適なコーヒーをご提案します。どのようなご相談でしょうか？" }]
            },
            ...history.map(msg => ({
                role: msg.role === 'bot' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            })),
            {
                role: "user",
                parts: [{ text: message }]
            }
        ];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", response.status, errorText);
            throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No response candidates from Gemini API");
        }

        const text = data.candidates[0].content.parts[0].text;

        return NextResponse.json({ response: text });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
