import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/authContext';

export const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-krem flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-garis border-t-terracotta rounded-full animate-spin mb-4" />
        <p className="font-lora text-coklat-sedang text-sm">Memeriksa kunci ruang pengelola...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};
