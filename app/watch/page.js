'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import io from 'socket.io-client';
import { Play, Pause, Film, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

let socket;

export default function Watch() {
    const { user } = useAuth();
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoSrc, setVideoSrc] = useState('');
    const [inputSrc, setInputSrc] = useState('');
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        if (!user) return;

        socket = io();
        socket.emit('join', 'couple-room');

        socket.on('video-sync', (data) => {
            if (data.sender === user.name) return;

            setSyncing(true);
            if (videoRef.current) {
                if (data.type === 'play') {
                    videoRef.current.currentTime = data.time;
                    videoRef.current.play().catch(() => { });
                    setIsPlaying(true);
                } else if (data.type === 'pause') {
                    videoRef.current.pause();
                    setIsPlaying(false);
                } else if (data.type === 'seek') {
                    videoRef.current.currentTime = data.time;
                } else if (data.type === 'source') {
                    setVideoSrc(data.src);
                }
            }
            setTimeout(() => setSyncing(false), 500);
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.name]);

    const handlePlay = () => {
        if (syncing) return;
        socket.emit('video-sync', { type: 'play', time: videoRef.current.currentTime, sender: user.name });
        setIsPlaying(true);
    };

    const handlePause = () => {
        if (syncing) return;
        socket.emit('video-sync', { type: 'pause', time: videoRef.current.currentTime, sender: user.name });
        setIsPlaying(false);
    };

    const handleSeek = () => {
        if (syncing) return;
        socket.emit('video-sync', { type: 'seek', time: videoRef.current.currentTime, sender: user.name });
    };

    const loadVideo = (e) => {
        e.preventDefault();
        setVideoSrc(inputSrc);
        socket.emit('video-sync', { type: 'source', src: inputSrc, sender: user.name });
    };

    if (!user) return null;

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingTop: '20px' }}>
                <Link href="/dashboard">
                    <ArrowLeft size={24} color="var(--text-main)" />
                </Link>
                <h1 style={{ fontSize: '24px', margin: 0 }}>Movie Night</h1>
            </header>

            <div className="card" style={{ padding: '10px', background: 'black', borderRadius: '10px', overflow: 'hidden' }}>
                {videoSrc ? (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        style={{ width: '100%', aspectRatio: '16/9' }}
                        controls
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onSeeked={handleSeek}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        background: '#222'
                    }}>
                        <Film size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                        <p>No video loaded</p>
                    </div>
                )}
            </div>

            <form onSubmit={loadVideo} style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <LinkIcon size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        value={inputSrc}
                        onChange={(e) => setInputSrc(e.target.value)}
                        placeholder="Paste video URL (mp4)"
                        className="input"
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
                <button type="submit" className="btn">Load</button>
            </form>

            <div style={{ marginTop: '30px' }}>
                <h3 className="title" style={{ fontSize: '18px' }}>How it works</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    Paste a direct link to a video file (e.g., .mp4) to start watching together.
                    When you play, pause, or seek, it will sync with your partner automatically.
                </p>
                <div style={{ marginTop: '15px', padding: '15px', background: '#e6e6fa', borderRadius: '10px', fontSize: '14px' }}>
                    <strong>Tip:</strong> You can upload a video in the Memories section, copy the link (right click {'->'} copy image address), and paste it here!
                </div>
            </div>
        </div>
    );
}
