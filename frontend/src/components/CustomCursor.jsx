import React, { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const canvasRef = useRef(null);
  const dotRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Mouse tracking
  const mouse = useRef({ x: 0, y: 0 });
  const prevMouse = useRef({ x: 0, y: 0 });
  const mouseVel = useRef({ x: 0, y: 0 });
  const dot = useRef({ x: 0, y: 0 });

  // Simulation arrays
  const particles = useRef([]);
  const vortices = useRef([]);
  const frameCount = useRef(0);
  const vortexDirection = useRef(1); // Alternates clockwise/counterclockwise

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

    // Canvas setup
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Seed initial position to avoid large jumps
    dot.current.x = mouse.current.x;
    dot.current.y = mouse.current.y;
    prevMouse.current.x = mouse.current.x;
    prevMouse.current.y = mouse.current.y;

    // Animation physics loop
    let frameId;
    const updateSimulation = () => {
      frameCount.current++;

      // 1. Calculate mouse velocity
      mouseVel.current.x = mouse.current.x - prevMouse.current.x;
      mouseVel.current.y = mouse.current.y - prevMouse.current.y;
      const speed = Math.hypot(mouseVel.current.x, mouseVel.current.y);

      // 2. Interpolated spawning to avoid gaps in fast movements
      if (isVisible) {
        const steps = Math.min(Math.floor(speed / 2.5), 18);
        for (let i = 0; i <= steps; i++) {
          const t = steps === 0 ? 1 : i / steps;
          const x = prevMouse.current.x + (mouse.current.x - prevMouse.current.x) * t;
          const y = prevMouse.current.y + (mouse.current.y - prevMouse.current.y) * t;

          // Spawn fluid trail particles
          particles.current.push({
            id: Math.random().toString(),
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: mouseVel.current.x * 0.12 + (Math.random() - 0.5) * 0.8,
            vy: mouseVel.current.y * 0.12 + (Math.random() - 0.5) * 0.8,
            life: 55 + Math.random() * 25,
            maxLife: 55 + Math.random() * 25,
            size: 16 + Math.random() * 8
          });
        }

        // Spawn a subtle vortex if moving quickly
        if (speed > 8 && frameCount.current % 2 === 0) {
          vortexDirection.current *= -1; // alternate rotation
          vortices.current.push({
            x: mouse.current.x,
            y: mouse.current.y,
            vx: mouseVel.current.x * 0.15,
            vy: mouseVel.current.y * 0.15,
            strength: vortexDirection.current * (speed * 0.14),
            radius: 95 + Math.random() * 40,
            life: 35
          });
        }
      }

      // 3. Update Vortices (decay strength and drift)
      vortices.current.forEach((v) => {
        v.x += v.vx;
        v.y += v.vy;
        v.vx *= 0.94;
        v.vy *= 0.94;
        v.strength *= 0.92;
        v.life--;
      });
      vortices.current = vortices.current.filter((v) => v.life > 0);

      // 4. Update Particles (apply vortex forces, buoyancy, Perlin-like noise, and friction)
      const time = Date.now() * 0.0035;
      particles.current.forEach((p) => {
        // Apply forces from all active vortices
        vortices.current.forEach((v) => {
          const dx = p.x - v.x;
          const dy = p.y - v.y;
          const dist = Math.hypot(dx, dy) + 0.1;
          if (dist < v.radius) {
            // Distance-based linear falloff
            const factor = (1 - dist / v.radius) * v.strength;
            // Perpendicular swirl vector
            const rx = -dy / dist;
            const ry = dx / dist;
            p.vx += rx * factor * 0.28;
            p.vy += ry * factor * 0.28;
          }
        });

        // Slow upward drift / buoyancy
        p.vy -= 0.05;

        // Add periodic fluid-like wave simulation (low frequency noise)
        p.vx += Math.sin(p.y * 0.015 + time) * 0.12;
        p.vy += Math.cos(p.x * 0.015 + time) * 0.12;

        // Apply friction/air damping
        p.vx *= 0.955;
        p.vy *= 0.955;

        // Update positions & size (grows as it diffuses/spreads)
        p.x += p.vx;
        p.y += p.vy;
        p.size += 0.45;
        p.life--;
      });
      particles.current = particles.current.filter((p) => p.life > 0);

      // 5. Draw simulation on Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'screen';

      particles.current.forEach((p) => {
        const ageRatio = p.life / p.maxLife; // 1 to 0
        const radius = p.size;
        const opacity = ageRatio * 0.35; // Soft glow blending

        // Create volumetric fluid-like radial gradient
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        
        // Glowing white core
        grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
        // Smooth transition to cyan/teal highlight
        grad.addColorStop(0.2, `rgba(255, 255, 255, ${opacity * 0.95})`);
        grad.addColorStop(0.4, `rgba(180, 248, 250, ${opacity * 0.65})`); // cyan tint
        grad.addColorStop(0.7, `rgba(34, 211, 238, ${opacity * 0.2})`);  // outer glow
        grad.addColorStop(1, 'rgba(34, 211, 238, 0)');                   // transparent

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. Update responsive DOM red dot cursor
      dot.current.x += (mouse.current.x - dot.current.x) * 0.35;
      dot.current.y += (mouse.current.y - dot.current.y) * 0.35;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0) translate3d(-50%, -50%, 0)`;
      }

      // Store previous mouse position
      prevMouse.current.x = mouse.current.x;
      prevMouse.current.y = mouse.current.y;

      frameId = requestAnimationFrame(updateSimulation);
    };

    frameId = requestAnimationFrame(updateSimulation);

    return () => {
      window.removeEventListener('resize', touchCheck);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(frameId);
    };
  }, [isMobile, isVisible]);

  if (isMobile) return null;

  return (
    <div className={`fixed inset-0 w-full h-full pointer-events-none z-[9999] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Fluid Smoke Trail Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Tactile Red Dot Cursor (matching the image) */}
      <div 
        ref={dotRef}
        className="absolute w-2.5 h-2.5 rounded-full pointer-events-none bg-[#7a2b21] border border-[#a84437]/40 shadow-[0_0_12px_rgba(122,43,33,0.9)]"
        style={{
          willChange: 'transform'
        }}
      />
    </div>
  );
}

