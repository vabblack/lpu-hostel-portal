import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EconomicsCalculatorModal } from '../economics/EconomicsCalculatorModal';
import { Calculator } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    textDecoration: 'none',
    color: isActive ? '#FFFFFF' : '#DDD8CF',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.875rem',
    fontFamily: 'var(--font-sans)',
    padding: '0.375rem 0.625rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
    transition: 'color var(--transition-fast), background-color var(--transition-fast)',
  });

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--ink)',
        color: '#FFFFFF',
        borderBottom: '3px solid var(--brand)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4rem',
        }}
      >
        {/* Official LPU Typographic Mark */}
        <Link
          to="/"
          style={{
            display: 'flex',
            flexDirection: 'column',
            textDecoration: 'none',
            color: '#FFFFFF',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              lineHeight: 1.2,
            }}
          >
            Lovely Professional University
          </span>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '0.8125rem',
              color: '#DDD8CF',
              fontStyle: 'italic',
              lineHeight: 1.2,
            }}
          >
            Residential Accommodation Portal
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          className="desktop-nav"
        >
          <NavLink to="/hostels" style={navLinkStyle}>
            Explore Hostels
          </NavLink>
          <NavLink to="/rooms" style={navLinkStyle}>
            Room Catalog
          </NavLink>
          <button
            type="button"
            onClick={() => setIsCalcOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'none',
              border: 'none',
              color: '#DDD8CF',
              fontWeight: 500,
              fontSize: '0.875rem',
              fontFamily: 'var(--font-sans)',
              padding: '0.375rem 0.625rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'color var(--transition-fast)',
            }}
          >
            <Calculator size={13} color="var(--brand)" />
            Fee Simulator
          </button>
          {isAuthenticated && (
            <>
              <NavLink to="/roommates" style={navLinkStyle}>
                Roommates
              </NavLink>
              <NavLink to="/apply" style={navLinkStyle}>
                Apply
              </NavLink>
              <NavLink to="/dashboard" style={navLinkStyle}>
                Dashboard
              </NavLink>
            </>
          )}
        </nav>

        {/* User / Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF' }}>
                  {user.student ? user.student.full_name : user.email.split('@')[0]}
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Badge variant={user.role === 'STUDENT' ? 'info' : 'warning'} size="sm">
                    {user.role}
                  </Badge>
                  {user.student && (
                    <span style={{ fontSize: '0.6875rem', color: '#DDD8CF', fontFamily: 'var(--font-sans)' }} className="tabular-nums">
                      #{user.student.student_id}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                style={{ color: '#FFFFFF', borderColor: '#5C5750', height: '32px' }}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ color: '#FFFFFF', borderColor: '#5C5750', height: '32px' }}
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm" style={{ height: '32px' }}>
                  Claim Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Residential Economics & Tariff Simulator Modal */}
      <EconomicsCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
      />
    </header>
  );
};
