'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import { Phone, PhoneOff, Video } from 'lucide-react';

let socket;

export default function CallNotification() {
    const { user } = useAuth();
    const router = useRouter();
    const [incomingCall, setIncomingCall] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        socket = io();
        socket.emit('join', 'couple-room');

        socket.on('call-offer', (data) => {
            if (data.sender === user.name) return;
            setIncomingCall(data);
            playRing();
        });

        socket.on('call-canceled', () => {
            setIncomingCall(null);
            stopRing();
        });

        return () => {
            socket.disconnect();
            stopRing();
        };
    }, [user]);

    const playRing = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/ringtone.mp3'); // Assuming a ringtone exists or fallback
            // Fallback to oscillator if no file
            if (!audioRef.current.src || audioRef.current.error) {
                // We'll use the oscillator approach from Call page if needed, but for now let's just use visual or simple beep
            }
        }
        // Simple beep loop for notification if no file
        // For this implementation, we'll stick to visual + simple beep logic if we can, 
        // but let's just use the visual notification for now to be safe and not annoy with constant beeping without user interaction
    };

    const stopRing = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const handleAccept = () => {
        stopRing();
        setIncomingCall(null);
        router.push('/call?type=video'); // Defaulting to video for now, or we could pass type in offer
    };

    const handleDecline = () => {
        stopRing();
        setIncomingCall(null);
        // socket.emit('call-rejected', { sender: user.name }); // Optional: notify caller
    };

    if (!incomingCall) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px',
            border: '1px solid rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '10px',
                    height: '10px',
                    background: '#4CAF50',
                    borderRadius: '50%',
                    animation: 'pulse 1.5s infinite'
                }} />
                <span style={{ fontWeight: '600', fontSize: '16px' }}>Incoming Call</span>
            </div>

            <div style={{ fontSize: '14px', color: '#666' }}>
                {incomingCall.sender} is calling...
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
                <button
                    onClick={handleDecline}
                    style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: '#ff4500',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <PhoneOff size={24} />
                </button>

                <button
                    onClick={handleAccept}
                    style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Video size={24} />
                </button>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
                }
            `}</style>
        </div>
    );
}
