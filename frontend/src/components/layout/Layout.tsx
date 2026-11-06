import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
      }}
    >
      <Navbar />
      <main style={{ flex: 1, padding: '2rem 0' }}>{children}</main>
      <Footer />
    </div>
  );
};
