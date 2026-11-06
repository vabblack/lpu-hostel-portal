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

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Roommate Compatibility &amp; Request Center
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          Find compatible peers using LPU&apos;s 7-factor lifestyle matching algorithm. Form mutual roommate pairs or 2-4 bed groups.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '2rem',
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'DISCOVER', label: '🤝 Discover Matches' },
          {
            key: 'REQUESTS',
            label: `📬 Requests (${(requestsData?.received_requests.length || 0) + (requestsData?.sent_requests.length || 0)})`,
          },
          { key: 'GROUP', label: `👥 My Group ${group ? '(Active)' : ''}` },
          { key: 'PREFERENCES', label: '⚙️ Lifestyle Preferences' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ActiveTab)}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <Spinner label="Loading roommate portal..." />
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>{error}</div>
      ) : (
        <div>
          {/* TAB 1: DISCOVER */}
          {activeTab === 'DISCOVER' && (
            <div>
              {/* Notice if preferences not filled */}
              {!discoverData?.has_preferences && (
                <div
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--color-warning-light)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--color-warning)' }}>
                      Complete your 7-factor lifestyle questionnaire
                    </strong>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      Submit your preferences to enable algorithmic compatibility percentages with peers.
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setActiveTab('PREFERENCES')}>
                    Fill Preferences &rarr;
                  </Button>
                </div>
              )}

              {/* Direct Student ID Search */}
              <Card style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Enter Student ID (e.g. 12400002)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.875rem',
                    }}
                  />
                  <Button type="submit" variant="primary">
                    Search Student
                  </Button>
                </form>

                {/* Direct Search Result */}
                {discoverData?.search_result && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                      Search Result:
                    </div>
                    <div style={{ maxWidth: '400px' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                    Recommended Roommate Peers
                  </h3>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {discoverData?.recommendations.length || 0} candidates found
                  </span>
                </div>

                {discoverData?.recommendations.length === 0 ? (
                  <div
                    style={{
                      padding: '3rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                    <h3 style={{ margin: '0 0 0.5rem' }}>No Recommendations Yet</h3>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      Make sure your preferences are saved, or use direct student search above.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Incoming Roommate Requests ({requestsData?.received_requests.length || 0})
                </h3>
                {requestsData?.received_requests.length === 0 ? (
                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    No incoming roommate requests at this time.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {requestsData?.received_requests.map((r) => (
                      <Card key={r.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <strong style={{ fontSize: '1.0625rem' }}>{r.other_full_name}</strong>
                              <Badge variant="neutral" size="sm">#{r.other_student_id}</Badge>
                              <Badge variant={r.status === 'PENDING' ? 'warning' : 'neutral'} size="sm">
                                {r.status_display}
                              </Badge>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                              {r.other_branch} • Sent {r.created_at}
                            </div>
                          </div>
                          {r.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button variant="primary" size="sm" onClick={() => handleRespondRequest(r.id, 'ACCEPT')}>
                                Accept
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleRespondRequest(r.id, 'REJECT')}>
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Sent Requests ({requestsData?.sent_requests.length || 0})
                </h3>
                {requestsData?.sent_requests.length === 0 ? (
                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    You have not sent any pending roommate requests.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {requestsData?.sent_requests.map((r) => (
                      <Card key={r.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <strong style={{ fontSize: '1.0625rem' }}>{r.other_full_name}</strong>
                              <Badge variant="neutral" size="sm">#{r.other_student_id}</Badge>
                              <Badge variant={r.status === 'PENDING' ? 'warning' : r.status === 'ACCEPTED' ? 'success' : 'neutral'} size="sm">
                                {r.status_display}
                              </Badge>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                              {r.other_branch} • Sent {r.created_at}
                            </div>
                          </div>
                          {r.status === 'PENDING' && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelRequest(r.id)}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700 }}>
                        Roommate Group #{group.id}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Target Room: <strong>{group.target_room.hostel_name} — Room {group.target_room.room_number}</strong>
                      </div>
                    </div>
                    <Badge variant={group.is_confirmed ? 'success' : 'info'} size="md">
                      {group.is_confirmed ? '✓ Confirmed Group' : 'Forming Group'}
                    </Badge>
                  </div>

                  <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span>Capacity:</span>
                      <strong>{group.member_count} of {group.capacity} Members</strong>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Group Members:</h4>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {group.members.map((m) => (
                      <div
                        key={m.student_id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong>{m.full_name}</strong> (#{m.student_id})
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.branch}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Joined {m.joined_at}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                  <h3 style={{ margin: '0 0 0.5rem' }}>No Active Roommate Group</h3>
                  <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Once you send or accept a roommate request with a peer aligned on the same room, your group will be formed here automatically.
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
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700 }}>
                    7-Factor Lifestyle Questionnaire
                  </h3>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    These responses power the university matching engine to pair you with like-minded scholars.
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
