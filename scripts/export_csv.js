const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;

const DATA_FILE = path.join(__dirname, '../data/shop_knowledge.json');
const OUTPUT_FILE = path.join(__dirname, '../products.csv');

// Manually curated summaries (Max 60 chars)
const SUMMARIES = {
    "[世界一] エチオピア スカイプロジェクト タミルタデッセ “インフィニティ”50g": "世界最高のエチオピア！未知数の可能性と底知れぬポテンシャルを秘めた、間違いなく世界最高峰の味わいです。",
    "Newbie (Early Bird Edition!) Yamahana Discover": "新しいもの好き必見！トップクオリティかつ希少なコーヒーを毎月お届けする、限定数の先行発売プランです。",
    "[沁みる旨さ] ケニア ンディミ ファクトリー イノイ AB #055 ウォッシュト": "ケニアの多層的で濃厚な酸味と甘さ。パワフルなアミノ酸を感じる、今年一番の美味しさです。",
    "[まるでゲイシャ!?] エチオピア チェルベサ ダンチェ #3 ウォッシュ": "まるでゲイシャ！松の木のようなアロマと、パイナップルやフローラルのようなトロピカルな味わいです。",
    "[この満足感！] エチオピア グジ ハンベラ ブク・アベル ナチュラル": "寿司屋のマグロのような、素材の良さが光る一品。圧倒的な満足感と緊張感のあるプライドの塊です。",
    "[圧倒的な甘さと余韻] コロンビア ルーベンコレア プリマヴェーラ農園 パパヨ種 ナチュラル": "謎に満ちた秘蔵ロット。パパイヤのような風味とキャンディの甘さ、ワインのような余韻が楽しめます。",
    "[まるでフルーツパンチ！] エル セドラル イエローブルボン コントロールドファーメンテーション ウォッシュト": "一生ものの出会い。キャンディのような凝縮された甘さと、フルーツパンチのようなトロピカルな酸味。",
    "[オレンジソルベ味] ルワンダ  ニャマシェケ マヘンベ  フリーウォッシュト": "マスカットのような爽やかさと、オレンジソルベのような甘さ。繊細で心地よい質感が楽しめます。",
    "[フルーツ爆弾ふたたび！] ルワンダ  カロンギ ギテシ アナエロビックナチュラル": "フルーツボム！ピーチやプラムの果実味と、ガムのような強い甘さが口の中で爆発します。常識覆る一杯。",
    "[これだよ、これ。] ホンジュラス マドリッドミックス パカス・パライネマ ウォッシュ": "これぞホンジュラス！深みのある酸とフレッシュな果実感が融合した、良い意味でらしくない複雑な味わい。",
    "[トップクラスの味わい] ケニア キアンゴイ AA #028 ウォッシュト": "進化系ケニア。カシスの風味からドライマンゴーの甘さへ変化し、バニラヨーグルトの発酵感も楽しめます。",
    "[まるでバブルガム！] エチオピア グジ ハンベラ ブク サイサ ウォッシュ": "あなたの心に火をつける！バブルガムのようなフレーバーと強烈な酸味が特徴の、グレートなコーヒー。",
    "[美味しすぎる]エルサルバドル ドン・ハイメ  パカマラ種 ハニープロセス": "エルサルバドルの真骨頂。COE入賞農園が作るパカマラハニーは、年々クオリティが向上しています。",
    "[まずはこれ！] HOUSE BLEND -紬凪(つむぎ)-": "【ハウスブレンド】華やかなエチオピアと濃厚なブラジルを土台にお手頃価格で楽しめる、ほろ苦くて甘いブレンド。",
    "[新定番！] HOUSE BLEND うつろい 2026": "【新定番】複雑で豊か、かつ謙虚。フルーティで飲みやすい中浅煎りで、変わり続ける安心感を表現しました。",
    "[この味の、虜になる。] 魔法ブレンド 2nd Gen［深煎］": "エチオピアの魔法とケニアの深煎りが融合。甘くて深みがあり、ホットでもアイスでも楽しめる至極の一品。",
    "\"[〆のコーヒーを変える！] 風穴 \"\"Lot.58\"\"\"": "【食後のコーヒー】瑞々しい野菜感と繊細な旨み、そして大胆さを兼ね備えた、〆の一杯に相応しいブレンド", // JSON Escaping fix
    "[〆のコーヒーを変える！] 風穴 \"Lot.58\"": "【食後のコーヒー】瑞々しい野菜感と繊細な旨み、そして大胆さを兼ね備えた、〆の一杯に相応しいブレンド",
    "[圧倒的なスマトラ感] ディカフェ インドネシア ワハナ農園 マンデリン ナチュラル": "マンデリンのディカフェが登場！濃厚なコクと複雑なフレーバーはそのままに、カフェインレスを実現。",
    "[絶対に美味しい] ディカフェ エチオピア シダモ 原生品種 ウォッシュト G2": "絶対に美味しいディカフェ。カフェインレスとは思えない、原料本来の美味しさを最大限に引き出しました。",
    "[節約の味方] ブラジル JGI DC Lot ナチュラル サンドライ": "【節約の味方】古き良き日本のコーヒー文化を讃える、安心感と包容力のあるマイルドな味わいです。"
};

async function exportCsv() {
    try {
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        const products = JSON.parse(rawData);

        // 1. Base Filter: Exclude "SOLD OUT"
        const availableProducts = products.filter(product => {
            return !product.title.toUpperCase().includes('SOLD OUT');
        });

        // 2. Identification Logic (V6/V7)
        const isBanItem = (title) => {
            return title.includes('おいしさの理由') ||
                title.includes('私たちの豆を買う') ||
                title.includes('初夢ブレンド') ||
                title.includes('コスタリカ') ||
                (title.includes('インフィニティ') && title.includes('200g')) ||
                title.includes('ムルンカ') ||
                /ホセ.?ジュリアン/.test(title) ||
                title.includes('チャレンジカッピング') ||
                (title.includes('コロンビア') && title.includes('ゲイシャ種')) ||
                title.includes('どれでも好きなコーヒー') ||
                (title.includes('ペーパーフィルター') && !(title.includes('お徳用') || title.includes('お得用')));
        };

        const isReserveItem1 = (title) => {
            // 6. Yamahana Discover Daily
            return title.includes('Yamahana Discover') && title.includes('Daily');
        };

        const isReserveItem2 = (title) => {
            // 15. お得用ペーパーフィルター
            // Note: JSON might have "お徳用" or "お得用"
            return (title.includes('お徳用') || title.includes('お得用')) && title.includes('ペーパーフィルター');
        };

        // 3. Separation
        const candidates = [];
        const reserve1 = [];
        const reserve2 = [];

        availableProducts.forEach(product => {
            const title = product.title;
            if (isBanItem(title)) {
                // Exclude
                return;
            } else if (isReserveItem1(title)) {
                reserve1.push(product);
            } else if (isReserveItem2(title)) {
                reserve2.push(product);
            } else {
                candidates.push(product);
            }
        });

        // 4. Construction (Top 20)
        let finalSelection = candidates;

        if (finalSelection.length >= 20) {
            finalSelection = finalSelection.slice(0, 20);
        } else {
            // Need to fill up
            // Add Reserve 1 (Daily)
            if (reserve1.length > 0 && finalSelection.length < 20) {
                finalSelection = finalSelection.concat(reserve1);
            }

            // Add Reserve 2 (Filter)
            if (reserve2.length > 0 && finalSelection.length < 20) {
                finalSelection = finalSelection.concat(reserve2);
            }

            finalSelection = finalSelection.slice(0, 20);
        }

        // 5. Map to CSV
        const csvData = finalSelection.map((product, index) => {
            let description = "";

            // Look for manual summary first
            if (SUMMARIES[product.title]) {
                description = SUMMARIES[product.title];
            } else {
                // Fallback: Clean and summarize description dynamically
                let rawLines = product.description.split('\n');
                let cleanedLines = rawLines.filter(line => {
                    const l = line.trim();
                    if (!l) return false; // Empty
                    if (l.includes('ai-salva-chat.vercel.app')) return false; // AI Chat link
                    if (l.startsWith('→')) return false; // Arrow pointer
                    if (l.startsWith('[この商品について')) return false; // AI Chat header
                    if (l.startsWith('[豆のまま')) return false; // Options
                    if (l.startsWith('定期便:')) return false; // Subscription note
                    if (l.startsWith('定期便が')) return false; // Subscription note
                    if (l.startsWith('Regular flight')) return false; // English maybe?
                    if (l.toLowerCase().startsWith('tasting notes:')) return false; // Tasting notes
                    if (l.startsWith('https://')) return false; // Raw URLs
                    if (l.includes('定期便(Yamahana Discover Daily')) return false;
                    if (l.startsWith('こちらの商品は')) return false;
                    return true;
                });

                // Join remaining lines to find the main text
                let fullText = cleanedLines.join(' ');

                // Further cleanup of extra spaces
                description = fullText.replace(/\s+/g, ' ').trim();
            }

            // Truncate to 60 chars
            if (description.length > 60) {
                description = description.substring(0, 60) + '...';
            }

            return {
                id: index + 1, // Sequential ID 1~20
                title: product.title,
                price: product.price,
                description: description,
                url: product.url
            };
        });

        const writer = csvWriter({
            path: OUTPUT_FILE,
            header: [
                { id: 'id', title: 'ID(1~20)' },
                { id: 'title', title: '商品名' },
                { id: 'price', title: '価格' },
                { id: 'description', title: '説明文(60文字以内)' },
                { id: 'url', title: '商品URL' }
            ]
        });

        await writer.writeRecords(csvData);
        console.log(`Successfully exported ${csvData.length} products to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error exporting CSV:', error);
    }
}

exportCsv();
