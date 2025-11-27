'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Upload, Heart, X, Maximize2, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function Gallery() {
    const { user, loading } = useAuth();
    const router = useRouter(); // Need to import useRouter
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
            return;
        }
        if (user) {
            fetchPhotos();
        }
    }, [user, loading, router]);

    const fetchPhotos = async () => {
        const res = await fetch('/api/photos');
        const data = await res.json();
        setPhotos(data);
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        await fetch('/api/photos', {
            method: 'POST',
            body: formData,
        });

        setUploading(false);
        fetchPhotos();
    };

    const handleDelete = async (photo) => {
        if (!confirm('Are you sure you want to delete this memory?')) return;

        await fetch('/api/photos', {
            method: 'DELETE',
            body: JSON.stringify({ id: photo.id, filename: photo.filename }),
        });

        setSelectedPhoto(null);
        fetchPhotos();
    };

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    if (!user) return null;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingTop: '20px' }}>
                <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>←</span>
                    <h1 style={{ fontSize: '24px', margin: 0 }}>Memories</h1>
                </Link>
                <label className="btn" style={{ cursor: 'pointer' }}>
                    {uploading ? 'Uploading...' : <><Upload size={20} /> Upload Photo</>}
                    <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
                </label>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        className="card"
                        style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', height: '150px', position: 'relative' }}
                        onClick={() => setSelectedPhoto(photo)}
                    >
                        <img
                            src={`/uploads/${photo.filename}`}
                            alt="Memory"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {photo.is_favorite === 1 && (
                            <div style={{ position: 'absolute', top: '5px', right: '5px', color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                                <Heart fill="currentColor" size={16} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedPhoto && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.9)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <button
                        onClick={() => setSelectedPhoto(null)}
                        style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', background: 'none' }}
                    >
                        <X size={32} />
                    </button>

                    <button
                        onClick={() => handleDelete(selectedPhoto)}
                        style={{ position: 'absolute', top: '20px', left: '20px', color: 'white', background: 'none' }}
                        title="Delete Photo"
                    >
                        <Trash2 size={32} />
                    </button>

                    <img
                        src={`/uploads/${selectedPhoto.filename}`}
                        alt="Full view"
                        style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '10px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                    />

                    <div style={{ marginTop: '20px', color: 'white', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', opacity: 0.7 }}>{new Date(selectedPhoto.created_at).toLocaleDateString()}</p>
                        {selectedPhoto.caption && <p style={{ fontSize: '18px', marginTop: '10px' }}>{selectedPhoto.caption}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
