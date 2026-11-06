import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../api/applicationsApi';
import { DashboardSummary } from '../types/application';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const HomePage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    applicationsApi.getDashboardSummary()
      .then(setSummary)
      .catch(() => {});
  }, []);

  const campus = summary?.campus;

  return (
    <div className="container">
      {/* Institutional Registrar Masthead Section */}
      <section
        style={{
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderTop: '3px solid var(--brand)',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Lovely Professional University • Residential Life &amp; Housing Services
            </span>
          </div>
          <h1
            style={{
              fontSize: '2.25rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: 600,
              lineHeight: 1.2,
              color: 'var(--ink)',
              margin: '0 0 1rem',
            }}
          >
            Hostel Management &amp; Roommate Allocation Portal
          </h1>
          <p
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.6,
              color: 'var(--text)',
              margin: '0 0 1.75rem',
            }}
          >
            Authoritative campus accommodation directory across 14 residential towers (BH-1 to BH-8 and GH-1 to GH-6).
            Transparent 10-month session fee structures, metered electricity quotas with equitable resident allocation,
            Pro Bricks dining subscriptions, and 7-factor deterministic roommate compatibility.
          </p>

          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            <Link to="/hostels" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                Explore Campus Hostels &rarr;
              </Button>
            </Link>
            <Link to="/rooms" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="lg">
                Browse Room Catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Campus Census Metrics Grid */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.375rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem' }}>
          Campus Accommodation Overview
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <Card>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.375rem' }}>
              Active Complexes
            </div>
            <div style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.1, margin: '0.25rem 0' }} className="tabular-nums">
              {campus?.total_hostels ?? 14}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              8 Boys &amp; 6 Girls Hostels
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.375rem' }}>
              Total Bed Inventory
            </div>
            <div style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.1, margin: '0.25rem 0' }} className="tabular-nums">
              {campus?.total_beds ?? 1858}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              1 to 8-Seaters &amp; Studios
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.375rem' }}>
              Vacant Beds
            </div>
            <div style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--status-success)', lineHeight: 1.1, margin: '0.25rem 0' }} className="tabular-nums">
              {campus?.vacant_beds ?? 1858}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Available for Allocation
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.375rem' }}>
              Active Cycle
            </div>
            <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)', margin: '0.5rem 0' }}>
              {campus?.active_cycle_name ?? 'Academic Year 2026-27'}
            </div>
            <Badge variant="success" size="sm">
              Applications Open
            </Badge>
          </Card>
        </div>
      </section>

      {/* Institutional Architecture Highlights */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.375rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem' }}>
          Key System Capabilities
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          <Card hoverable>
            <h3 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)', margin: '0 0 0.5rem' }}>
              7-Factor Roommate Matching
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
              Algorithmic compatibility evaluation across sleeping schedules (22%), cleanliness (17%), study environment (17%), noise tolerance, dietary preferences, and air-conditioning tolerance. Strictly excludes smoking with mandatory same-gender safety.
            </p>
          </Card>

          <Card hoverable>
            <h3 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)', margin: '0 0 0.5rem' }}>
              Metered Electricity Quotas
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
              Transparent allocations from 250 kWh up to 1,000 kWh per 10-month session based on room seater and cooling type. Any consumption beyond assigned quotas is divided equally among room occupants without administrative markups.
            </p>
          </Card>

          <Card hoverable>
            <h3 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)', margin: '0 0 0.5rem' }}>
              Pro Bricks Dining &amp; Auxiliary Services
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
              Subscribed regional dining across North Indian, South Indian, Rajasthani, Haryanvi, Gujarati, and Eastern cuisines with 2, 3, or 4-meal standard or à la carte meal plans, plus optional laundry and fitness facility access.
            </p>
          </Card>
        </div>
      </section>

      {/* University Compliance Banner */}
      <section>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--brand)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--ink)' }}>Residential Equipment &amp; Contraband Policy:</strong> Laptops, mobile chargers, electric kettles, hair dryers, and clothes irons are strictly permitted. Immersion heating rods and induction cooktops are contraband and strictly prohibited under Lovely Professional University residential safety guidelines.
          </div>
        </div>
      </section>
    </div>
  );
};
