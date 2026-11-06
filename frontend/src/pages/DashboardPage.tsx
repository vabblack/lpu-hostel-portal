import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationsApi } from '../api/applicationsApi';
import { DashboardSummary, HostelApplicationItem } from '../types/application';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';

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

  if (isLoading) return <Spinner label="Loading student dashboard..." />;

  const student = user?.student;
  const activeAllocation = student?.active_allocation;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Welcome back, {student?.full_name || user?.email.split('@')[0]}
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          Official LPU Student Residence Dashboard • Academic Session 2026–27
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Profile Card */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
              Academic Profile
            </h3>
            <Badge variant="info">Verified Student</Badge>
          </div>

          <div style={{ display: 'grid', gap: '0.625rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Student Registration ID:</span>
              <strong>{student?.student_id || user?.student_id_login || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Registered Email:</span>
              <span>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Branch / Department:</span>
              <span>{student?.branch || 'School of Engineering'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Gender Policy:</span>
              <span>{student?.gender_display || student?.gender || 'N/A'}</span>
            </div>
            {student?.cgpa !== null && student?.cgpa !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Academic CGPA:</span>
                <strong style={{ color: 'var(--color-primary)' }}>{student.cgpa.toFixed(2)}</strong>
              </div>
            )}
          </div>
        </Card>

        {/* Active Allocation Card */}
        <Card style={{ borderColor: activeAllocation ? 'var(--color-success)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
              Bed Allocation Status
            </h3>
            <Badge variant={activeAllocation ? 'success' : 'warning'}>
              {activeAllocation ? 'Allocated & Confirmed' : 'No Active Bed'}
            </Badge>
          </div>

          {activeAllocation ? (
            <div>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-success-light)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  border: '1px solid rgba(22, 101, 52, 0.2)',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '0.25rem' }}>
                  {activeAllocation.hostel_name} ({activeAllocation.hostel_code})
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Room {activeAllocation.room_number} • Bed {activeAllocation.bed_identifier}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  {activeAllocation.seater}-Seater • {activeAllocation.cooling_type === 'AIR_CONDITIONED' ? 'Air-Conditioned' : 'Air-Cooled'}
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Occupancy Duration: {activeAllocation.start_date} to {activeAllocation.end_date}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
                You do not have an active bed allocated for this cycle. Complete your application choices to be assigned by the automated engine or hostel warden.
              </p>
              <Link to="/apply" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm">
                  Submit Application Choices &rarr;
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Applications Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            My Hostel Applications
          </h2>
          <Link to="/apply" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="sm">
              + New Application
            </Button>
          </Link>
        </div>

        {applications.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No applications submitted yet.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {applications.map((app) => (
              <Card key={app.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700 }}>
                      Application #{app.id} — {app.cycle_name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Submitted {app.submitted_at}
                    </span>
                  </div>
                  <Badge variant={app.status === 'ALLOCATED' ? 'success' : app.status === 'SUBMITTED' ? 'info' : 'warning'} size="md">
                    {app.status_display}
                  </Badge>
                </div>

                <div style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {app.choices.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'var(--color-surface-hover)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Priority #{c.priority}: <strong>{c.hostel_name}</strong></span>
                      {c.room && <span>Room {c.room.room_number} ({c.room.capacity}-Seater)</span>}
                    </div>
                  ))}
                </div>

                {app.review_notes && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    Note from Warden/Admin: &ldquo;{app.review_notes}&rdquo;
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          Quick Services
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <Link to="/roommates" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ height: '100%' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>🤝</div>
              <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                Roommate Compatibility
              </strong>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                7-Factor lifestyle questionnaire and match requests
              </span>
            </Card>
          </Link>

          <Link to="/rooms" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ height: '100%' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>🏢</div>
              <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                Room &amp; Rate Explorer
              </strong>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Browse AC, Air-Cooled, and Studio options across 14 towers
              </span>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
};
