import React, { useState, useMemo } from 'react';
import { FloorRoomDetail } from '../../types/hostel';
import { Compass, Bed, Wind, Snowflake, Layers, CheckCircle, AlertCircle, Eye } from 'lucide-react';

interface ArchitecturalFloorPlanProps {
  floorLabel: string;
  blockName: string;
  rooms: FloorRoomDetail[];
  onSelectRoom: (room: FloorRoomDetail) => void;
  selectedRoomId?: number | null;
}

export const ArchitecturalFloorPlan: React.FC<ArchitecturalFloorPlanProps> = ({
  floorLabel,
  blockName,
  rooms,
  onSelectRoom,
  selectedRoomId,
}) => {
  const [capacityFilter, setCapacityFilter] = useState<number | 'ALL'>('ALL');
  const [coolingFilter, setCoolingFilter] = useState<'ALL' | 'AC' | 'AIR_COOLED'>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (capacityFilter !== 'ALL' && r.capacity !== capacityFilter) return false;
      if (coolingFilter === 'AC' && !r.is_air_conditioned) return false;
      if (coolingFilter === 'AIR_COOLED' && r.is_air_conditioned) return false;
      if (onlyAvailable && r.vacant_beds_count === 0) return false;
      return true;
    });
  }, [rooms, capacityFilter, coolingFilter, onlyAvailable]);

  // Symmetrically divide rooms into North Wing (even numbers) and South Wing (odd numbers)
  const { northWing, southWing } = useMemo(() => {
    const north: FloorRoomDetail[] = [];
    const south: FloorRoomDetail[] = [];
    filteredRooms.forEach((room) => {
      // Determine if trailing digits are even or odd
      const numMatch = room.room_number.match(/\d+$/);
      const val = numMatch ? parseInt(numMatch[0], 10) : room.id;
      if (val % 2 === 0) {
        north.push(room);
      } else {
        south.push(room);
      }
    });
    // Sort logically by room number
    north.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
    south.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
    return { northWing: north, southWing: south };
  }, [filteredRooms]);

  return (
    <div
      style={{
        backgroundColor: '#FCFAF7',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Blueprint Top Header & Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              backgroundColor: '#FAF5EE',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Compass size={20} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--primary)',
                }}
              >
                2D Architectural Blueprint Plan
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>• REV 4.2</span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.2rem',
                margin: 0,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
              }}
            >
              {blockName} — {floorLabel} Layout
            </h3>
          </div>
        </div>

        {/* Blueprint Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Seater Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Capacity:
            </span>
            <div style={{ display: 'flex', border: '1px solid var(--border)', backgroundColor: '#fff' }}>
              {(['ALL', 1, 2, 3, 4] as const).map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setCapacityFilter(cap)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: capacityFilter === cap ? 600 : 400,
                    backgroundColor: capacityFilter === cap ? 'var(--ink)' : 'transparent',
                    color: capacityFilter === cap ? '#fff' : 'var(--text)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {cap === 'ALL' ? 'All' : `${cap}S`}
                </button>
              ))}
            </div>
          </div>

          {/* Cooling Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Cooling:
            </span>
            <div style={{ display: 'flex', border: '1px solid var(--border)', backgroundColor: '#fff' }}>
              {(['ALL', 'AC', 'AIR_COOLED'] as const).map((cool) => (
                <button
                  key={cool}
                  type="button"
                  onClick={() => setCoolingFilter(cool)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: coolingFilter === cool ? 600 : 400,
                    backgroundColor: coolingFilter === cool ? 'var(--ink)' : 'transparent',
                    color: coolingFilter === cool ? '#fff' : 'var(--text)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {cool === 'ALL' ? 'All' : cool === 'AC' ? 'AC' : 'Cooler'}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Toggle */}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              color: 'var(--text)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            Vacant Only
          </label>
        </div>
      </div>

      {/* Blueprint Drawing Canvas */}
      <div
        style={{
          padding: '2rem',
          position: 'relative',
          overflowX: 'auto',
          backgroundImage:
            'radial-gradient(circle, #EAE4D8 1px, transparent 1px), radial-gradient(circle, #EAE4D8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      >
        {/* Architectural Orientation Indicator & Drawing Stamp */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px dashed var(--border-strong)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
              }}
            >
              SCALE: 1:100 SCHEMATIC • UNITS: METRIC
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {filteredRooms.length} of {rooms.length} Units
            </span>
          </div>

          {/* Blueprint Compass Orientation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.6875rem',
              fontWeight: 600,
              fontFamily: 'monospace',
              color: 'var(--ink)',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                border: '1px solid var(--ink)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: '0.625rem', fontWeight: 800, transform: 'translateY(-1px)' }}>N</span>
            </div>
            <span>ORIENTATION: NORTH-FACING</span>
          </div>
        </div>

        {/* Blueprint Layout Schema: North Wing -> Corridor -> South Wing */}
        <div style={{ minWidth: '880px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* North Wing Units */}
          <div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--primary)' }} />
              North Corridor Wing (Even Units)
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {northWing.map((room) => (
                <RoomArchitecturalCell
                  key={room.id}
                  room={room}
                  isSelected={selectedRoomId === room.id}
                  onSelect={() => onSelectRoom(room)}
                  doorPosition="bottom"
                />
              ))}
              {northWing.length === 0 && (
                <div
                  style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    fontStyle: 'italic',
                    gridColumn: '1 / -1',
                    border: '1px dashed var(--border)',
                  }}
                >
                  No rooms in North Wing match current filter.
                </div>
              )}
            </div>
          </div>

          {/* Central Architectural Spine / Corridor */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#EDE7DC',
              border: '2px dashed var(--border-strong)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '2px',
              margin: '0.5rem 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--ink)',
                  textTransform: 'uppercase',
                }}
              >
                ◀ WEST STAIRWELL & EMERGENCY EXIT
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                }}
              >
                <Layers size={13} />
                <span>CORE: 4x HIGH-SPEED ELEVATORS & RO DRINKING ALCOVE</span>
              </div>
            </div>

            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--ink)',
                textTransform: 'uppercase',
              }}
            >
              MAIN CENTRAL CORRIDOR (WIDTH: 2.40m) ▶
            </div>
          </div>

          {/* South Wing Units */}
          <div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--brand)' }} />
              South Corridor Wing (Odd Units)
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {southWing.map((room) => (
                <RoomArchitecturalCell
                  key={room.id}
                  room={room}
                  isSelected={selectedRoomId === room.id}
                  onSelect={() => onSelectRoom(room)}
                  doorPosition="top"
                />
              ))}
              {southWing.length === 0 && (
                <div
                  style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    fontStyle: 'italic',
                    gridColumn: '1 / -1',
                    border: '1px dashed var(--border)',
                  }}
                >
                  No rooms in South Wing match current filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Blueprint Legend Bar */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem 1.25rem',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Plan Notation:
            </span>

            {/* Vacant Bed indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#1E6B3A',
                  border: '1px solid #14532D',
                }}
              />
              <span>Vacant Bed Available</span>
            </div>

            {/* Occupied Bed indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#D6D3D1',
                  border: '1px solid #A8A29E',
                }}
              />
              <span style={{ color: 'var(--text-muted)' }}>Occupied Bed</span>
            </div>

            {/* Door swing arc indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ overflow: 'visible' }}>
                <path d="M 2 12 L 2 2 A 10 10 0 0 1 12 12 Z" fill="none" stroke="#C2410C" strokeWidth="1.2" strokeDasharray="2,2" />
                <line x1="2" y1="12" x2="2" y2="2" stroke="#1A1A1A" strokeWidth="1.5" />
              </svg>
              <span>Door Clearance Arc</span>
            </div>

            {/* Window Lintel */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
              <div style={{ width: '16px', height: '4px', backgroundColor: '#38BDF8', border: '1px solid #0284C7' }} />
              <span>Exterior Fenestration</span>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Click any architectural unit to inspect bed slots & tariffs
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Architectural Room Unit Cell
// =============================================================================
interface RoomArchitecturalCellProps {
  room: FloorRoomDetail;
  isSelected: boolean;
  onSelect: () => void;
  doorPosition: 'top' | 'bottom';
}

const RoomArchitecturalCell: React.FC<RoomArchitecturalCellProps> = ({
  room,
  isSelected,
  onSelect,
  doorPosition,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isAvailable = room.vacant_beds_count > 0;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: isSelected ? '#FFF8F3' : isHovered ? '#FFFFFF' : '#FBF9F5',
        border: `2px solid ${
          isSelected
            ? 'var(--primary)'
            : isHovered
            ? 'var(--ink)'
            : 'var(--border-strong)'
        }`,
        borderRadius: '2px',
        padding: '0.75rem',
        cursor: 'pointer',
        transition: 'all 120ms ease-out',
        boxShadow: isSelected
          ? '0 0 0 3px rgba(194, 65, 12, 0.15)'
          : isHovered
          ? '0 2px 8px rgba(0, 0, 0, 0.08)'
          : 'none',
      }}
    >
      {/* Exterior Window Lintel Marker (Top for North, Bottom for South) */}
      <div
        style={{
          position: 'absolute',
          [doorPosition === 'bottom' ? 'top' : 'bottom']: '-3px',
          left: '25%',
          width: '50%',
          height: '4px',
          backgroundColor: '#38BDF8',
          border: '1px solid #0284C7',
          zIndex: 2,
        }}
        title="Exterior Window"
      />

      {/* Door Swing Marker on Corridor Side */}
      <div
        style={{
          position: 'absolute',
          [doorPosition === 'bottom' ? 'bottom' : 'top']: '-1px',
          left: '12px',
          width: '20px',
          height: '14px',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      >
        <svg width="20" height="14" viewBox="0 0 20 14" style={{ overflow: 'visible' }}>
          <path
            d={
              doorPosition === 'bottom'
                ? 'M 2 14 A 12 12 0 0 1 14 2'
                : 'M 2 0 A 12 12 0 0 0 14 12'
            }
            fill="none"
            stroke={isSelected ? 'var(--primary)' : '#8A5A00'}
            strokeWidth="1.2"
            strokeDasharray="2,2"
          />
          <line
            x1="2"
            y1={doorPosition === 'bottom' ? 14 : 0}
            x2="2"
            y2={doorPosition === 'bottom' ? 2 : 12}
            stroke="var(--ink)"
            strokeWidth="1.8"
          />
        </svg>
      </div>

      {/* Room Identification Line */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.4rem',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.625rem',
              color: 'var(--text-muted)',
              display: 'block',
              letterSpacing: '0.04em',
            }}
          >
            UNIT
          </span>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}
          >
            {room.room_number}
          </span>
        </div>

        {/* Cooling & Seater Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.15rem 0.35rem',
              fontSize: '0.625rem',
              fontWeight: 600,
              backgroundColor: room.is_air_conditioned ? '#EFF6FF' : '#FEF3C7',
              color: room.is_air_conditioned ? '#1D4ED8' : '#B45309',
              border: `1px solid ${room.is_air_conditioned ? '#BFDBFE' : '#FDE68A'}`,
              borderRadius: '2px',
            }}
          >
            {room.is_air_conditioned ? <Snowflake size={10} /> : <Wind size={10} />}
            {room.capacity}S {room.is_air_conditioned ? 'AC' : 'CL'}
          </span>
        </div>
      </div>

      {/* Bed Bay Vector Visualization */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(room.capacity, 4)}, 1fr)`,
          gap: '0.35rem',
          margin: '0.6rem 0 0.5rem',
          padding: '0.35rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: '2px',
        }}
      >
        {room.beds.map((bed, idx) => {
          const bedCode = bed.identifier || String.fromCharCode(65 + idx);
          const isOccupied = bed.status !== 'VACANT';
          return (
            <div
              key={bed.id}
              title={`Bed ${bedCode}: ${isOccupied ? 'Occupied' : 'Vacant'}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.3rem 0.1rem',
                backgroundColor: isOccupied ? '#F5F5F4' : '#E7F2EA',
                border: `1px solid ${isOccupied ? '#D6D3D1' : '#1E6B3A'}`,
                borderRadius: '1px',
                transition: 'all 100ms ease',
              }}
            >
              <Bed
                size={12}
                color={isOccupied ? '#78716C' : '#1E6B3A'}
                strokeWidth={isOccupied ? 1.5 : 2}
              />
              <span
                style={{
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  color: isOccupied ? '#78716C' : '#1E6B3A',
                  marginTop: '0.1rem',
                }}
              >
                {bedCode}
              </span>
            </div>
          );
        })}
      </div>

      {/* Room Footer Status & Tariff Preview */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.6875rem',
          borderTop: '1px dotted var(--border)',
          paddingTop: '0.35rem',
          marginTop: '0.35rem',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: isAvailable ? '#1E6B3A' : '#A4161A',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
          }}
        >
          {isAvailable ? (
            <>
              <CheckCircle size={10} />
              {room.vacant_beds_count} Vacant
            </>
          ) : (
            'Full'
          )}
        </span>

        {room.standard_fee && (
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ink)' }}>
            ₹{(room.standard_fee / 1000).toFixed(0)}k
          </span>
        )}
      </div>
    </div>
  );
};
