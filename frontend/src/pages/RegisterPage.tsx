import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({
        student_id: studentId.trim(),
        institutional_email: email.trim(),
        password,
        confirm_password: confirmPassword,
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_phone: emergencyPhone.trim(),
      });
      await refreshUser();
      navigate('/dashboard');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration verification failed. Check your Student ID and institutional email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '520px', padding: '3rem 1rem' }}>
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
            Claim Student Residence Record
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Verify your official university enrollment record to activate residential services
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
              Student ID / Registration Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 12400003"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
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
              Institutional Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. student@lpu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
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
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="Min 8 characters"
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
            <div>
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
                Confirm Password *
              </label>
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div>
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
                Guardian Name
              </label>
              <input
                type="text"
                placeholder="Emergency contact"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
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
            <div>
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
                Emergency Phone
              </label>
              <input
                type="text"
                placeholder="+91..."
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
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
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%' }}>
            Verify &amp; Create Account
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Already claimed your account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
};
