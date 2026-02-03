'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import TermsModal from '../components/TermsModal';
import InfoModal from '../components/InfoModal';

// Simple UUID generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const GREETINGS = [
    "こんにちは、サルバドールコーヒーのAIエージェント（サルバさん）です！\nコーヒーにちょっと興味を持ってくれた方の相談に乗るのが得意です〜。\nコーヒーに詳しくなくても大丈夫なので、\n「苦いのは少し苦手」「オシャレな一杯が飲みたい」「カフェインレスはある？」など、\n今の気持ちを一言だけ送ってみてください。お話しをしましょう！",
    "こんにちは、サルバドールコーヒーのAIエージェント（サルバさん）です〜\nコーヒー初心者さんの「どれを選べばいいか分からない」に答えるのがめっちゃ得意です。\nもちろん、軽い雑談だけでも大丈夫！\n「苦いのが苦手」「仕事の合間の一杯を探したい」など、\n思いついた一言をなんでも気楽に送ってみてね〜",
    "ようこそ、サルバドールコーヒーへ！\nここでは、AIエージェントのサルバさんが、今日の気分からぴったりのコーヒーや過ごし方を一緒に考えます。\n「とにかく眠い」「ご褒美がほしい」「今日の私に合う一杯は？」など、\nいまの気分を一言だけ教えてもらえれば、そこからご提案します。"
];

export default function Home() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Generate Session ID on mount
        setSessionId(generateUUID());

        // Set random greeting
        const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
        setMessages([
            { role: 'bot', content: randomGreeting }
        ]);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-record conversation when messages update (and it's not the initial state)
    useEffect(() => {
        if (messages.length > 1 && sessionId) {
            const recordSummary = async () => {
                try {
                    await fetch('/api/summary', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ history: messages, sessionId })
                    });
                    // Silent update, no alert needed
                } catch (error) {
                    console.error('Error auto-recording:', error);
                }
            };

            // Debounce slightly to avoid too many requests if rapid fire, 
            // but for now simple execution after state update is fine.
            // We only record after bot response to capture full context.
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'bot') {
                recordSummary();
            }
        }
    }, [messages, sessionId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, { role: 'bot', content: `申し訳ありません。エラーが発生しました。\n詳細: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayment = (e) => {
        e.preventDefault();
        const url = 'https://square.link/u/eTK8JEe2?src=embed';
        const title = 'Square Payment Links';

        // Some platforms embed in an iframe, so we want to top window to calculate sizes correctly
        const topWindow = window.top ? window.top : window;

        // Fixes dual-screen position                                Most browsers          Firefox
        const dualScreenLeft = topWindow.screenLeft !== undefined ? topWindow.screenLeft : topWindow.screenX;
        const dualScreenTop = topWindow.screenTop !== undefined ? topWindow.screenTop : topWindow.screenY;

        const width = topWindow.innerWidth ? topWindow.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        const height = topWindow.innerHeight ? topWindow.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

        const h = height * .75;
        const w = 500;

        const systemZoom = width / topWindow.screen.availWidth;
        const left = (width - w) / 2 / systemZoom + dualScreenLeft;
        const top = (height - h) / 2 / systemZoom + dualScreenTop;
        const newWindow = window.open(url, title, `scrollbars=yes, width=${w / systemZoom}, height=${h / systemZoom}, top=${top}, left=${left}`);

        if (window.focus && newWindow) newWindow.focus();
    };

    return (
        <div className="container">
            <header className="header">
                <div className="header-content">
                    {/* Link to the online shop */}
                    <a href="https://salvador.supersale.jp/" target="_blank" rel="noopener noreferrer" className="logo-text">
                        SALVADOR COFFEE
                    </a>
                    <div className="logo-sub">AI Assistant</div>
                    <div className="header-link" onClick={() => setIsModalOpen(true)}>利用規約</div>
                    <div className="header-link" onClick={() => setIsInfoModalOpen(true)}>Info</div>
                </div>
            </header>

            <div className="chat-container">
                <div className="chat-window">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            <div className="message-role">
                                {msg.role === 'bot' ? 'AI Salva-san' : 'You'}
                            </div>
                            <ReactMarkdown
                                remarkPlugins={[remarkBreaks, remarkGfm]}
                                components={{
                                    a: ({ node, ...props }) => (
                                        <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff', textDecoration: 'underline' }} />
                                    ),
                                    // Custom renderer for code blocks to prevent overflow
                                    pre: ({ node, ...props }) => (
                                        <pre {...props} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto' }} />
                                    )
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    ))}
                    {isLoading && <div className="loading">AIサルバさんが入力中...</div>}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="input-area-wrapper">
                <form onSubmit={handleSubmit} className="input-area">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="コーヒーについて聞いてみる..."
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()}>
                        送信
                    </button>
                    <button type="button" className="payment-btn" onClick={handlePayment}>
                        決済
                    </button>
                </form>
            </div>

            <TermsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
        </div>
    );
}
