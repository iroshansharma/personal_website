'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import MoodStatus from '@/components/MoodStatus';
import { Image, MessageCircle, Phone, Video, Film, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [dates, setDates] = useState([]);
    const [showDateForm, setShowDateForm] = useState(false);
    const [newDate, setNewDate] = useState({ title: '', date: '' });

    useEffect(() => {
        if (!user) {
            router.push('/');
        } else {
            fetch('/api/dates').then(res => res.json()).then(setDates);
        }
    }, [user, router]);

    const addDate = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/dates', {
            method: 'POST',
            body: JSON.stringify(newDate),
        });
        const data = await res.json();
        setDates([...dates, data]);
        setNewDate({ title: '', date: '' });
        setShowDateForm(false);
    };

    const deleteDate = async (id) => {
        await fetch('/api/dates', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
        });
        setDates(dates.filter(d => d.id !== id));
    };

    if (!user) return null;

    const shortcuts = [
        { icon: Image, label: 'Memories', href: '/gallery', color: '#FF69B4' },
        { icon: MessageCircle, label: 'Chat', href: '/chat', color: '#87CEEB' },
        { icon: Phone, label: 'Call', href: '/call?type=audio', color: '#90EE90' },
        { icon: Video, label: 'Video', href: '/call?type=video', color: '#FFA500' },
        { icon: Film, label: 'Movies', href: '/watch', color: '#9370DB' },
    ];

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Heart fill="var(--primary)" color="var(--primary)" />
                    <h1 style={{ fontSize: '24px', margin: 0 }}>Us Two</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span>{user.name}</span>
                    <button onClick={logout} style={{ fontSize: '14px', color: 'var(--text-muted)', background: 'none' }}>Logout</button>
                </div>
            </header>

            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '5px' }}>Welcome back, {user.name}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Here's what's happening in our world.</p>
            </div>

            <MoodStatus user={user} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '20px' }}>
                {shortcuts.map((s) => (
                    <Link href={s.href} key={s.label}>
                        <div className="card" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '140px',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{
                                padding: '15px',
                                background: `${s.color}20`,
                                borderRadius: '50%',
                                marginBottom: '10px',
                                color: s.color
                            }}>
                                <s.icon size={32} />
                            </div>
                            <span style={{ fontWeight: '600' }}>{s.label}</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 className="title" style={{ fontSize: '18px', margin: 0 }}>Important Dates</h3>
                    <button onClick={() => setShowDateForm(!showDateForm)} style={{ fontSize: '20px', background: 'none', color: 'var(--primary)' }}>+</button>
                </div>

                {showDateForm && (
                    <form onSubmit={addDate} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Title"
                            value={newDate.title}
                            onChange={(e) => setNewDate({ ...newDate, title: e.target.value })}
                            className="input"
                            required
                        />
                        <input
                            type="date"
                            value={newDate.date}
                            onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                            className="input"
                            required
                        />
                        <button type="submit" className="btn">Add</button>
                    </form>
                )}

                {dates.map((d) => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--secondary)' }}>
                        <span>{d.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{new Date(d.date).toLocaleDateString()}</span>
                            <button onClick={() => deleteDate(d.id)} style={{ color: 'red', background: 'none', fontSize: '12px' }}>×</button>
                        </div>
                    </div>
                ))}
                {dates.length === 0 && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No dates added yet.</p>}
            </div>
        </div>
    );
}
