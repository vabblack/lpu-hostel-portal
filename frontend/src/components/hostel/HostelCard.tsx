import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Sparkles, Users, XCircle } from 'lucide-react';
import { HostelSummary } from '../../types/hostel';
import { Badge } from '../common/Badge';

interface HostelCardProps {
  hostel: HostelSummary;
}

const STUDIO_CODES = new Set(['BH-9', 'BH-10', 'GS-9']);

export const HostelCard: React.FC<HostelCardProps> = ({ hostel }) => {
  const isStudioComplex =
    STUDIO_CODES.has(hostel.code) || hostel.name.toLowerCase().includes('studio');
  const isActive = hostel.status === 'ACTIVE';
  const fillWidth = Math.min(100, Math.max(0, hostel.occupancy_pct));

  return (
    <div className="card-container">
      <article className="neo-card-article" aria-label={`${hostel.name} (${hostel.code})`}>
        {/* Top Tag Strip */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge variant="neutral" size="sm">
              <Building2 size={12} aria-hidden="true" />
              {hostel.gender_policy_display}
            </Badge>
            {isStudioComplex && (
              <Badge
                variant="primary"
                size="sm"
                style={{
                  borderColor: 'var(--brand)',
                  color: '#ffd7b8',
                  backgroundColor: 'rgba(242, 101, 34, 0.16)',
                }}
              >
                <Sparkles size={11} aria-hidden="true" />
                Studio Complex
              </Badge>
            )}
          </div>
          <Badge variant={isActive ? 'success' : 'danger'} size="sm">
            {isActive ? <CheckCircle2 size={12} aria-hidden="true" /> : <XCircle size={12} aria-hidden="true" />}
            {hostel.status_display}
          </Badge>
        </header>

        {/* Building Title */}
        <hgroup style={{ marginBottom: '0.625rem' }}>
          <h3
            style={{
              margin: '0 0 0.2rem',
              fontSize: '1.3125rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            {hostel.name}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--primary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {hostel.code} &middot; {hostel.total_rooms} Rooms &middot; {hostel.ac_rooms_count} AC
          </p>
        </hgroup>

        {/* Concise Description */}
        <p className="neo-card-desc" style={{ flex: 1, marginBottom: '1rem' }}>
          {hostel.description}
        </p>

        {/* Metrics Bento */}
        <div style={{ marginBottom: '1.125rem' }}>
          <div className="neo-stat-strip">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Capacity
              </div>
              <div
                className="tabular-nums"
                style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}
              >
                {hostel.total_beds}
              </div>
            </div>

            <div
              style={{
                textAlign: 'center',
                borderInline: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Open Beds
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  color: hostel.vacant_beds > 0 ? 'var(--status-success)' : 'var(--status-danger)',
                }}
              >
                {hostel.vacant_beds}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Occupancy
              </div>
              <div
                className="tabular-nums"
                style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}
              >
                {hostel.occupancy_pct}%
              </div>
            </div>
          </div>

          {/* Minimal Structural Occupancy Rail */}
          <div
            aria-hidden="true"
            style={{
              height: '4px',
              background: '#171615',
              borderInline: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${fillWidth}%`,
                background: fillWidth > 85 ? 'var(--brand)' : 'var(--status-success)',
              }}
            />
          </div>
        </div>

        {/* Footer Fee & Dual Actions */}
        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            paddingTop: '0.875rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              10-Mo Session From
            </div>
            <div
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                fontSize: '1.125rem',
                color: 'var(--ink)',
              }}
            >
              {hostel.min_standard_fee
                ? `₹${Number(hostel.min_standard_fee).toLocaleString('en-IN')}`
                : 'On Request'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              to={`/rooms?hostel_id=${hostel.id}`}
              className="neo-ghost-btn"
              aria-label={`Browse rooms in ${hostel.name}`}
            >
              <Users size={13} aria-hidden="true" />
              Rooms
            </Link>
            <Link
              to={`/hostels/${hostel.id}`}
              className="neo-cta-btn"
              aria-label={`Inspect ${hostel.name}`}
            >
              Inspect
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
};
