import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-krem text-coklat-tua">
    <a className="skip-link" href="#main-content">Lewati ke konten</a>
    <Navbar />
    <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Outlet />
    </main>
    <Footer />
  </div>
);
