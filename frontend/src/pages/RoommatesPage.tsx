import React, { useEffect, useState } from 'react';
import { roommatesApi, DiscoverResponse, RequestsResponse } from '../api/roommatesApi';
import { RoommatePreferences, RoommateGroupData } from '../types/roommate';
import { CandidateCard } from '../components/roommate/CandidateCard';
import { PreferenceForm } from '../components/roommate/PreferenceForm';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

type ActiveTab = 'DISCOVER' | 'REQUESTS' | 'PREFERENCES' | 'GROUP';

export const RoommatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('DISCOVER');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Discover state
  const [discoverData, setDiscoverData] = useState<DiscoverResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Requests state
  const [requestsData, setRequestsData] = useState<RequestsResponse | null>(null);

  // Preferences state
  const [preferences, setPreferences] = useState<RoommatePreferences | null>(null);

  // Group state
  const [group, setGroup] = useState<RoommateGroupData | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [disc, reqs, prefs, grp] = await Promise.all([
        roommatesApi.discoverCandidates().catch(() => null),
        roommatesApi.getRequests().catch(() => null),
        roommatesApi.getPreferences().catch(() => null),
        roommatesApi.getGroup().catch(() => null),
      ]);
      setDiscoverData(disc);
      setRequestsData(reqs);
      setPreferences(prefs?.preferences || null);
      setGroup(grp?.group || null);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load roommate data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await roommatesApi.discoverCandidates(searchQuery.trim());
      setDiscoverData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    }
  };

  const handleSendRequest = async (targetStudentId: string) => {
    setSendingId(targetStudentId);
    try {
      await roommatesApi.sendRequest(targetStudentId);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to send roommate request.');
    } finally {
      setSendingId(null);
    }
  };

  const handleRespondRequest = async (requestId: number, action: 'ACCEPT' | 'REJECT') => {
    try {
      await roommatesApi.respondRequest(requestId, action);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to respond to request.');
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      await roommatesApi.cancelRequest(requestId);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel request.');
    }
  };

  const handleSavePreferences = async (newPrefs: RoommatePreferences) => {
    await roommatesApi.savePreferences(newPrefs);
    setPreferences(newPrefs);
    await loadData();
  };

  const totalRequestsCount =
    (requestsData?.received_requests.length || 0) + (requestsData?.sent_requests.length || 0);

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
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
          Roommate Compatibility &amp; Request Center
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Evaluate compatibility via Lovely Professional University&apos;s 7-factor residential algorithm and establish verified roommate pairs or groups.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '2rem',
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'DISCOVER', label: 'Discover Matches' },
          {
            key: 'REQUESTS',
            label: `Requests (${totalRequestsCount})`,
          },
          { key: 'GROUP', label: `Roommate Group ${group ? '(Active)' : ''}` },
          { key: 'PREFERENCES', label: 'Lifestyle Preferences' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              style={{
                padding: '0.625rem 0.5rem',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9375rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: isActive ? 'var(--ink)' : 'var(--text-muted)',
                borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                marginBottom: '-1px',
                whiteSpace: 'nowrap',
                transition: 'color var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <Spinner label="Loading roommate portal..." />
      ) : error ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--status-danger)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {error}
        </div>
      ) : (
        <div>
          {/* TAB 1: DISCOVER */}
          {activeTab === 'DISCOVER' && (
            <div>
              {/* Notice if preferences not filled */}
              {!discoverData?.has_preferences && (
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    borderLeft: '3px solid #8A5A00',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--ink)', fontSize: '0.9375rem', display: 'block', marginBottom: '0.25rem' }}>
                      Complete your 7-factor lifestyle questionnaire
                    </strong>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Submit your lifestyle habits to compute deterministic compatibility percentages against peer residents.
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setActiveTab('PREFERENCES')}>
                    Complete Preferences &rarr;
                  </Button>
                </div>
              )}

              {/* Direct Student ID Search */}
              <Card style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search by Student Registration ID (e.g. 12400002)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '240px',
                      height: '38px',
                      padding: '0 0.875rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--ink)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <Button type="submit" variant="primary">
                    Search Student
                  </Button>
                </form>

                {/* Direct Search Result */}
                {discoverData?.search_result && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Search Result:
                    </div>
                    <div style={{ maxWidth: '420px' }}>
                      <CandidateCard
                        candidate={discoverData.search_result}
                        onSendRequest={handleSendRequest}
                        isSending={sendingId === discoverData.search_result.student_id}
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Recommendations Feed */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '1rem',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      margin: 0,
                    }}
                  >
                    Recommended Roommate Peers
                  </h3>
                  <span className="tabular-nums" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {discoverData?.recommendations.length || 0} candidates evaluated
                  </span>
                </div>

                {discoverData?.recommendations.length === 0 ? (
                  <div
                    style={{
                      padding: '3rem 2rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        margin: '0 0 0.5rem',
                      }}
                    >
                      No Recommendations Available
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Ensure your questionnaire is saved, or use direct student ID lookup above.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: '1.25rem',
                    }}
                  >
                    {discoverData?.recommendations.map((cand) => (
                      <CandidateCard
                        key={cand.student_id}
                        candidate={cand}
                        onSendRequest={handleSendRequest}
                        isSending={sendingId === cand.student_id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REQUESTS */}
          {activeTab === 'REQUESTS' && (
            <div>
              {/* Received Requests */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: '1rem',
                  }}
                >
                  Incoming Roommate Requests ({requestsData?.received_requests.length || 0})
                </h3>
                {requestsData?.received_requests.length === 0 ? (
                  <div
                    style={{
                      padding: '1.5rem',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.875rem',
                    }}
                  >
                    No incoming roommate requests currently pending.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {requestsData?.received_requests.map((r) => (
                      <Card key={r.id}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <strong
                                style={{
                                  fontFamily: 'var(--font-serif)',
                                  fontSize: '1.0625rem',
                                  fontWeight: 600,
                                  color: 'var(--ink)',
                                }}
                              >
                                {r.other_full_name}
                              </strong>
                              <Badge variant="neutral" size="sm">
                                <span className="tabular-nums">#{r.other_student_id}</span>
                              </Badge>
                              <Badge
                                variant={r.status === 'PENDING' ? 'warning' : 'neutral'}
                                size="sm"
                              >
                                {r.status_display}
                              </Badge>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                              {r.other_branch} • Received{' '}
                              <span className="tabular-nums">{r.created_at}</span>
                            </div>
                          </div>
                          {r.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleRespondRequest(r.id, 'ACCEPT')}
                              >
                                Accept Request
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRespondRequest(r.id, 'REJECT')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: '1rem',
                  }}
                >
                  Sent Requests ({requestsData?.sent_requests.length || 0})
                </h3>
                {requestsData?.sent_requests.length === 0 ? (
                  <div
                    style={{
                      padding: '1.5rem',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.875rem',
                    }}
                  >
                    You have not submitted any pending roommate requests.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {requestsData?.sent_requests.map((r) => (
                      <Card key={r.id}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <strong
                                style={{
                                  fontFamily: 'var(--font-serif)',
                                  fontSize: '1.0625rem',
                                  fontWeight: 600,
                                  color: 'var(--ink)',
                                }}
                              >
                                {r.other_full_name}
                              </strong>
                              <Badge variant="neutral" size="sm">
                                <span className="tabular-nums">#{r.other_student_id}</span>
                              </Badge>
                              <Badge
                                variant={
                                  r.status === 'PENDING'
                                    ? 'warning'
                                    : r.status === 'ACCEPTED'
                                    ? 'success'
                                    : 'neutral'
                                }
                                size="sm"
                              >
                                {r.status_display}
                              </Badge>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                              {r.other_branch} • Sent <span className="tabular-nums">{r.created_at}</span>
                            </div>
                          </div>
                          {r.status === 'PENDING' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCancelRequest(r.id)}
                            >
                              Cancel Request
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GROUP */}
          {activeTab === 'GROUP' && (
            <div>
              {group ? (
                <Card style={{ maxWidth: '650px', margin: '0 auto' }}>
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
                      <h3
                        style={{
                          margin: '0 0 0.25rem',
                          fontFamily: 'var(--font-serif)',
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}
                      >
                        Roommate Group #{group.id}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Target Room: <strong>{group.target_room.hostel_name} — Room {group.target_room.room_number}</strong>
                      </div>
                    </div>
                    <Badge variant={group.is_confirmed ? 'success' : 'neutral'} size="md">
                      {group.is_confirmed ? 'Confirmed Roster' : 'Forming Group'}
                    </Badge>
                  </div>

                  <div
                    style={{
                      marginBottom: '1.25rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Enrolled Capacity:</span>
                      <strong className="tabular-nums" style={{ color: 'var(--ink)' }}>
                        {group.member_count} of {group.capacity} Members
                      </strong>
                    </div>
                  </div>

                  <h4
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    Group Scholars:
                  </h4>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {group.members.map((m) => (
                      <div
                        key={m.student_id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--ink)' }}>{m.full_name}</strong> (
                          <span className="tabular-nums">#{m.student_id}</span>)
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.branch}</div>
                        </div>
                        <span className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Joined {m.joined_at}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <div
                  style={{
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      margin: '0 0 0.5rem',
                    }}
                  >
                    No Active Roommate Group
                  </h3>
                  <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Once mutual roommate requests are accepted for the same room target, your group configuration will appear here.
                  </p>
                  <Button variant="primary" onClick={() => setActiveTab('DISCOVER')}>
                    Discover Compatible Peers &rarr;
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PREFERENCES */}
          {activeTab === 'PREFERENCES' && (
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <Card>
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <h3
                    style={{
                      margin: '0 0 0.25rem',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    7-Factor Lifestyle Questionnaire
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Responses configure the university matching engine to evaluate compatibility across sleeping schedules, study habits, and cleanliness.
                  </p>
                </div>
                <PreferenceForm initialValues={preferences} onSave={handleSavePreferences} />
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
