import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid credentials. Please verify your ID and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
  };

  return (
    <div className="container" style={{ maxWidth: '440px', padding: '3rem 1rem' }}>
      <Card style={{ padding: '2rem', borderTop: '3px solid var(--brand)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--primary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            Lovely Professional University
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.625rem',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '0 0 0.35rem',
            }}
          >
            Residential Portal Sign In
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Enter your university email address or Student ID
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--surface)',
              color: 'var(--status-danger)',
              border: '1px solid var(--status-danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.35rem',
              }}
            >
              Email or Student ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. student@lpu.in or 12400001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.35rem',
              }}
            >
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%' }}>
            Sign In to Portal
          </Button>
        </form>

        {/* Development Quick Credentials */}
        <div
          style={{
            marginTop: '1.75rem',
            padding: '0.75rem',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.35rem' }}>
            Quick Credentials:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('12400001', 'Password123!')}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Student (12400001)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@lpu.in', 'Password123!')}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Registrar / Admin
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          New student?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Claim your account &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
};
