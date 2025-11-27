'use client';

import { useState, useEffect } from 'react';
import { Smile, Frown, Meh, Heart, Coffee, Sun, Moon, Cloud } from 'lucide-react';

const moods = [
    { icon: Smile, label: 'Happy', color: '#FFD700' },
    { icon: Heart, label: 'Loved', color: '#FF69B4' },
    { icon: Coffee, label: 'Chill', color: '#8B4513' },
    { icon: Sun, label: 'Energetic', color: '#FFA500' },
    { icon: Moon, label: 'Sleepy', color: '#483D8B' },
    { icon: Cloud, label: 'Sad', color: '#87CEEB' },
    { icon: Meh, label: 'Bored', color: '#808080' },
    { icon: Frown, label: 'Upset', color: '#FF4500' },
];

export default function MoodStatus({ user }) {
    const [currentMood, setCurrentMood] = useState(null);
    const [partnerMood, setPartnerMood] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchMoods();
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchMoods, 30000);
        return () => clearInterval(interval);
    }, [user.name]);

    const fetchMoods = async () => {
        try {
            const res = await fetch('/api/mood');
            const data = await res.json();

            const myMoodData = data.find(m => m.user === user.name);
            const partnerMoodData = data.find(m => m.user !== user.name);

            if (myMoodData) {
                const mood = moods.find(m => m.label === myMoodData.status);
                if (mood) setCurrentMood(mood);
            }

            if (partnerMoodData) {
                const mood = moods.find(m => m.label === partnerMoodData.status);
                if (mood) setPartnerMood({ ...mood, user: partnerMoodData.user });
            }
        } catch (err) {
            console.error('Error fetching moods:', err);
        }
    };

    const handleSetMood = async (mood) => {
        setCurrentMood(mood);
        setIsEditing(false);

        await fetch('/api/mood', {
            method: 'POST',
            body: JSON.stringify({ user: user.name, status: mood.label }),
        });

        fetchMoods();
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Moods</h3>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    style={{ color: 'var(--primary)', background: 'none', fontSize: '14px' }}
                >
                    {isEditing ? 'Cancel' : 'Update My Mood'}
                </button>
            </div>

            {isEditing ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {moods.map((m) => (
                        <button
                            key={m.label}
                            onClick={() => handleSetMood(m)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '10px',
                                background: currentMood?.label === m.label ? 'var(--secondary)' : 'transparent',
                                borderRadius: '10px',
                                border: '1px solid transparent'
                            }}
                        >
                            <m.icon color={m.color} size={24} />
                            <span style={{ fontSize: '12px', marginTop: '5px' }}>{m.label}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* My Mood */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {currentMood ? (
                            <>
                                <div style={{
                                    padding: '15px',
                                    background: 'var(--secondary)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <currentMood.icon color={currentMood.color} size={32} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Me</div>
                                    <div style={{ fontWeight: '600', fontSize: '18px' }}>{currentMood.label}</div>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Update your mood...</div>
                        )}
                    </div>

                    {/* Partner Mood */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', opacity: partnerMood ? 1 : 0.5 }}>
                        {partnerMood ? (
                            <>
                                <div style={{
                                    padding: '15px',
                                    background: '#f0f0f0',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <partnerMood.icon color={partnerMood.color} size={32} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Partner</div>
                                    <div style={{ fontWeight: '600', fontSize: '18px' }}>{partnerMood.label}</div>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Waiting for partner...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
