'use client';

import { useState, useRef, useEffect } from 'react';

// Simple UUID generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const GREETINGS = [
    "こんにちは！何かお困りですか？",
    "こんにちは！今日はどうされましたか？",
    "こんにちは！元気ですか〜？",
    "こんにちは！突然ですが、わたし占いもできるんです！",
    "こんにちは！何でも相談してくださいね！"
];

export default function Home() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
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

    return (
        <div className="container">
            <header className="header">
                <div className="header-content">
                    {/* Link to the online shop */}
                    <a href="https://salvador.supersale.jp/" target="_blank" rel="noopener noreferrer" className="logo-text">
                        SALVADOR COFFEE
                    </a>
                    <div className="logo-sub">AI Assistant</div>
                </div>
            </header>

            <div className="chat-container">
                <div className="chat-window">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            <div className="message-role">
                                {msg.role === 'bot' ? 'AI Salva-san' : 'You'}
                            </div>
                            {msg.content.split('\n').map((line, i) => (
                                <span key={i}>
                                    {line}
                                    <br />
                                </span>
                            ))}
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
                </form>
            </div>
        </div>
    );
}
