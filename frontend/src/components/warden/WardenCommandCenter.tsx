import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { livingApi } from '../../api/livingApi';
import { hostelsApi } from '../../api/hostelsApi';
import { GatePassItem, RMSTicketItem } from '../../types/living';
import { HostelSummary } from '../../types/hostel';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Wrench,
  Building,
  Compass,
  AlertTriangle,
  QrCode,
  Users,
} from 'lucide-react';

interface WardenCommandCenterProps {
  userEmail: string;
  role: string;
}

export const WardenCommandCenter: React.FC<WardenCommandCenterProps> = ({ userEmail, role }) => {
  const [gatePasses, setGatePasses] = useState<GatePassItem[]>([]);
  const [rmsTickets, setRmsTickets] = useState<RMSTicketItem[]>([]);
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      livingApi.getGatePasses().catch(() => ({ gate_passes: [] })),
      livingApi.getRMSTickets().catch(() => ({ tickets: [] })),
      hostelsApi.getHostels().catch(() => ({ hostels: [] })),
    ])
      .then(([passData, ticketData, hostelData]) => {
        setGatePasses(passData.gate_passes || []);
        setRmsTickets(ticketData.tickets || []);
        setHostels(hostelData.hostels || []);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprovePass = (passId: number) => {
    setActionLoadingId(passId);
    livingApi
      .gatePassAction(passId, 'warden_approve', 'Approved by hostel warden on duty.')
      .then(() => loadData())
      .catch((err) => alert(err.message || 'Approval failed.'))
      .finally(() => setActionLoadingId(null));
  };

  const handleRejectPass = (passId: number) => {
    const reason = prompt('Reason for rejecting gate pass:') || 'Rejected by hostel administration.';
    setActionLoadingId(passId);
    livingApi
      .gatePassAction(passId, 'warden_reject', reason)
      .then(() => loadData())
      .catch((err) => alert(err.message || 'Rejection failed.'))
      .finally(() => setActionLoadingId(null));
  };

  const handleUpdateTicket = (ticketId: number, status: 'IN_PROGRESS' | 'RESOLVED') => {
    setActionLoadingId(ticketId);
    livingApi
      .updateRMSTicketStatus(ticketId, status, `Updated to ${status} by warden.`)
      .then(() => loadData())
      .catch((err) => alert(err.message || 'Ticket update failed.'))
      .finally(() => setActionLoadingId(null));
  };

  if (isLoading) return <Spinner label="Loading warden operations command desk..." />;

  // Filter pending gate passes
  const pendingPasses = gatePasses.filter(
    (p) => p.status === 'SUBMITTED' || p.status === 'PENDING_WARDEN'
  );
  const activeOutsidePasses = gatePasses.filter((p) => p.status === 'ACTIVE_OUTSIDE');

  // Filter open / in-progress RMS tickets
  const activeTickets = rmsTickets.filter(
    (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  );

  const totalBeds = hostels.reduce((acc, h) => acc + h.total_beds, 0);
  const vacantBeds = hostels.reduce((acc, h) => acc + h.vacant_beds, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
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
            Residential Operations
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Lovely Professional University
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '0 0 0.5rem',
                letterSpacing: '-0.01em',
              }}
            >
              Warden Command Center
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Logged in as <strong style={{ color: 'var(--ink)' }}>{userEmail}</strong> ({role}) • Live Operations &amp; Outing Approvals
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/admin/" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm">
                Open Django Admin Console &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Census Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <Card>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Residential Complex Capacity
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--ink)', margin: '0.2rem 0' }}>
            {totalBeds.toLocaleString('en-IN')} Beds
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Across {hostels.length} Complex Towers
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Vacant Bed Slots
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#1E6B3A', margin: '0.2rem 0' }}>
            {vacantBeds.toLocaleString('en-IN')} Vacant
          </div>
          <div style={{ fontSize: '0.75rem', color: '#1E6B3A', fontWeight: 500 }}>
            Ready for allocation assignment
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Pending Outing Requests
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--primary)', margin: '0.2rem 0' }}>
            {pendingPasses.length} Pending
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {activeOutsidePasses.length} residents currently outside
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Active RMS Tickets
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: activeTickets.length > 0 ? '#B45309' : '#1E6B3A', margin: '0.2rem 0' }}>
            {activeTickets.length} Open
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Under active maintenance SLA
          </div>
        </Card>
      </div>

      {/* Two Column Workflow: Gate Passes Approval & RMS Maintenance Desk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Outing Gate Pass Approvals Queue */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                Turnstile Security Authorizations
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', margin: '0.1rem 0 0', color: 'var(--ink)' }}>
                Gate Pass Approvals Queue
              </h3>
            </div>
            <Badge variant="warning">{pendingPasses.length} Requiring Action</Badge>
          </div>

          {pendingPasses.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#FAF9F6', border: '1px dashed var(--border)', borderRadius: '2px', fontSize: '0.8125rem' }}>
              <ShieldCheck size={24} color="#1E6B3A" style={{ marginBottom: '0.5rem' }} />
              <div>All student outing requests are reviewed and up-to-date.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingPasses.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: '#FAF8F5',
                    border: '1px solid var(--border)',
                    borderRadius: '2px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.875rem' }}>
                          {(p as any).student_name || 'Resident'}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          #{(p as any).student_id || 'N/A'}
                        </span>
                        <Badge variant="neutral" size="sm">{p.pass_type_display}</Badge>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                        Destination: <strong>{p.destination}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Reason: &ldquo;{p.reason}&rdquo;
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '0.35rem', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      Schedule: {new Date(p.departure_date).toLocaleDateString()} — {new Date(p.expected_return_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={actionLoadingId === p.id}
                        onClick={() => handleApprovePass(p.id)}
                      >
                        <CheckCircle size={12} style={{ marginRight: '0.2rem' }} />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={actionLoadingId === p.id}
                        onClick={() => handleRejectPass(p.id)}
                      >
                        <XCircle size={12} style={{ marginRight: '0.2rem' }} />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RMS Maintenance Dispatch Queue */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                Relationship Management System
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', margin: '0.1rem 0 0', color: 'var(--ink)' }}>
                Room Maintenance Dispatch
              </h3>
            </div>
            <Badge variant={activeTickets.length > 0 ? 'warning' : 'success'}>
              {activeTickets.length} Active SLA Tasks
            </Badge>
          </div>

          {activeTickets.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#FAF9F6', border: '1px dashed var(--border)', borderRadius: '2px', fontSize: '0.8125rem' }}>
              <CheckCircle size={24} color="#1E6B3A" style={{ marginBottom: '0.5rem' }} />
              <div>Zero room maintenance tickets pending across your towers.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeTickets.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: '#FAF8F5',
                    border: '1px solid var(--border)',
                    borderRadius: '2px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700 }}>
                          #{t.ticket_number}
                        </span>
                        <strong style={{ color: 'var(--ink)', fontSize: '0.875rem' }}>
                          {t.title}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
                        Room <strong>{t.room_number}</strong> • {t.hostel_name} ({t.category_display})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        &ldquo;{t.description}&rdquo;
                      </div>
                    </div>

                    <Badge variant={t.priority === 'EMERGENCY' ? 'danger' : 'neutral'} size="sm">
                      {t.priority_display}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '0.35rem', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      SLA: {new Date(t.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {t.status === 'OPEN' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actionLoadingId === t.id}
                          onClick={() => handleUpdateTicket(t.id, 'IN_PROGRESS')}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={actionLoadingId === t.id}
                        onClick={() => handleUpdateTicket(t.id, 'RESOLVED')}
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assigned Residential Complexes Direct Blueprint Navigator */}
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
            Assigned Residential Towers (Floor Blueprint Navigator)
          </h2>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            Select any building to launch its interactive 2D Architectural Blueprint Floor Plan and bed inventory.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {hostels.map((h) => (
            <Card key={h.id} hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {h.code}
                </span>
                <Badge variant={h.gender_policy === 'MALE' ? 'info' : 'warning'} size="sm">
                  {h.gender_policy_display}
                </Badge>
              </div>

              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 0.35rem' }}>
                {h.name}
              </h4>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Capacity: <strong>{h.total_beds}</strong> beds • Vacant: <strong style={{ color: '#1E6B3A' }}>{h.vacant_beds}</strong>
              </div>

              <Link to={`/hostels/${h.id}`} style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <Compass size={13} color="var(--primary)" />
                  Inspect 2D Architectural Blueprint &rarr;
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
