const fs = require('fs');
const path = require('path');

// Simulate the discontinued URL detection logic
// This test verifies that if a product URL appears in the discontinued HTML,
// it gets correctly flagged regardless of description text.

const dataPath = path.join(__dirname, '../data/shop_knowledge.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Simulate what the discontinued category page would contain
// These are the URLs of products known to be in the 終売商品 category
const simulatedDiscontinuedUrls = new Set([
  'https://salvador.supersale.jp/items/97291503',   // エチオピア タミルタデッセ アロベリー
  'https://salvador.supersale.jp/items/78279803',   // 中国 雲南省 保山
  'https://salvador.supersale.jp/items/94699017',   // 中国 雲南省 西双版納
  'https://salvador.supersale.jp/items/111208414',  // ホンジュラス マドリッドミックス
  'https://salvador.supersale.jp/items/107958273',  // エチオピア ブク サイサ
  'https://salvador.supersale.jp/items/135456885',  // こころみ Lot.01
  'https://salvador.supersale.jp/items/114294224',  // ルワンダ ギテシ (NEW - added to discontinued)
]);

console.log('=== Simulating parse_shop_html.js with discontinued URL detection ===');
console.log(`Simulated discontinued URLs: ${simulatedDiscontinuedUrls.size}`);
console.log('');

let autoMarkedCount = 0;
data.forEach(p => {
  const isDiscontinuedByCategory = simulatedDiscontinuedUrls.has(p.url);
  const isDiscontinuedByDescription = p.description && p.description.includes('こちらは終売商品です');

  if (isDiscontinuedByCategory && !isDiscontinuedByDescription) {
    autoMarkedCount++;
    console.log(`[AUTO-MARKED] "${p.title}"`);
    console.log(`  URL: ${p.url}`);
    console.log(`  → Would auto-add "こちらは終売商品です。" to description`);
    console.log(`  → Would set discontinued: true`);
    console.log('');
  }
});

console.log(`=== Results ===`);
console.log(`Products that would be auto-marked: ${autoMarkedCount}`);

// Final check: count total discontinued after URL detection
const totalDiscontinued = data.filter(p => {
  return simulatedDiscontinuedUrls.has(p.url) || 
    (p.description && p.description.includes('こちらは終売商品です'));
}).length;
console.log(`Total discontinued after URL detection: ${totalDiscontinued}`);

// Verify ギテシ specifically
const giteshi = data.find(p => p.title.includes('ギテシ'));
if (giteshi) {
  const detected = simulatedDiscontinuedUrls.has(giteshi.url);
  console.log('');
  console.log(`=== ギテシ Verification ===`);
  console.log(`URL: ${giteshi.url}`);
  console.log(`Detected by category URL: ${detected ? 'YES ✓' : 'NO ✗'}`);
  console.log(`Result: ${detected ? 'WOULD BE AUTO-MARKED AS DISCONTINUED ✓' : 'STILL ACTIVE ✗'}`);
}
