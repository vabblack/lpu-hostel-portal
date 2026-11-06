import React, { useState, useEffect } from 'react';
import { livingApi } from '../../api/livingApi';
import { GatePassItem, PassType } from '../../types/living';
import { QrCode, Plus, Clock, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const GatePassWidget: React.FC = () => {
  const [passes, setPasses] = useState<GatePassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPassForQr, setSelectedPassForQr] = useState<GatePassItem | null>(null);

  // Form State
  const [passType, setPassType] = useState<PassType>('DAY_PASS');
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadPasses = () => {
    setIsLoading(true);
    livingApi
      .getGatePasses()
      .then((res) => setPasses(res.gate_passes || []))
      .catch((err) => console.error('Failed to load gate passes:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPasses();
  }, []);

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !reason || !departureDate || !expectedReturnDate) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    livingApi
      .createGatePass({
        pass_type: passType,
        destination,
        reason,
        departure_date: new Date(departureDate).toISOString(),
        expected_return_date: new Date(expectedReturnDate).toISOString(),
      })
      .then(() => {
        setShowModal(false);
        setDestination('');
        setReason('');
        loadPasses();
      })
      .catch((err) => setErrorMsg(err.message || 'Failed to submit gate pass request.'))
      .finally(() => setSubmitting(false));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'ACTIVE_OUTSIDE':
        return <Badge variant="warning">Outside Campus</Badge>;
      case 'PENDING_WARDEN':
        return <Badge variant="warning">Pending Warden</Badge>;
      case 'PENDING_PARENT':
        return <Badge variant="warning">Pending Parent</Badge>;
      case 'CLOSED_RETURNED':
        return <Badge variant="neutral">Returned</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--primary)',
            }}
          >
            Turnstile Access
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.125rem',
              fontWeight: 700,
              margin: '0.2rem 0 0',
              color: 'var(--ink)',
            }}
          >
            Digital Gate Pass & Outing Hub
          </h3>
        </div>

        <Button size="sm" variant="secondary" onClick={() => setShowModal(true)}>
          <Plus size={14} style={{ marginRight: '0.25rem' }} />
          Request Outing
        </Button>
      </div>

      {isLoading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          Loading gate pass credentials...
        </div>
      ) : passes.length === 0 ? (
        <div
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            backgroundColor: '#FAF8F5',
            border: '1px dashed var(--border)',
            borderRadius: '2px',
          }}
        >
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            No active or past gate passes on record.
          </p>
          <Button size="sm" variant="primary" onClick={() => setShowModal(true)}>
            Apply for Outing Pass
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {passes.slice(0, 3).map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                backgroundColor: '#FAF8F5',
                border: '1px solid var(--border)',
                borderRadius: '2px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>
                    {p.destination}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({p.pass_type_display})
                  </span>
                  {getStatusBadge(p.status)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Expected: {new Date(p.departure_date).toLocaleDateString()} — {new Date(p.expected_return_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {p.qr_token && (
                <button
                  type="button"
                  onClick={() => setSelectedPassForQr(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#fff',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    color: 'var(--ink)',
                  }}
                >
                  <QrCode size={14} color="var(--primary)" />
                  QR Pass
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* QR Code Presentation Modal */}
      {selectedPassForQr && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(26, 26, 26, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
          onClick={() => setSelectedPassForQr(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              padding: '1.75rem',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              border: '2px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)' }}>
                MAIN SECURITY GATE TURNSTILE TOKEN
              </span>
              <button
                type="button"
                onClick={() => setSelectedPassForQr(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Turnstile QR Code Render */}
            <div
              style={{
                width: '180px',
                height: '180px',
                margin: '0 auto 1.25rem',
                backgroundColor: '#000',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  fontSize: '0.625rem',
                  padding: '8px',
                  wordBreak: 'break-all',
                }}
              >
                QR: {selectedPassForQr.qr_token.slice(0, 32)}...
              </div>
            </div>

            <h4 style={{ margin: '0 0 0.25rem', fontFamily: 'var(--font-serif)', fontSize: '1.125rem' }}>
              {selectedPassForQr.destination}
            </h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Present this encrypted token at campus turnstiles (Gate 1, 2, or 4).
            </div>

            <Button variant="secondary" size="sm" onClick={() => setSelectedPassForQr(null)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Outing Request Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(26, 26, 26, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0, fontSize: '1.25rem' }}>
                Apply for Campus Outing Pass
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#FBE9E8',
                  color: 'var(--status-danger)',
                  fontSize: '0.75rem',
                  borderRadius: '2px',
                  marginBottom: '1rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePass}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Pass Type
                </label>
                <select
                  value={passType}
                  onChange={(e) => setPassType(e.target.value as PassType)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-strong)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <option value="DAY_PASS">Day Pass (Return before 09:30 PM)</option>
                  <option value="NIGHT_OUT">Night Out (Return next morning)</option>
                  <option value="LEAVE">Official Leave / Home Visit</option>
                  <option value="EMERGENCY">Emergency Exit</option>
                </select>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Destination (e.g., Jalandhar City / Phagwara / Hometown)
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Model Town, Jalandhar"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-strong)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Reason for Outing
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Doctor appointment, Academic books purchase"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-strong)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Departure Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      border: '1px solid var(--border-strong)',
                      fontSize: '0.75rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Expected Return
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      border: '1px solid var(--border-strong)',
                      fontSize: '0.75rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
