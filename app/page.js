'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Heart } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const users = [
    { id: 'user1', name: 'Me', avatar: '🧑' },
    { id: 'user2', name: 'Her', avatar: '👩' }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple PIN check - in a real app this should be secure
    if (pin === '1234') {
      login(selectedUser);
    } else {
      setError('Incorrect PIN');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fff0f5 0%, #e6e6fa 100%)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px', color: 'var(--primary)' }}>
          <Heart size={48} fill="currentColor" />
        </div>
        <h1 className="title">Us Two</h1>
        <p style={{ marginBottom: '30px', color: 'var(--text-muted)' }}>Enter our private world</p>

        {!selectedUser ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>{user.avatar}</div>
                <div style={{ fontWeight: '600' }}>{user.name}</div>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>{selectedUser.avatar}</div>
              <h3>Welcome back, {selectedUser.name}</h3>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px', background: 'none', textDecoration: 'underline' }}
              >
                Not you?
              </button>
            </div>

            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN (1234)"
              className="input"
              style={{ marginBottom: '20px', textAlign: 'center', letterSpacing: '5px' }}
              maxLength={4}
              autoFocus
            />

            {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

            <button type="submit" className="btn" style={{ width: '100%' }}>
              Enter
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
