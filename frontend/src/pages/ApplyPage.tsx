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
  const preselectedBed = searchParams.get('bed') || undefined;

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

        // Auto-link preselected room to its respective hostel complex
        if (preselectedRoom) {
          const target = roomData.rooms.find((r) => r.id === preselectedRoom);
          if (target) {
            setChoice1Hostel(target.hostel_id);
            setChoice1Room(target.id);
          }
        }
      })
      .catch((err) => setErrorMsg(err.message || 'Failed to load application data.'))
      .finally(() => setIsLoading(false));
  }, [preselectedRoom]);

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
      setSuccessMsg(resp.message || 'Hostel application successfully submitted.');
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

  if (isLoading) return <Spinner label="Loading accommodation intake cycle..." />;

  const hasSubmittedApp = applications.some(
    (a) => a.cycle_name === activeCycle?.name && a.status !== 'CANCELLED' && a.status !== 'REJECTED'
  );

  return (
    <div className="container" style={{ maxWidth: '820px' }}>
      {/* Title */}
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
          Hostel Room Application
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Select up to 3 prioritized residential accommodation preferences for {activeCycle?.name || 'the 2026–27 academic session'}.
        </p>
      </div>

      {/* Cycle Banner */}
      {activeCycle ? (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--brand)',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <strong style={{ color: 'var(--ink)' }}>Active Intake Cycle: {activeCycle.name}</strong>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Academic Year <span className="tabular-nums">{activeCycle.academic_year}</span> • Semester <span className="tabular-nums">{activeCycle.semester}</span>
            </div>
          </div>
          <Badge variant="success" size="sm">
            Intake Open
          </Badge>
        </div>
      ) : (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid #8A5A00',
            marginBottom: '2rem',
            fontSize: '0.875rem',
            color: 'var(--text)',
          }}
        >
          No active accommodation intake cycle is currently accepting student submissions.
        </div>
      )}

      {/* Existing Application Notice */}
      {hasSubmittedApp ? (
        <div>
          <div
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--primary)',
              marginBottom: '2rem',
            }}
          >
            <h3
              style={{
                margin: '0 0 0.5rem',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              Application Already On File
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 }}>
              You have an active residential application submitted for this intake. University policy permits one active submission per academic intake cycle.
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
              View Status on Dashboard &rarr;
            </Button>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: '1rem',
            }}
          >
            Submitted Application Details
          </h3>
          {applications.map((app) => (
            <Card key={app.id} style={{ marginBottom: '1rem' }}>
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
                    Filed {app.submitted_at}
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

              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {app.choices.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '0.625rem 0.875rem',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>
                      Priority <strong className="tabular-nums">#{c.priority}</strong>:{' '}
                      <strong style={{ color: 'var(--ink)' }}>{c.hostel_name} ({c.hostel_code})</strong>
                    </span>
                    {c.room && (
                      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                        Room <span className="tabular-nums">{c.room.room_number}</span> (
                        <span className="tabular-nums">{c.room.capacity}</span>-Seater)
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
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--surface)',
                  color: '#1E6B3A',
                  border: '1px solid #1E6B3A',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--status-danger)',
                  border: '1px solid var(--status-danger)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Selected from Architectural Blueprint Banner */}
            {(preselectedRoom || preselectedBed) && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)' }}>
                    Architectural Blueprint Pre-selection Active
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Choice #1 has been automatically locked to your selected room unit
                    {preselectedBed ? ` and Bed Bay ${preselectedBed}` : ''}.
                  </div>
                </div>
                <Badge variant="primary" size="sm">
                  Blueprint Selected
                </Badge>
              </div>
            )}

            {/* CHOICE #1 */}
            <div
              style={{
                padding: '1.25rem',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                backgroundColor: 'var(--surface)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.875rem',
                }}
              >
                <strong
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                  }}
                >
                  Choice #1 (First Preference — Mandatory)
                </strong>
                <Badge variant="primary" size="sm">Priority 1</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
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
                    Hostel Complex *
                  </label>
                  <select
                    value={choice1Hostel}
                    onChange={(e) => {
                      setChoice1Hostel(e.target.value ? Number(e.target.value) : '');
                      setChoice1Room('');
                    }}
                    required
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
                  >
                    <option value="">-- Select Hostel Complex --</option>
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code}) — {h.gender_policy_display}
                      </option>
                    ))}
                  </select>
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
                    Specific Room Preference (Optional)
                  </label>
                  <select
                    value={choice1Room}
                    onChange={(e) => setChoice1Room(e.target.value ? Number(e.target.value) : '')}
                    disabled={!choice1Hostel}
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
            <div
              style={{
                padding: '1.25rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                backgroundColor: 'var(--surface)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.875rem',
                }}
              >
                <strong
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                  }}
                >
                  Choice #2 (Second Preference — Optional)
                </strong>
                <Badge variant="neutral" size="sm">Priority 2</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
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
                    Hostel Complex
                  </label>
                  <select
                    value={choice2Hostel}
                    onChange={(e) => {
                      setChoice2Hostel(e.target.value ? Number(e.target.value) : '');
                      setChoice2Room('');
                    }}
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
                    Specific Room Preference
                  </label>
                  <select
                    value={choice2Room}
                    onChange={(e) => setChoice2Room(e.target.value ? Number(e.target.value) : '')}
                    disabled={!choice2Hostel}
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
            <div
              style={{
                padding: '1.25rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.75rem',
                backgroundColor: 'var(--surface)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.875rem',
                }}
              >
                <strong
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                  }}
                >
                  Choice #3 (Third Preference — Optional)
                </strong>
                <Badge variant="neutral" size="sm">Priority 3</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
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
                    Hostel Complex
                  </label>
                  <select
                    value={choice3Hostel}
                    onChange={(e) => {
                      setChoice3Hostel(e.target.value ? Number(e.target.value) : '');
                      setChoice3Room('');
                    }}
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
                    Specific Room Preference
                  </label>
                  <select
                    value={choice3Room}
                    onChange={(e) => setChoice3Room(e.target.value ? Number(e.target.value) : '')}
                    disabled={!choice3Hostel}
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
