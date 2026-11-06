import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    textDecoration: 'none',
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.9375rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
    transition: 'all var(--transition-fast)',
  });

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
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
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1.125rem',
            }}
          >
            H
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
              Hostel Portal
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1,
              }}
            >
              Lovely Professional University
            </span>
          </div>
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
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {user.student ? user.student.full_name : user.email.split('@')[0]}
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                  <Badge variant={user.role === 'STUDENT' ? 'info' : 'warning'} size="sm">
                    {user.role}
                  </Badge>
                  {user.student && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      #{user.student.student_id}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm">
                  Claim Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
