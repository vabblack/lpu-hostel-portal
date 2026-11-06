import React, { useState } from 'react';
import { CandidateMatch } from '../../types/roommate';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { RoommateHarmonyRadar } from './RoommateHarmonyRadar';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface CandidateCardProps {
  candidate: CandidateMatch;
  onSendRequest: (studentId: string) => void;
  isSending?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onSendRequest,
  isSending = false,
}) => {
  const [showRadar, setShowRadar] = useState(false);
  const score = candidate.score ? Math.round(candidate.score) : null;

  return (
    <Card hoverable style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Compatibility Text & Bar (DESIGN.md section 6 rule) */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Lifestyle Compatibility
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--primary)' }} className="tabular-nums">
            {score !== null ? `${score}% Match` : 'Evaluation Pending'}
          </span>
        </div>
        {/* Simple geometric horizontal progress bar */}
        <div
          style={{
            height: '4px',
            backgroundColor: 'var(--border)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${score || 0}%`,
              height: '100%',
              backgroundColor: 'var(--primary)',
              transition: 'width 300ms ease',
            }}
          />
        </div>
      </div>

      {/* Candidate Name & ID */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.125rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)' }}>
            {candidate.full_name}
          </h4>
          {candidate.is_room_aligned && (
            <Badge variant="success" size="sm">
              Same Room Target
            </Badge>
          )}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          ID: <strong style={{ color: 'var(--text)' }} className="tabular-nums">{candidate.student_id}</strong>
        </div>
      </div>

      {/* Academic Info */}
      <div
        style={{
          fontSize: '0.8125rem',
          color: 'var(--text)',
          backgroundColor: '#FAF8F3',
          border: '1px solid var(--border)',
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{candidate.branch || 'Undergraduate'}</span>
        {candidate.cgpa && (
          <span>
            CGPA: <strong className="tabular-nums">{candidate.cgpa.toFixed(2)}</strong>
          </span>
        )}
      </div>

      {/* Target Room Choice */}
      {candidate.target_room && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Preferred Room: <strong>{candidate.target_room}</strong>
        </div>
      )}

      {/* 7-Factor Radar Trigger */}
      {score !== null && (
        <div style={{ marginBottom: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setShowRadar(!showRadar)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--primary)',
              backgroundColor: '#FFF7ED',
              border: '1px solid #FFEDD5',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={12} />
              7-Factor Lifestyle Radar
            </span>
            {showRadar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showRadar && (
            <div style={{ marginTop: '0.5rem' }}>
              <RoommateHarmonyRadar score={score} compact />
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        {candidate.has_pending_request ? (
          <Button variant="secondary" size="sm" disabled style={{ width: '100%' }}>
            Request Pending
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSendRequest(candidate.student_id)}
            isLoading={isSending}
            style={{ width: '100%' }}
          >
            Connect / Request Roommate
          </Button>
        )}
      </div>
    </Card>
  );
};
