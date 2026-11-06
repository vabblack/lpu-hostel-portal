import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationsApi } from '../api/applicationsApi';
import { DashboardSummary, HostelApplicationItem } from '../types/application';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { GatePassWidget } from '../components/living/GatePassWidget';
import { RMSDeskWidget } from '../components/living/RMSDeskWidget';
import { WardenCommandCenter } from '../components/warden/WardenCommandCenter';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [applications, setApplications] = useState<HostelApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      applicationsApi.getDashboardSummary(),
      applicationsApi.getApplications().catch(() => ({ applications: [] })),
    ])
      .then(([sumData, appData]) => {
        setSummary(sumData);
        setApplications(appData.applications);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner label="Loading dashboard..." />;

  // Render Warden & Administrator Command Center if logged in with staff credentials
  if (user && (user.role === 'WARDEN' || user.role === 'ADMIN')) {
    return (
      <div className="container">
        <WardenCommandCenter userEmail={user.email} role={user.role} />
      </div>
    );
  }

  const student = user?.student;
  const activeAllocation = student?.active_allocation;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
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
          Welcome, {student?.full_name || user?.email.split('@')[0]}
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Lovely Professional University Student Residence Record • Academic Session 2026–27
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Profile Card */}
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.75rem',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              Academic Profile
            </h3>
            <Badge variant="success">Verified Resident</Badge>
          </div>

          <div style={{ display: 'grid', gap: '0.625rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Registration ID:</span>
              <strong className="tabular-nums" style={{ color: 'var(--ink)' }}>
                {student?.student_id || user?.student_id_login || 'N/A'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>University Email:</span>
              <span style={{ color: 'var(--text)' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>School / Department:</span>
              <span style={{ color: 'var(--text)' }}>{student?.branch || 'School of Computer Science & Engineering'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Gender Policy:</span>
              <span style={{ color: 'var(--text)' }}>{student?.gender_display || student?.gender || 'N/A'}</span>
            </div>
            {student?.cgpa !== null && student?.cgpa !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Academic CGPA:</span>
                <strong className="tabular-nums" style={{ color: 'var(--primary)' }}>
                  {student.cgpa.toFixed(2)}
                </strong>
              </div>
            )}
          </div>
        </Card>

        {/* Active Allocation Card */}
        <Card
          style={{
            borderLeft: activeAllocation ? '3px solid #1E6B3A' : undefined,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.75rem',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              Bed Allocation Status
            </h3>
            <Badge variant={activeAllocation ? 'success' : 'warning'}>
              {activeAllocation ? 'Confirmed Occupant' : 'Unallocated'}
            </Badge>
          </div>

          {activeAllocation ? (
            <div>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {activeAllocation.hostel_name} ({activeAllocation.hostel_code})
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
                  Room <span className="tabular-nums">{activeAllocation.room_number}</span> • Bed{' '}
                  <span className="tabular-nums">{activeAllocation.bed_identifier}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <span className="tabular-nums">{activeAllocation.seater}</span>-Seater •{' '}
                  {activeAllocation.cooling_type === 'AIR_CONDITIONED' ? 'Air-Conditioned' : 'Air-Cooled'}
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Session Tenancy: <span className="tabular-nums">{activeAllocation.start_date}</span> to{' '}
                <span className="tabular-nums">{activeAllocation.end_date}</span>
              </div>
            </div>
          ) : (
            <div>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text)',
                  margin: '0 0 1.25rem',
                  lineHeight: 1.5,
                }}
              >
                No active bed allocation on file for the 2026–27 session. Submit your residential preferences to be considered in the upcoming allocation cycle.
              </p>
              <Link to="/apply" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm">
                  Submit Room Preferences &rarr;
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Applications Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.375rem',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Session Applications
          </h2>
          <Link to="/apply" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm">
              + New Application
            </Button>
          </Link>
        </div>

        {applications.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No residential applications currently on record.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {applications.map((app) => (
              <Card key={app.id}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.0625rem',
                        fontWeight: 600,
                        color: 'var(--ink)',
                      }}
                    >
                      Application #{app.id} — {app.cycle_name}
                    </h4>
                    <span
                      className="tabular-nums"
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                    >
                      Filed on {app.submitted_at}
                    </span>
                  </div>
                  <Badge
                    variant={
                      app.status === 'ALLOCATED'
                        ? 'success'
                        : app.status === 'SUBMITTED'
                        ? 'neutral'
                        : 'warning'
                    }
                    size="md"
                  >
                    {app.status_display}
                  </Badge>
                </div>

                <div style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {app.choices.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        Priority <strong className="tabular-nums">#{c.priority}</strong>:{' '}
                        <strong>{c.hostel_name}</strong>
                      </span>
                      {c.room && (
                        <span>
                          Room <strong className="tabular-nums">{c.room.room_number}</strong> (
                          <span className="tabular-nums">{c.room.capacity}</span>-Seater)
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {app.review_notes && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      borderTop: '1px solid var(--border)',
                      paddingTop: '0.5rem',
                    }}
                  >
                    Warden Review Note: &ldquo;{app.review_notes}&rdquo;
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Student Living Experience Hub: Turnstile Gate Pass & RMS Maintenance */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.375rem',
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: '1rem',
          }}
        >
          Daily Residence &amp; Campus Operations
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <GatePassWidget />
          <RMSDeskWidget />
        </div>
      </section>

      {/* Quick Services */}
      <section>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.375rem',
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: '1rem',
          }}
        >
          Residential Services
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          <Link to="/roommates" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ height: '100%' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--primary)',
                  marginBottom: '0.35rem',
                }}
              >
                7-Factor Compatibility
              </div>
              <strong
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '0.25rem',
                }}
              >
                Roommate Matching Engine
              </strong>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.5 }}>
                Configure sleep, cleanliness, and study preferences to match with compatible residents.
              </span>
            </Card>
          </Link>

          <Link to="/rooms" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ height: '100%' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--primary)',
                  marginBottom: '0.35rem',
                }}
              >
                Campus Inventory
              </div>
              <strong
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '0.25rem',
                }}
              >
                Room &amp; Tariff Explorer
              </strong>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.5 }}>
                Browse 1-seater through 6-seater AC and Cooler accommodations across 14 towers.
              </span>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
};
