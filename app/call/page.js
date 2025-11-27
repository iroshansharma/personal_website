'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useSearchParams, useRouter } from 'next/navigation';
import io from 'socket.io-client';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';

let socket;
let peerConnection;

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
};

function CallContent() {
    const { user, loading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get('type') || 'video';

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [status, setStatus] = useState('Initializing...');

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const audioContextRef = useRef(null);
    const oscillatorRef = useRef(null);

    const playRing = () => {
        if (typeof window === 'undefined') return;
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4

        // Ringing pattern (beep-beep... beep-beep)
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.loop = true; // Not really looping the envelope, but keeping it alive

        // Re-trigger envelope loop manually or just simple beep for now
        // Let's make it a simple repeating beep for simplicity
        oscillator.stop();

        // Better approach: Interval based beeps
        const beep = () => {
            if (!audioContextRef.current) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 440;
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + 1);
        };

        beep();
        oscillatorRef.current = setInterval(beep, 3000);
    };

    const stopRing = () => {
        if (oscillatorRef.current) {
            clearInterval(oscillatorRef.current);
            oscillatorRef.current = null;
        }
    };

    useEffect(() => {
        if (!user) return;

        socket = io();
        socket.emit('join', 'couple-room');

        startLocalStream();

        socket.on('call-offer', async (offer) => {
            if (offer.sender === user.name) return;
            console.log('Received offer');
            setStatus('Incoming call...');
            playRing();
            createPeerConnection();
            await peerConnection.setRemoteDescription(offer.sdp);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('call-answer', { sdp: answer, sender: user.name });
        });

        socket.on('call-answer', async (answer) => {
            if (answer.sender === user.name) return;
            console.log('Received answer');
            setStatus('Connected');
            stopRing();
            if (!peerConnection.currentRemoteDescription) {
                await peerConnection.setRemoteDescription(answer.sdp);
            }
        });

        socket.on('ice-candidate', async (candidate) => {
            if (candidate.sender === user.name) return;
            if (peerConnection) {
                await peerConnection.addIceCandidate(candidate.candidate);
            }
        });

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnection) {
                peerConnection.close();
            }
            if (socket) socket.disconnect();
            stopRing();
        };
    }, [user?.name, type]);

    const startLocalStream = async () => {
        if (typeof navigator === 'undefined') return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true
            });
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setStatus('Ready to call');
        } catch (err) {
            console.error('Error accessing media devices:', err);
            setStatus('Error accessing camera/mic');
        }
    };

    const createPeerConnection = () => {
        if (typeof window === 'undefined' || !window.RTCPeerConnection) return;
        peerConnection = new RTCPeerConnection(servers);

        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }

        peerConnection.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { candidate: event.candidate, sender: user.name });
            }
        };
    };

    const startCall = async () => {
        setStatus('Calling...');
        createPeerConnection();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('call-offer', { sdp: offer, sender: user.name });
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream && type === 'video') {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    const endCall = () => {
        router.push('/dashboard');
    };

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    if (!user) return null;

    return (
        <div style={{ height: '100vh', background: 'black', position: 'relative', overflow: 'hidden' }}>
            {/* Remote Video (Full Screen) */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {!remoteStream && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexDirection: 'column'
                }}>
                    <div style={{ fontSize: '24px', marginBottom: '20px' }}>{status}</div>
                    {status === 'Ready to call' && (
                        <button onClick={startCall} className="btn" style={{ fontSize: '18px', padding: '15px 40px' }}>
                            Start Call
                        </button>
                    )}
                </div>
            )}

            {/* Local Video (Picture in Picture) */}
            {type === 'video' && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '120px',
                    height: '160px',
                    background: '#333',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            )}

            {/* Controls */}
            <div style={{
                position: 'absolute',
                bottom: '30px',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'center',
                gap: '20px'
            }}>
                <button
                    onClick={toggleMute}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: isMuted ? 'white' : 'rgba(255,255,255,0.2)',
                        color: isMuted ? 'black' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    {isMuted ? <MicOff /> : <Mic />}
                </button>

                {type === 'video' && (
                    <button
                        onClick={toggleVideo}
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: isVideoOff ? 'white' : 'rgba(255,255,255,0.2)',
                            color: isVideoOff ? 'black' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        {isVideoOff ? <VideoOff /> : <VideoIcon />}
                    </button>
                )}

                <button
                    onClick={endCall}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: '#ff4500',
                        color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <PhoneOff />
                </button>
            </div>
        </div>
    );
}

export default function Call() {
    return (
        <Suspense fallback={<div>Loading call...</div>}>
            <CallContent />
        </Suspense>
    );
}
