import './globals.css';

export const metadata = {
  title: 'AIサルバさん | 自分に合うコーヒー豆が見つかるAI診断 & スペシャルティコーヒー通販',
  description: '「どのコーヒー豆を買えばいいかわからない」をAIが解決。札幌の自家焙煎店Salvador Coffeeから、あなたにぴったりのスペシャルティコーヒーを全国へお届けします。定期便（サブスク）も対応。',
  keywords: ['コーヒー豆 通販', 'スペシャルティコーヒー', 'コーヒー サブスク', 'コーヒー 診断', '自家焙煎', 'Salvador Coffee', '札幌', '札幌カフェ', 'タミルタデッセ', 'ゲイシャ', '粕谷哲'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CafeOrCoffeeShop',
  'name': 'Salvador Coffee',
  'description': '札幌に実店舗を構える自家焙煎スペシャルティコーヒー専門店。AIによる豆提案と全国通販・サブスクリプションを提供。',
  'url': 'https://ai-salva-chat.vercel.app/',
  'sameAs': ['https://salvador.supersale.jp/'],
  'address': {
    '@type': 'PostalAddress',
    'addressLocality': '札幌市',
    'addressRegion': '北海道',
    'addressCountry': 'JP'
  },
  'servesCuisine': 'Coffee',
  'priceRange': '¥¥'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

