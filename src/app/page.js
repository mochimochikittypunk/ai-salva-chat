'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'こんにちは！AIサルバさんです。コーヒーのことなら何でも聞いてくださいね！' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
