import React from 'react';
import { RoommatePreferences } from '../../types/roommate';
import { Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

interface RoommateHarmonyRadarProps {
  score: number;
  preferences?: Partial<RoommatePreferences>;
  compact?: boolean;
}

interface DimensionScore {
  label: string;
  myScore: number;
  theirScore: number;
  aligned: boolean;
}

export const RoommateHarmonyRadar: React.FC<RoommateHarmonyRadarProps> = ({
  score,
  preferences,
  compact = false,
}) => {
  const matchPct = Math.round(score);

  // Synthesize or derive the 7 lifestyle axes
  const p = preferences || {};
  const breakdown: DimensionScore[] = [
    {
      label: 'Sleep Schedule',
      myScore: 4,
      theirScore: p.sleeping_schedule ?? (matchPct > 70 ? 4 : 2),
      aligned: (p.sleeping_schedule ?? (matchPct > 70 ? 4 : 2)) >= 3,
    },
    {
      label: 'Cleanliness',
      myScore: 5,
      theirScore: p.cleanliness ?? (matchPct > 80 ? 5 : 3),
      aligned: (p.cleanliness ?? (matchPct > 80 ? 5 : 3)) >= 4,
    },
    {
      label: 'Study Habits',
      myScore: 4,
      theirScore: p.study_habits ?? (matchPct > 65 ? 4 : 3),
      aligned: true,
    },
    {
      label: 'Noise Tolerance',
      myScore: 3,
      theirScore: p.noise_tolerance ?? (matchPct > 75 ? 3 : 2),
      aligned: true,
    },
    {
      label: 'Dietary Alignment',
      myScore: 4,
      theirScore: p.food_preference === 'VEGETARIAN' ? 4 : (matchPct > 80 ? 4 : 3),
      aligned: matchPct > 60,
    },
    {
      label: 'Social Frequency',
      myScore: 3,
      theirScore: p.social_preference ?? (matchPct > 70 ? 4 : 2),
      aligned: true,
    },
    {
      label: 'Thermal / AC',
      myScore: 4,
      theirScore: p.temperature_pref ?? (matchPct > 85 ? 4 : 3),
      aligned: matchPct > 75,
    },
  ];

  // SVG Radar Coordinates
  const size = compact ? 160 : 220;
  const center = size / 2;
  const radius = compact ? 60 : 85;
  const numSides = breakdown.length;

  const getCoordinates = (index: number, value: number, max: number = 5) => {
    const angle = (Math.PI * 2 / numSides) * index - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = breakdown
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.theirScore);
      return `${x},${y}`;
    })
    .join(' ');

  const gridCircles = [0.25, 0.5, 0.75, 1.0].map((scale) => {
    return breakdown
      .map((_, i) => {
        const angle = (Math.PI * 2 / numSides) * i - Math.PI / 2;
        const r = radius * scale;
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
      })
      .join(' ');
  });

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: '2px',
        padding: compact ? '0.75rem' : '1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--primary)',
            }}
          >
            7-Factor Harmony Radar
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Lifestyle & Study Symmetry
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.5rem',
            backgroundColor: matchPct >= 80 ? '#E7F2EA' : '#FBF1DC',
            border: `1px solid ${matchPct >= 80 ? '#1E6B3A' : '#8A5A00'}`,
            borderRadius: '2px',
          }}
        >
          <Sparkles size={12} color={matchPct >= 80 ? '#1E6B3A' : '#8A5A00'} />
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.8125rem',
              color: matchPct >= 80 ? '#1E6B3A' : '#8A5A00',
            }}
          >
            {matchPct}% Match
          </span>
        </div>
      </div>

      {/* Radar SVG Visualizer */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Grid webs */}
          {gridCircles.map((pts, idx) => (
            <polygon
              key={idx}
              points={pts}
              fill="none"
              stroke="#E8E4DC"
              strokeWidth="0.8"
              strokeDasharray={idx < 3 ? '2,2' : undefined}
            />
          ))}

          {/* Radial Axis Spokes */}
          {breakdown.map((_, i) => {
            const { x, y } = getCoordinates(i, 5);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#E8E4DC"
                strokeWidth="0.8"
              />
            );
          })}

          {/* Candidate Profile Polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(194, 65, 12, 0.2)"
            stroke="var(--primary)"
            strokeWidth="1.6"
          />

          {/* Data Points on vertices */}
          {breakdown.map((d, i) => {
            const { x, y } = getCoordinates(i, d.theirScore);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill={d.aligned ? '#1E6B3A' : 'var(--primary)'}
                stroke="#fff"
                strokeWidth="1.2"
              />
            );
          })}
        </svg>
      </div>

      {/* Axis Labels & Synergy Bulletins */}
      {!compact && (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
            {breakdown.map((d, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.6875rem',
                  color: d.aligned ? '#1E6B3A' : 'var(--text-muted)',
                }}
              >
                {d.aligned ? (
                  <CheckCircle size={10} color="#1E6B3A" />
                ) : (
                  <AlertTriangle size={10} color="#8A5A00" />
                )}
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
