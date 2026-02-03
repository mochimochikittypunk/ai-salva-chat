'use client';

import React from 'react';

export default function InfoModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content info-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <div className="modal-body info-modal-body">
                    <article>
                        <h1>専属のAIエージェントがあなた好みのスペシャルティコーヒーをご提案</h1>
                        <p>
                            ネット通販でコーヒー豆を買うとき、「酸味が少なめ」「苦味が強い」といった説明だけでは、本当に自分の好みに合うかわからず失敗してしまうことがありませんか？
                        </p>
                        <p>
                            <strong>AIサルバさん</strong>は、あなたとの対話を通じて好みを深く分析し、最適なコーヒー豆をご提案するAIエージェントです。「苦いのは苦手」「朝にすっきり飲みたい」「チョコレートのような風味が好き」など、気軽に話しかけるだけで、あなたにぴったりの一杯を見つけられます。もう、コーヒー選びで失敗することはありません。
                        </p>

                        <h2>札幌の自家焙煎店から、焙煎したての香りを全国へお届け</h2>
                        <p>
                            AIサルバさんがご紹介するコーヒー豆は、すべて札幌・石山通にある<strong>Salvador Coffee（サルバドールコーヒー）</strong>から直送されます。
                        </p>
                        <p>
                            Salvador Coffeeは、日本一に輝いた実績を持つ焙煎技術と、産地まで足を運ぶこだわりの買付で知られる自家焙煎スペシャルティコーヒー専門店です。ご注文を受けてから焙煎し発送するため、届いた瞬間から新鮮な香りをお楽しみいただけます。タミル・タデッセ氏の農園から届くエチオピア豆や、希少なゲイシャ種など、厳選された銘柄を取り揃えています。
                        </p>

                        <h2>毎日のコーヒーを迷わない。お得な定期便（サブスク）</h2>
                        <p>
                            毎回どの豆を買うか悩んだり、注文の手間が面倒という方には、<strong>定期便（サブスクリプション）</strong>がおすすめです。
                        </p>
                        <p>
                            あなたの好みに合わせてセレクトした豆や、毎月届く新商品コーヒー豆が定額でご自宅に届きます。忙しい毎日でも、いつでも美味しいコーヒーを切らすことなくお楽しみいただけます。
                        </p>

                        <h2>AIサルバさんの使い方</h2>
                        <p>
                            使い方はとても簡単です。「苦くないのがいい」「フルーティーなやつ」「仕事中に飲みたい」など、
                            <strong>友達に話しかけるように</strong>、今の気分や好みを伝えてください。
                        </p>
                        <p>
                            AIサルバさんがあなたにぴったりのコーヒーをご紹介し、そのまま<a href="https://salvador.supersale.jp/" target="_blank" rel="noopener noreferrer">Salvador Coffee 公式通販ページ</a>へご案内します。コーヒー初心者の方も、詳しい方も、ぜひお気軽にお試しください。
                        </p>
                    </article>
                </div>
            </div>
        </div>
    );
}
