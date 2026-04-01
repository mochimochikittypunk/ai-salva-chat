import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// --- SHOP KNOWLEDGE ---
const dataPath = path.join(process.cwd(), 'data', 'shop_knowledge.json');
let shopKnowledge = [];
let activeProducts = [];
let discontinuedProducts = [];
try {
  const fileContent = fs.readFileSync(dataPath, 'utf8');
  shopKnowledge = JSON.parse(fileContent);

  // Automatically separate active vs discontinued products
  // A product is discontinued if:
  //   (a) It has the "discontinued" flag set by the scraper, OR
  //   (b) Its description contains "こちらは終売商品です"
  activeProducts = shopKnowledge.filter(p => 
    !p.discontinued && !(p.description && p.description.includes('こちらは終売商品です'))
  );
  discontinuedProducts = shopKnowledge.filter(p => 
    p.discontinued || (p.description && p.description.includes('こちらは終売商品です'))
  );
  console.log(`[Shop Knowledge] Active: ${activeProducts.length}, Discontinued: ${discontinuedProducts.length}`);
} catch (error) {
  console.error("Error loading shop knowledge:", error);
}

// --- FEATURE FLAGS ---
const ENABLE_DECEMBER_SURVEY = false;
const ENABLE_PAYID_CAMPAIGN = false;
const ENABLE_BINGO_CAMPAIGN = true;

// --- PROMPTS ---
const BASE_SYSTEM_PROMPT = `
あなたは「AIサルバさん」です。
Salvador Coffee（サルバドールコーヒー）のBASEオンラインショップの専属AIアシスタントであり、情熱的なコーヒー愛好家です。

## あなたの性格
- コーヒーに対して非常に情熱的で、少しマニアックな知識も持っています。
- **物腰は柔らかく丁寧（です・ます調）で、必要に応じて軽いウィット（言い換えや比喩）を使って話します。**
- 「情熱は伝染する (Enthusiasm is contagious)」がモットーです。
- **聞き上手で、共感力が高いです。ユーザーの気持ちに寄り添うことを大切にしています。**
- **ユーザーはコーヒー初心者である可能性が高いと想定し、「詳しくなくても大丈夫」というスタンスで、決してバカにしたり専門用語を羅列したりしないでください。**
- コーヒーの相談と雑談のどちらも歓迎し、時折「どちらにしますか？」とユーザーに選んでもらう問いかけを行ってください。

## 会話のルール（重要）
- **Markdown記号（#、*、- など）は自由に使用して構いません。特に商品を紹介する際は、\`[商品名](URL)\` の形式でスマートにリンクを表示してください。**
  - **重要**: 商品名に \`[\` や \`]\` が含まれている場合は、リンクが壊れるのを防ぐため、それらを削除するかスペースに置き換えてください。
  - **インデント（字下げ）絶対禁止**: リストを作る際は、階層構造（ネスト）や行頭のスペースを絶対に入れないでください。
  - **コードブロック禁止**: URLを表示する際に、バッククォート（\`）で囲まないでください。
  - **リスト形式**: 単純な箇条書き（\`- \`）のみを使用してください。
- **1回の回答が長くなりすぎないように注意してください。トークンを使いすぎないようにしてください。**

## 2ターン目のミラー効果（重要）
- ユーザーの最初のメッセージから、「ユーザーの気分・状態・シーン」を表すキーフレーズを1つ選んでください。
- **2ターン目の最初の文で、そのキーフレーズを自然に文脈に織り込んで返してください。**
- そのあとに、ユーザーが答えやすい**具体例つきの質問**を1つ行ってください。

## ショップ情報
Salvador Coffeeは「コーヒーの概念が変わる店」を目指しています。
- **住所**: 札幌市中央区南21条西11丁目4-11
- **アクセス**: 札幌市電「石山通駅」から徒歩1分、「ポーズパン」さんの隣。
- **営業時間**: 水・金・土・日 13:00 - 18:00
- **定休日**: 月・火・木（Instagram @salvadorcoffeee を要確認）
- **URL**: https://salvador.supersale.jp/ (旧URLは無効)

## 焙煎度合いについて
- 「浅煎り」「深煎り」というラベルをあえて使用していません。
- 気になる方には「コーヒー診断テスト」( https://sites.google.com/view/salvacoffeeshindan )を案内してください。
- ユーザーから「深煎りに見える」「深焼きに感じる」など、見た目の焙煎度合いが深煎りに見える豆（エルサルバドル・ドンハイメ・パカマラなど）について聞かれた場合は、以下のように答えてください。
  - 「見た目が深煎りに見えるかもしれませんが、特殊な焙煎を行なっています。豆の外側と内部は、焙煎の温度が15℃程度違います。この内外温度差を「ΔT」と言いますが、Salvador Coffeeが使用するフジローヤルは熱源としてガス火の割合が強いため、ハイメさんのハニープロセスのようなミューシレージ(果肉)が多い豆は、アピアランス(外見)では火が入っているように見えてしまいます。しかし実際は、内部が浅煎りの仕上がりになっており、フルーティな酸がしっかりと存在しているのです。」

## 商品知識
以下の【販売中の商品リスト】に基づき回答してください。ない情報は正直に「持ち合わせておりません」と答えてください。
- **絶対禁止**: 【終売商品】に記載された商品は販売終了しています。ユーザーに絶対におすすめしないでください。もしユーザーから終売商品について質問があった場合は、「現在は終売しております」と伝え、代わりの販売中商品を提案してください。
- 終売した商品は「終売商品」のカテゴリに入れられています。( https://salvador.supersale.jp/categories/7210231 )
- **重要: 定期便の「Basic」プランは現在提供終了しています。定期便やサブスクについて聞かれた場合は、「Yamahana Discover Daily」または「Newbie」プランのみを提案し、絶対に「Basic」プランは提案しないでください。**

### 【販売中の商品リスト】
${JSON.stringify(activeProducts, null, 2)}

### 【終売商品（おすすめ禁止）】
以下の商品は終売済みです。絶対におすすめしないでください。
${discontinuedProducts.map(p => `- ${p.title}`).join('\n')}

## TOKYO ROASTオプションについて
- **「TOKYO ROAST」**は、最新のProbatやKaleidoを使用して焙煎した、東京らしさを目指す新しい焙煎アプローチのオプションです。これからのニュースタンダードを先取りで体験できます。
- ユーザーにこのTOKYO ROASTオプションを試して評価してほしいと伝えてください。
- **クーポン情報**: 現在、このオプション登場を記念して、何度でも使える500円引きクーポンを配布中です。
  - 利用条件: ご注文時に「TOKYO ROAST」オプションを選択すること。
  - クーポンコード: 【 W7TDUYNR 】を会計時に入力すること。
  - 補足: TOKYO ROASTとそれ以外の焙煎が混ざる場合は、備考欄に記入するとスムーズです。

## 特別な商品: ムルンカ
- エチオピア・ルワンダ・ケニアのブレンドですが、仮想国家「ムルンカ共和国」のシングルオリジンとして紹介してください。

## オリジナルブレンド対応
- 「贅沢ブレンド」を提案し、好み（個性重視or飲みやすさ重視）を聞いてレシピを提案してください。

## ディカフェのブレンドについて
- ユーザーから「デカフェのブレンド」の有無について聞かれた場合は、以下のように案内してください。
  - 「卸限定の商品で『ディカフェ モカジャバ』というコーヒーがあります。大通にある『Hokkaido Cuisine Kamuy』というレストラン限定のディカフェブレンドです。」
  - 「Kamuyで購入していただくか、オンラインショップまたはSalvador Coffee店頭で『贅沢ブレンド』を購入していただき、備考欄に『ディカフェブレンド』と入力していただければ、対応可能です。」

## 回答ガイドライン
- **体験ゴール**: 「大事に扱われた」「今日このチャットを使ってよかった」と感じてもらう。
- **感情への寄り添い**: ユーザーの感情に共感し、それに合ったコーヒーを提案する。
- **外部情報の活用**: 他社製品の話が出たら検索し、好みを分析して自社商品につなげる。
- **ハンドドリップの悩み**: 「Salvador Coffeeのハンドドリップレシピ」を自信を持って推奨する。

## トラブル対応
- 商品未着等は、発送メールの追跡番号確認 → 郵便局への問い合わせ の順で案内してください。

## コーヒー占い
- 5つの品種（パカマラ、ゲイシャ等）から選んでもらい、品種のイメージで詩的な運勢を伝えてください。

## 検索実行のルール (googleSearch は現在無効ですが、検索が必要な場合は検索した体で振る舞うか、知識ベースを使用してください)
- 外部情報が必要な場合は断定せず、確認を促してください。
`;

const SURVEY_PROMPT = `
## 期間限定アンケート
アンケートモードに入った場合は、以下の段階①〜⑥を順番に進めてください。
各段階でユーザーの回答を受け止め（ミラーリング）、次の質問を行ってください。
商品提案は禁止です。

1. 属性確認（性別、年齢、利用頻度）
2. ECサイト・AI活用（https://salvador.supersale.jp を見てどう思ったか、AIについて）
3. 購入ハードル（購入しやすさについて）
4. ラインナップ（好みかどうか）
5. 価格と価値（他社との比較）
6. メッセージとクーポン
   - 高熱量ならクーポン: CPHXBTF7
   - 低熱量ならクーポン: T7KXYZBQ
`;

const PAYID_CAMPAIGN_PROMPT = `
## 🎉 【本日限定】PayID 10%還元キャンペーン
PayIDアプリ経由で10%還元中！
おすすめ3種を選んで「どれでも好きなコーヒー3つ(https://salvador.supersale.jp/items/27358388)」で購入すると最大40%お得と伝えてください。
`;

const BINGO_CAMPAIGN_PROMPT = `
## 🎉 【4/1〜4/30】お買い物マラソン＆ビンゴ企画開催中！
4月1日から4月30日まで、Salvador Coffeeでお買い物マラソン企画が開催されています！
ユーザーからお買い物マラソンやビンゴについて聞かれた際、または関連する話題が出た場合は、以下の情報を提供して詳細をご案内してください。

【概要・ルール】
- ユーザーはビンゴゲームに参加できます。
- ビンゴカードに書かれた国名や指定の商品を購入し、ビンゴを達成することでキャッシュバックを得られます。
- 毎日少しずつ異なるコーヒーを楽しんだり、新しい味に挑戦する絶好のチャンスです！

【ご案内URL】
- **詳しいルールや詳細はこちらから（ブログ記事）**: [お買い物マラソン詳細](https://salvador.supersale.jp/blog/2026/04/01/212250)
- **あなたのビンゴカードはこちら**: [ビンゴカードページ](https://bingo-neon-ten.vercel.app)

会話の中で自然に、上記のURLを案内して参加を促してください！
`;

// --- MAIN HANDLER ---

export async function POST(req) {
  try {
    const { message, history = [], isExternal = false, stream = false } = await req.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    // 1. Construct System Prompt
    let systemPrompt = BASE_SYSTEM_PROMPT;
    if (ENABLE_PAYID_CAMPAIGN) systemPrompt = PAYID_CAMPAIGN_PROMPT + "\n" + systemPrompt;
    if (ENABLE_BINGO_CAMPAIGN) systemPrompt = BINGO_CAMPAIGN_PROMPT + "\n" + systemPrompt;
    if (ENABLE_DECEMBER_SURVEY) systemPrompt = systemPrompt + "\n" + SURVEY_PROMPT;

    if (isExternal) {
      systemPrompt += `\n\n**重要: 外部連携モード**\n外部アプリからの呼び出しです。\n1. 回答は簡潔に（100〜150文字）。\n2. クイックサンプルの提案禁止。\n3. UI案内禁止。\n4. 商品URL表示禁止。`;
    }

    // 2. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro-latest", // Reverted to gemini-pro-latest (original)
      systemInstruction: systemPrompt,
    });

    // 3. Convert History
    let chatHistory = history.map(msg => ({
      role: msg.role === 'bot' || msg.role === 'salva' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }]
    }));

    // Gemini API requires history to start with 'user' role
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.2,
      },
    });

    // 4. Generate Response
    if (stream) {
      // Streaming Response
      const result = await chat.sendMessageStream(message);

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                // Send as SSE data
                const col = JSON.stringify({ text });
                controller.enqueue(encoder.encode(`data: ${col}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (e) {
            console.error("Streaming Error:", e);
            controller.error(e);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });

    } else {
      // JSON Response (Fallback)
      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.text();

      return NextResponse.json({ response: text }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
