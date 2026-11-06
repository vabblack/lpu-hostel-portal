import React, { useState, useEffect } from 'react';
import { livingApi } from '../../api/livingApi';
import { RMSTicketItem, RMSTradeCategory, RMSTicketPriority } from '../../types/living';
import { Wrench, Plus, Clock, AlertTriangle, CheckCircle2, X, Zap } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const RMSDeskWidget: React.FC = () => {
  const [tickets, setTickets] = useState<RMSTicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [category, setCategory] = useState<RMSTradeCategory>('ELECTRICAL');
  const [priority, setPriority] = useState<RMSTicketPriority>('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadTickets = () => {
    setIsLoading(true);
    livingApi
      .getRMSTickets()
      .then((res) => setTickets(res.tickets || []))
      .catch((err) => console.error('Failed to load RMS tickets:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setErrorMsg('Title and description are required.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    livingApi
      .createRMSTicket({
        category,
        priority,
        title,
        description,
      })
      .then(() => {
        setShowModal(false);
        setTitle('');
        setDescription('');
        loadTickets();
      })
      .catch((err) => setErrorMsg(err.message || 'Failed to log maintenance ticket.'))
      .finally(() => setSubmitting(false));
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'EMERGENCY':
        return <Badge variant="danger">Emergency (4h SLA)</Badge>;
      case 'HIGH':
        return <Badge variant="warning">High (12h SLA)</Badge>;
      case 'MEDIUM':
        return <Badge variant="neutral">Medium (24h SLA)</Badge>;
      case 'LOW':
        return <Badge variant="neutral">Low (48h SLA)</Badge>;
      default:
        return <Badge variant="neutral">{p}</Badge>;
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
            RMS Service Desk
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
            Room Maintenance & SLA Tracker
          </h3>
        </div>

        <Button size="sm" variant="secondary" onClick={() => setShowModal(true)}>
          <Plus size={14} style={{ marginRight: '0.25rem' }} />
          Report Room Issue
        </Button>
      </div>

      {isLoading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          Loading maintenance tickets...
        </div>
      ) : tickets.length === 0 ? (
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
            No active room complaints or repairs pending.
          </p>
          <Button size="sm" variant="primary" onClick={() => setShowModal(true)}>
            Log Maintenance Ticket
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tickets.slice(0, 3).map((t) => (
            <div
              key={t.id}
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
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    #{t.ticket_number}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>
                    {t.title}
                  </span>
                  {getPriorityBadge(t.priority)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Room {t.room_number} • {t.category_display} • SLA Deadline: {new Date(t.sla_deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>

              <div>
                {t.is_escalated ? (
                  <Badge variant="danger">Escalated</Badge>
                ) : t.status === 'RESOLVED' ? (
                  <Badge variant="success">Resolved</Badge>
                ) : (
                  <Badge variant="warning">{t.status_display}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Maintenance Request Modal */}
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
                Log Maintenance Issue
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

            <form onSubmit={handleCreateTicket}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Trade Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RMSTradeCategory)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--border-strong)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <option value="ELECTRICAL">Electrical (Fans, Switches, Sockets)</option>
                    <option value="PLUMBING">Plumbing (Taps, Geysers, Washroom)</option>
                    <option value="CARPENTRY">Carpentry (Beds, Wardrobes, Doors)</option>
                    <option value="HVAC">HVAC / Air Conditioning</option>
                    <option value="CIVIL">Civil / Masonry</option>
                    <option value="PEST_CONTROL">Pest Control</option>
                    <option value="CLEANING">Sanitation / Cleaning</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Urgency & SLA
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as RMSTicketPriority)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--border-strong)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <option value="LOW">Low (48 Hour Resolution)</option>
                    <option value="MEDIUM">Medium (24 Hour Resolution)</option>
                    <option value="HIGH">High (12 Hour Resolution)</option>
                    <option value="EMERGENCY">Emergency (4 Hour Resolution)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Issue Summary
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Study desk tube light flickering continuously"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-strong)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Detailed Description & Location in Room
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details (e.g. Bed B side socket sparking when laptop charger plugged in)..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-strong)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Dispatching...' : 'Dispatch Ticket'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
