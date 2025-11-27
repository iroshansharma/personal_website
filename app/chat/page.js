'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Send, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import io from 'socket.io-client';
import Link from 'next/link';

let socket;

export default function Chat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        // Initialize socket
        socket = io();

        socket.emit('join', 'couple-room');

        socket.on('message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('typing', (data) => {
            if (data.user !== user.name) {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 3000);
            }
        });

        // Fetch history
        fetch('/api/messages')
            .then(res => res.json())
            .then(data => setMessages(data));

        return () => {
            socket.disconnect();
        };
    }, [user?.name]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const msg = {
            sender: user.name,
            content: input,
            type: 'text',
            timestamp: new Date().toISOString() // Optimistic update
        };

        socket.emit('message', msg);
        setMessages((prev) => [...prev, msg]);
        setInput('');
    };

    const handleTyping = () => {
        socket.emit('typing', { user: user.name });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            // Stop typing logic if needed, but client handles timeout
        }, 1000);
    };

    if (!user) return null;

    return (
        <div className="container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '0' }}>
            <header style={{
                padding: '20px',
                background: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                zIndex: 10
            }}>
                <Link href="/dashboard">
                    <ArrowLeft size={24} color="var(--text-main)" />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                        {user.id === 'user1' ? '👩' : '🧑'}
                    </div>
                    <div>
                        <div style={{ fontWeight: '600' }}>{user.id === 'user1' ? 'Her' : 'Me'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--primary)' }}>{isTyping ? 'typing...' : 'Online'}</div>
                    </div>
                </div>
            </header>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                background: 'var(--background)'
            }}>
                {messages.map((msg, i) => {
                    const isMe = msg.sender === user.name;
                    return (
                        <div key={i} style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '70%',
                        }}>
                            <div style={{
                                padding: '12px 16px',
                                background: isMe ? 'var(--primary)' : 'white',
                                color: isMe ? 'white' : 'var(--text-main)',
                                borderRadius: isMe ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                wordBreak: 'break-word'
                            }}>
                                {msg.content}
                            </div>
                            <div style={{
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                marginTop: '5px',
                                textAlign: isMe ? 'right' : 'left'
                            }}>
                                {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div style={{ alignSelf: 'flex-start', padding: '10px 15px', background: 'white', borderRadius: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        ...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{
                padding: '20px',
                background: 'white',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                borderTop: '1px solid var(--secondary)'
            }}>
                <button type="button" style={{ color: 'var(--text-muted)', background: 'none' }}>
                    <ImageIcon size={24} />
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); handleTyping(); }}
                    placeholder="Type a message..."
                    className="input"
                    style={{ borderRadius: '25px', padding: '10px 20px' }}
                />
                <button type="submit" style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}
