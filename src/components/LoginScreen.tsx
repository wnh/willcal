import React, { useState } from 'react';
import { session } from '../client/api';

interface LoginScreenProps {
  onSignedIn: () => void;
}

export function LoginScreen({ onSignedIn }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!(await session.login(password))) {
        // The password was right but the cookie did not stick, so signing in
        // would just bounce straight back here.
        setError(
          'Signed in, but your browser discarded the session cookie. This happens ' +
            'when the app is served over plain HTTP from anything other than localhost. ' +
            'Put HTTPS in front of it, or restart the server with ' +
            'WILLCAL_ALLOW_INSECURE_COOKIE=1.'
        );
        setBusy(false);
        return;
      }
      setPassword('');
      onSignedIn();
    } catch (err: any) {
      setError(err.message || 'Sign-in failed');
      setBusy(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          minWidth: '320px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: '24px', fontSize: '22px' }}>WillCal</h1>

        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box',
            marginBottom: '16px',
          }}
        />

        {error && (
          <div style={{ color: '#cc0000', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          style={{
            width: '100%',
            padding: '10px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: busy || !password ? '#ccc' : '#007bff',
            color: 'white',
            cursor: busy || !password ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
