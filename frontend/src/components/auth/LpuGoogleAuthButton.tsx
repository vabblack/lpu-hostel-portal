import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface LpuGoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export const LpuGoogleAuthButton: React.FC<LpuGoogleAuthButtonProps> = ({ onSuccess, onError }) => {
  const { loginWithGoogle } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const sampleAccounts = [
    { email: '12400001@lpu.in', name: 'Aarav Sharma', id: '12400001', branch: 'CSE • Batch 2024' },
    { email: '12400002@lpu.in', name: 'Vihaan Verma', id: '12400002', branch: 'CSE • Batch 2024' },
    { email: '12400004@lpu.in', name: 'Diya Patel', id: '12400004', branch: 'ECE • Batch 2024' },
  ];

  const handleSelect = async (email: string, name: string, studentId: string) => {
    setIsLoading(true);
    setLocalError('');
    try {
      await loginWithGoogle({ email, name, student_id: studentId });
      setIsOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed.';
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    const cleanEmail = customEmail.trim().toLowerCase();
    
    if (!cleanEmail.endsWith('@lpu.in') && !cleanEmail.endsWith('@lpu.co.in')) {
      const msg = 'Access Denied: Only official Lovely Professional University Google accounts ending in @lpu.in are permitted.';
      setLocalError(msg);
      onError?.(msg);
      return;
    }

    setIsLoading(true);
    try {
      await loginWithGoogle({
        email: cleanEmail,
        name: customName.trim() || undefined,
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed.';
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '0.625rem 1rem',
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          border: '1.5px solid #E5E7EB',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          transition: 'transform 0.1s ease, box-shadow 0.1s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
        }}
      >
        {/* Google Multi-color G logo */}
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
          />
        </svg>
        <span>Sign in with LPU Google Account</span>
      </button>

      {/* Domain notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35rem',
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
          marginTop: '0.35rem',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'inline-block',
          }}
        />
        <span>Institutional SSO Restricted to verified <strong>@lpu.in</strong> domain</span>
      </div>

      {/* Interactive Modal for Selecting / Entering LPU Google Account */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => !isLoading && setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <img
                src="/lpu-crest.png"
                alt="LPU Crest"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--brand)',
                  backgroundColor: '#FFFFFF',
                }}
              />
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.125rem',
                    color: 'var(--ink)',
                  }}
                >
                  LPU Google Workspace SSO
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sign in with your official university account (@lpu.in)
                </p>
              </div>
            </div>

            {localError && (
              <div
                style={{
                  padding: '0.625rem 0.75rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--status-danger)',
                  border: '1px solid var(--status-danger)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                }}
              >
                {localError}
              </div>
            )}

            {/* Quick LPU Student Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem',
                }}
              >
                Choose an LPU Student Account:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sampleAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSelect(acc.email, acc.name, acc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--brand)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                        {acc.email}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '2px',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {acc.branch}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: '1rem 0',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
              <span>OR ENTER ANY OFFICIAL LPU ACCOUNT</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
            </div>

            {/* Custom Student Email Entry */}
            <form onSubmit={handleCustomSubmit}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  Your Official LPU Google Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. 12400999@lpu.in or your.name@lpu.in"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  Student Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raghav Sharma"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--brand)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? 'Verifying with LPU...' : 'Verify & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

