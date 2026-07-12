import React, { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const tailRef = useRef(null);
  
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Particles state for the white glowing firestick sparks
  const [particles, setParticles] = useState([]);

  // Position LERP tracking refs
  const mouse = useRef({ x: 0, y: 0 });
  const dot = useRef({ x: 0, y: 0 });
  const tail = useRef({ x: 0, y: 0 });

  // Spring-mass-damper physics variables for squishy slime wobble
  const stretchPos = useRef(0);
  const stretchVel = useRef(0);

  useEffect(() => {
    // Detect mobile/touch devices
    const touchCheck = () => {
      const match = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window);
      setIsMobile(match);
    };
    touchCheck();
    window.addEventListener('resize', touchCheck);

    if (isMobile) return;

    // Track mouse moves
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (!isVisible) setIsVisible(true);

      // Spawn a new flame particle trail at the mouse position
      if (Math.random() < 0.5) {
        setParticles((prev) => [
          ...prev.slice(-25), // Keep max 25 sparks to protect performance
          {
            id: Math.random().toString(),
            x: e.clientX + (Math.random() - 0.5) * 14,
            y: e.clientY + (Math.random() - 0.5) * 14,
            size: Math.random() * 6 + 2.5, // sizes from 2.5px to 8.5px
            vx: (Math.random() - 0.5) * 1.2,
            vy: -(Math.random() * 2.0 + 1.5), // rise upwards like fire
            maxLife: 20 + Math.random() * 10,
            life: 20 + Math.random() * 10
          }
        ]);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Animation frame physics loop
    let frameId;
    const updatePhysics = () => {
      // 1. Interpolate Dot (Fast LERP)
      dot.current.x += (mouse.current.x - dot.current.x) * 0.25;
      dot.current.y += (mouse.current.y - dot.current.y) * 0.25;

      // 2. Interpolate Tail (Slower LERP for trailing whoosh)
      tail.current.x += (mouse.current.x - tail.current.x) * 0.065;
      tail.current.y += (mouse.current.y - tail.current.y) * 0.065;

      // Apply transforms directly to DOM elements
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0) translate3d(-50%, -50%, 0)`;
      }

      if (tailRef.current) {
        const dx = mouse.current.x - tail.current.x;
        const dy = mouse.current.y - tail.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // --- Mass-Spring-Damper Simulation for Slime/Sponge Wobble ---
        // targetStretch is the static stretch based on speed
        const targetStretch = Math.min(distance * 0.007, 0.75);
        
        // F = -k * x
        const force = -200 * (stretchPos.current - targetStretch);
        
        // Acceleration = Force - damping * velocity
        // Update velocity (dt is assumed 1/60s = 0.016)
        stretchVel.current += (force - 10 * stretchVel.current) * 0.016;
        
        // Update position
        stretchPos.current += stretchVel.current * 0.016;

        // Apply scale factors (ensure scale never drops below 0.2)
        const scaleX = Math.max(0.2, 1 + stretchPos.current);
        const scaleY = Math.max(0.2, 1 - stretchPos.current * 0.4);

        tailRef.current.style.transform = `
          translate3d(${tail.current.x}px, ${tail.current.y}px, 0) 
          translate3d(-50%, -50%, 0) 
          rotate(${angle}deg) 
          scale(${scaleX}, ${scaleY})
        `;
      }

      // Update particle positions (sparks rise and fade)
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 1
          }))
          .filter((p) => p.life > 0)
      );

      frameId = requestAnimationFrame(updatePhysics);
    };

    frameId = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener('resize', touchCheck);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(frameId);
    };
  }, [isMobile, isVisible]);

  if (isMobile) return null;

  return (
    <div className={`fixed inset-0 w-full h-full pointer-events-none z-[9999] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* 1. Flickering White Flame Sparks (Firestick Effect) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen">
        {particles.map((p) => {
          const ratio = p.life / p.maxLife;
          return (
            <div
              key={p.id}
              className="absolute rounded-full bg-white pointer-events-none"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                opacity: ratio * 0.85,
                transform: `translate3d(-50%, -50%, 0) scale(${ratio})`,
                boxShadow: '0 0 6px #ffffff, 0 0 12px #ffffff, 0 0 20px rgba(255,255,255,0.6)',
                willChange: 'transform, opacity'
              }}
            />
          );
        })}
      </div>

      {/* 2. Crescent Whooshy Comet Tail (Asymmetric thick border + heavy blur) */}
      <div 
        ref={tailRef}
        className="absolute w-36 h-36 rounded-full pointer-events-none mix-blend-screen"
        style={{
          background: 'transparent',
          border: '16px solid transparent',
          borderLeft: '22px solid rgba(255, 255, 255, 0.45)', // white glowing crescent
          borderBottom: '22px solid rgba(6, 182, 212, 0.18)', // cyan sweep highlight
          boxShadow: 'inset 12px -12px 30px rgba(255, 255, 255, 0.15)',
          filter: 'blur(9px)',
          willChange: 'transform'
        }}
      />

      {/* 3. Tactile Cursor Pointer (Pinkish-beige dot matching the photo) */}
      <div 
        ref={dotRef}
        className="absolute w-2 h-2 rounded-full pointer-events-none bg-[#e4b5a2] shadow-[0_0_8px_rgba(228,181,162,0.6)]"
        style={{
          willChange: 'transform'
        }}
      />

    </div>
  );
}
