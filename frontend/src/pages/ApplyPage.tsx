import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { applicationsApi, ApplicationChoicePayload } from '../api/applicationsApi';
import { hostelsApi } from '../api/hostelsApi';
import { HostelSummary } from '../types/hostel';
import { RoomSummary } from '../types/room';
import { HostelApplicationItem, CycleInfo } from '../types/application';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';

export const ApplyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeCycle, setActiveCycle] = useState<CycleInfo | null>(null);
  const [applications, setApplications] = useState<HostelApplicationItem[]>([]);
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 3 Choices state
  const preselectedHostel = searchParams.get('hostel') ? Number(searchParams.get('hostel')) : undefined;
  const preselectedRoom = searchParams.get('room') ? Number(searchParams.get('room')) : undefined;

  const [choice1Hostel, setChoice1Hostel] = useState<number | ''>(preselectedHostel || '');
  const [choice1Room, setChoice1Room] = useState<number | ''>(preselectedRoom || '');

  const [choice2Hostel, setChoice2Hostel] = useState<number | ''>('');
  const [choice2Room, setChoice2Room] = useState<number | ''>('');

  const [choice3Hostel, setChoice3Hostel] = useState<number | ''>('');
  const [choice3Room, setChoice3Room] = useState<number | ''>('');

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      applicationsApi.getApplications(),
      hostelsApi.getHostels(),
      hostelsApi.getRooms({ vacant_only: true }),
    ])
      .then(([appData, hostelData, roomData]) => {
        setActiveCycle(appData.active_cycle);
        setApplications(appData.applications);
        setHostels(hostelData.hostels);
        setRooms(roomData.rooms);
      })
      .catch((err) => setErrorMsg(err.message || 'Failed to load application data.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!choice1Hostel) {
      setErrorMsg('Choice #1 Hostel selection is required.');
      return;
    }

    const payload: ApplicationChoicePayload[] = [
      {
        priority: 1,
        hostel_id: Number(choice1Hostel),
        room_id: choice1Room ? Number(choice1Room) : undefined,
      },
    ];

    if (choice2Hostel) {
      payload.push({
        priority: 2,
        hostel_id: Number(choice2Hostel),
        room_id: choice2Room ? Number(choice2Room) : undefined,
      });
    }

    if (choice3Hostel) {
      payload.push({
        priority: 3,
        hostel_id: Number(choice3Hostel),
        room_id: choice3Room ? Number(choice3Room) : undefined,
      });
    }

    setIsSubmitting(true);
    try {
      const resp = await applicationsApi.submitApplication(payload);
      setSuccessMsg(resp.message || 'Hostel application successfully submitted!');
      // Refresh applications list
      const appData = await applicationsApi.getApplications();
      setApplications(appData.applications);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredRooms = (hostelId: number | '') => {
    if (!hostelId) return [];
    return rooms.filter((r) => r.hostel_id === Number(hostelId));
  };

  if (isLoading) return <Spinner label="Loading application cycle..." />;

  const hasSubmittedApp = applications.some(
    (a) => a.cycle_name === activeCycle?.name && a.status !== 'CANCELLED' && a.status !== 'REJECTED'
  );

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Hostel Room Application
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          Select up to 3 prioritized residential choices for {activeCycle?.name || 'the upcoming academic session'}.
        </p>
      </div>

      {/* Cycle Banner */}
      {activeCycle ? (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <strong>Active Cycle: {activeCycle.name}</strong>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Academic Year {activeCycle.academic_year} • Semester {activeCycle.semester}
            </div>
          </div>
          <Badge variant="success" size="sm">
            Intake Open
          </Badge>
        </div>
      ) : (
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-warning-light)', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
          No active accommodation intake cycle is currently accepting submissions.
        </div>
      )}

      {/* Existing Application Notice */}
      {hasSubmittedApp ? (
        <div>
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--color-info-light)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '2rem',
              border: '1px solid rgba(7, 89, 133, 0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', color: 'var(--color-info)' }}>
              Application Already On Record
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem' }}>
              You have an active application submitted for this intake. University policy permits one active submission per academic intake cycle.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
              View Status on Dashboard &rarr;
            </Button>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
            Submitted Application Details
          </h3>
          {applications.map((app) => (
            <Card key={app.id} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                    Application #{app.id}
                  </h4>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Submitted {app.submitted_at}
                  </span>
                </div>
                <Badge variant={app.status === 'ALLOCATED' ? 'success' : 'info'} size="md">
                  {app.status_display}
                </Badge>
              </div>

              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {app.choices.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '0.625rem 0.75rem',
                      backgroundColor: 'var(--color-surface-hover)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>
                      Priority #{c.priority}: <strong>{c.hostel_name} ({c.hostel_code})</strong>
                    </span>
                    {c.room && (
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        Room {c.room.room_number} ({c.room.capacity}-Seater)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Submission Form */
        <Card>
          <form onSubmit={handleSubmit}>
            {successMsg && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>
                ✓ {successMsg}
              </div>
            )}
            {errorMsg && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>
                ⚠ {errorMsg}
              </div>
            )}

            {/* CHOICE #1 */}
            <div style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', backgroundColor: 'var(--color-surface-hover)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>
                  Choice #1 (First Preference — Required)
                </strong>
                <Badge variant="primary" size="sm">Priority 1</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Select Hostel Complex *
                  </label>
                  <select
                    value={choice1Hostel}
                    onChange={(e) => {
                      setChoice1Hostel(e.target.value ? Number(e.target.value) : '');
                      setChoice1Room('');
                    }}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="">-- Choose Hostel Complex --</option>
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code}) — {h.gender_policy_display}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Specific Room Preference (Optional)
                  </label>
                  <select
                    value={choice1Room}
                    onChange={(e) => setChoice1Room(e.target.value ? Number(e.target.value) : '')}
                    disabled={!choice1Hostel}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="">Any Available Room in Selected Hostel</option>
                    {getFilteredRooms(choice1Hostel).map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.capacity}-Seater, {r.is_air_conditioned ? 'AC' : 'Cooler'}, ₹{r.standard_fee?.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CHOICE #2 */}
            <div style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '1rem' }}>
                  Choice #2 (Second Preference — Optional)
                </strong>
                <Badge variant="neutral" size="sm">Priority 2</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Select Hostel Complex
                  </label>
                  <select
                    value={choice2Hostel}
                    onChange={(e) => {
                      setChoice2Hostel(e.target.value ? Number(e.target.value) : '');
                      setChoice2Room('');
                    }}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="">-- No Second Preference --</option>
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code}) — {h.gender_policy_display}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Specific Room Preference
                  </label>
                  <select
                    value={choice2Room}
                    onChange={(e) => setChoice2Room(e.target.value ? Number(e.target.value) : '')}
                    disabled={!choice2Hostel}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="">Any Available Room</option>
                    {getFilteredRooms(choice2Hostel).map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.capacity}-Seater, {r.is_air_conditioned ? 'AC' : 'Cooler'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CHOICE #3 */}
            <div style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '1rem' }}>
                  Choice #3 (Third Preference — Optional)
                </strong>
                <Badge variant="neutral" size="sm">Priority 3</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Select Hostel Complex
                  </label>
                  <select
                    value={choice3Hostel}
                    onChange={(e) => {
                      setChoice3Hostel(e.target.value ? Number(e.target.value) : '');
                      setChoice3Room('');
                    }}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="">-- No Third Preference --</option>
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code}) — {h.gender_policy_display}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Specific Room Preference
                  </label>
                  <select
                    value={choice3Room}
                    onChange={(e) => setChoice3Room(e.target.value ? Number(e.target.value) : '')}
                    disabled={!choice3Hostel}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="">Any Available Room</option>
                    {getFilteredRooms(choice3Hostel).map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.capacity}-Seater, {r.is_air_conditioned ? 'AC' : 'Cooler'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              style={{ width: '100%' }}
            >
              Submit Official Application
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};
