import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isFullBleed =
    isHome ||
    location.pathname === '/hostels' ||
    location.pathname === '/hostels/' ||
    location.pathname === '/rooms' ||
    location.pathname === '/rooms/';

  return (
    <div
      className="home-dark"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main
        id="main-content"
        style={{
          flex: 1,
          padding: isFullBleed ? '0' : '2.25rem 0 3.5rem',
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
};
