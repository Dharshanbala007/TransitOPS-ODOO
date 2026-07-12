import React from 'react';
import { useLocation } from 'react-router-dom';

export default function BackgroundWaves() {
  let isLoginPage = false;
  try {
    const location = useLocation();
    isLoginPage = location.pathname === '/login';
  } catch (err) {
    isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden -z-50 bg-[#000000] pointer-events-none select-none">
      {/* 3D sharded geometric obsidian mockup background */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: isLoginPage ? "url('/images/black_shards_bg.png')" : "url('/images/dashboard_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 1
        }}
      />
      {/* Grain overlay for tangible glass look */}
      <div className="absolute inset-0 w-full h-full noise-overlay" />
    </div>
  );
}
