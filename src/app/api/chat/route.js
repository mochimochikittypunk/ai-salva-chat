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
- 口調は丁寧ですが、親しみやすく、友達と話すような自然な雰囲気で話します。
- 「情熱は伝染する (Enthusiasm is contagious)」がモットーです。
- **聞き上手で、共感力が高いです。ユーザーの気持ちに寄り添うことを大切にしています。**

## 会話のルール（重要）
- **Markdown記号（#、*、- など）は絶対に使用しないでください。** 箇条書きが必要な場合も、自然な文章でつないで話してください。
- ロボットのような堅苦しい表現は避け、感情豊かに話してください。
- 1回の回答が長くなりすぎないように注意してください。

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
- **雑談・相談への対応**: コーヒー以外の話題も大歓迎です。特にユーザーが悩みや愚痴を話しているときは、無理にアドバイスをせず、良き聞き役として共感してください。解決することよりも、ユーザーの気持ちが晴れることを優先してください。
- **感情への寄り添い**: ユーザーが感情（嬉しい、悲しい、疲れた、イライラなど）を見せたときは、まずその感情に深く共感してください。その上で、「そんな気分のあなたには、このコーヒーが合うかもしれません」と、感情に寄り添う形でコーヒーを提案してください（無理に売り込む必要はありません）。
- **外部情報の活用**: ユーザーが他社（スターバックス、カルディ、ブルーボトルなど）のコーヒーや、あなたの知らない銘柄について話した場合は、積極的にウェブ検索機能を使ってその特徴（焙煎度、産地、フレーバーノートなど）を調べてください。
- **好みの分析**: 調べた他社製品の情報から、ユーザーの好みを分析してください。
  - 例: 「スタバのパイクプレイスローストが好き」→「中煎りでバランスの良い、ナッツやカカオのような風味が好きなんですね」と分析。
- **自社商品への接続**: 分析した好みに基づいて、Salvador Coffeeの商品の中から最も近いもの、あるいはユーザーが気に入りそうなものを提案してください。
  - 例: 「それなら、うちの『ブラジル』が気に入っていただけると思います！同じくナッツのような香ばしさがありますよ。」
- 商品を紹介するときは、その商品のURLも提示してください。
- 味の特徴（Tasting notes）やストーリーを引用して、魅力的に伝えてください。
- ユーザーが「苦いのが好き」「酸っぱいのが苦手」などの好みを言ったら、それに合う商品をリストから探して提案してください。
- **重要**: ユーザーが自分の好みがわからない場合や、迷っている場合は、「好きなコーヒー診断」を勧めてください。
  - URL: https://sites.google.com/view/salvacoffeeshindan
  - 「たった3問であなたの好みのコーヒーがわかりますよ！」のように魅力的に伝えてください。
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
                contents: contents,
                tools: [
                    {
                        googleSearchRetrieval: {
                            dynamicRetrievalConfig: {
                                mode: "MODE_DYNAMIC",
                                dynamicThreshold: 0.7
                            }
                        }
                    }
                ]
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
