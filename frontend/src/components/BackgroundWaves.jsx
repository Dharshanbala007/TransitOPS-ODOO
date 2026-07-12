import React from 'react';

export default function BackgroundWaves() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden -z-50 bg-[#000000] pointer-events-none select-none">
      {/* 3D sharded geometric obsidian mockup background */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: "url('/black_shards_bg.png')",
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
