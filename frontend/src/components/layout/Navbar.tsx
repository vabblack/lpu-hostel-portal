import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EconomicsCalculatorModal } from '../economics/EconomicsCalculatorModal';
import { Calculator, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    setIsMobileOpen(false);
    await logout();
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    textDecoration: 'none',
    color: isActive ? '#FFFFFF' : '#DDD8CF',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.875rem',
    fontFamily: 'var(--font-sans)',
    padding: '0.45rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
    transition: 'color var(--transition-fast), background-color var(--transition-fast)',
    minHeight: '36px',
    display: 'inline-flex',
    alignItems: 'center',
  });

  const mobileLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    textDecoration: 'none',
    color: isActive ? '#FFFFFF' : '#DDD8CF',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.9375rem',
    padding: '0.625rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: isActive ? 'rgba(242, 101, 34, 0.18)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
    display: 'block',
  });

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--nav-bg, var(--ink))',
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
          height: '4.25rem',
          gap: '1rem',
        }}
      >
        {/* Official LPU Typographic Mark */}
        <Link
          to="/"
          onClick={() => setIsMobileOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: '#FFFFFF',
            minWidth: 0,
          }}
        >
          <img
            src="/lpu-crest.png"
            alt="LPU Crest"
            width={38}
            height={38}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid var(--brand)',
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(242, 101, 34, 0.28)',
            }}
          />
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
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
              Hostel &amp; Roommate Explorer
            </span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          aria-label="Primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'none',
              border: 'none',
              color: '#DDD8CF',
              fontWeight: 500,
              fontSize: '0.875rem',
              fontFamily: 'var(--font-sans)',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              minHeight: '36px',
              transition: 'color var(--transition-fast)',
            }}
          >
            <Calculator size={14} color="var(--brand)" aria-hidden="true" />
            Demo fee estimator
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

        {/* User / Actions + Mobile Menu Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
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
                  style={{ color: '#FFFFFF', borderColor: '#5C5750', height: '34px' }}
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
                    style={{ color: '#FFFFFF', borderColor: '#5C5750', height: '34px' }}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm" style={{ height: '34px' }}>
                    Claim Account
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileOpen}
            onClick={() => setIsMobileOpen((v) => !v)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 'var(--radius-md)',
              color: '#FFFFFF',
              minWidth: '40px',
              minHeight: '40px',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isMobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileOpen && (
        <nav
          aria-label="Mobile"
          style={{
            backgroundColor: '#161513',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1rem',
          }}
        >
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', padding: 0 }}>
            <NavLink to="/hostels" style={mobileLinkStyle} onClick={() => setIsMobileOpen(false)}>
              Explore Hostels
            </NavLink>
            <NavLink to="/rooms" style={mobileLinkStyle} onClick={() => setIsMobileOpen(false)}>
              Room Catalog
            </NavLink>
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                setIsCalcOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#DDD8CF',
                fontSize: '0.9375rem',
                fontWeight: 500,
                padding: '0.625rem 0.75rem',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <Calculator size={15} color="var(--brand)" aria-hidden="true" />
              Demo fee estimator
            </button>
            {isAuthenticated && (
              <>
                <NavLink to="/roommates" style={mobileLinkStyle} onClick={() => setIsMobileOpen(false)}>
                  Roommates
                </NavLink>
                <NavLink to="/apply" style={mobileLinkStyle} onClick={() => setIsMobileOpen(false)}>
                  Apply
                </NavLink>
                <NavLink to="/dashboard" style={mobileLinkStyle} onClick={() => setIsMobileOpen(false)}>
                  Dashboard
                </NavLink>
              </>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={handleLogout} style={{ color: '#FFFFFF', borderColor: '#5C5750', width: '100%' }}>
                  Sign Out
                </Button>
              ) : (
                <>
                  <Link to="/login" style={{ flex: 1, textDecoration: 'none' }} onClick={() => setIsMobileOpen(false)}>
                    <Button variant="outline" size="sm" style={{ color: '#FFFFFF', borderColor: '#5C5750', width: '100%' }}>
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" style={{ flex: 1, textDecoration: 'none' }} onClick={() => setIsMobileOpen(false)}>
                    <Button variant="primary" size="sm" style={{ width: '100%' }}>
                      Claim Account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Residential Economics & Tariff Simulator Modal */}
      <EconomicsCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
      />
    </header>
  );
};
