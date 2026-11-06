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
      {/* Hero Section */}
      <section
        style={{
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
          color: '#ffffff',
          marginBottom: '2.5rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ maxWidth: '800px' }}>
          <Badge variant="primary" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: 'none', marginBottom: '1rem' }}>
            🎓 Official LPU Residential Enterprise Portal
          </Badge>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1.15,
              margin: '0 0 1rem',
              letterSpacing: '-0.03em',
            }}
          >
            Hostel Management &amp; Roommate Allocation System
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 2rem',
            }}
          >
            Explore 14 residential complexes across campus (BH-1 to BH-8, GH-1 to GH-6).
            Transparent 10-month academic session fees, metered electricity allowances,
            Pro Bricks mess subscriptions, and 7-factor automated roommate compatibility.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/hostels" style={{ textDecoration: 'none' }}>
              <Button size="lg" style={{ backgroundColor: '#ffffff', color: '#1e3a8a', borderColor: '#ffffff', fontWeight: 700 }}>
                Explore Campus Hostels &rarr;
              </Button>
            </Link>
            <Link to="/rooms" style={{ textDecoration: 'none' }}>
              <Button size="lg" variant="outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff' }}>
                Browse Room Catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Campus Statistics Grid */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Active Complexes
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0.25rem 0' }}>
              {campus?.total_hostels ?? 14}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              8 Boys &amp; 6 Girls Hostels
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Bed Inventory
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0.25rem 0' }}>
              {campus?.total_beds ?? 1858}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              1 to 8-Seaters &amp; Studios
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Vacant Beds
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)', margin: '0.25rem 0' }}>
              {campus?.vacant_beds ?? 1858}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Ready for immediate allocation
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Academic Cycle
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0.5rem 0' }}>
              {campus?.active_cycle_name ?? 'Academic Year 2026-27'}
            </div>
            <Badge variant="success" size="sm">
              Applications Open
            </Badge>
          </Card>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Key System Capabilities
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          <Card hoverable>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🤝</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
              7-Factor Roommate Matching
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Evaluate sleeping schedules (22%), cleanliness (17%), study habits (17%), noise tolerance, dietary choices, and temperature preferences to find aligned roommates.
            </p>
          </Card>

          <Card hoverable>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚡</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
              Metered Electricity Quotas
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Transparent allocations from 250 kWh up to 1,000 kWh per 10-month session depending on room tier, with equitable occupant division for overages.
            </p>
          </Card>

          <Card hoverable>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🍲</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
              Pro Bricks Mess &amp; Add-ons
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Choose North Indian, South Indian, Rajasthani, Haryanvi, Gujarati, or Eastern regional cuisines with 2, 3, or 4-meal standard or à la carte meal plans.
            </p>
          </Card>
        </div>
      </section>

      {/* University Compliance Banner */}
      <section>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--color-info-light)',
            border: '1px solid rgba(7, 89, 133, 0.2)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
            <strong>Residential Equipment Notice:</strong> Laptops, electric kettles, hair dryers, and clothes irons are strictly permitted. Immersion heating rods and induction cooktops are contraband and strictly prohibited under campus safety guidelines.
          </div>
        </div>
      </section>
    </div>
  );
};
