'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Heart } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [step, setStep] = useState('name'); // 'name' or 'pin'
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      setStep('pin');
      setError('');
    } else {
      setError('Please enter your name');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple PIN check - in a real app this should be secure
    if (pin === '1234') {
      login({ 
        id: name.toLowerCase().replace(/\s/g, '_'), 
        name: name, 
        avatar: '👤' 
      });
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

        {step === 'name' ? (
          <form onSubmit={handleNameSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What's your name?"
                className="input"
                style={{ marginBottom: '20px', textAlign: 'center' }}
                autoFocus
              />
            </div>
            {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
            <button type="submit" className="btn" style={{ width: '100%' }}>
              Next
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>👤</div>
              <h3>Welcome, {name}</h3>
              <button
                type="button"
                onClick={() => {
                  setStep('name');
                  setPin('');
                  setError('');
                }}
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
