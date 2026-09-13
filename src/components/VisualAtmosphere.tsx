import React, { useEffect, useRef } from 'react';
import { ThemeId } from '../types';

interface VisualAtmosphereProps {
  themeId: ThemeId;
  enabled: boolean;
  activeCount: number;
}

interface Particle {
  x: number;
  y: number;
  speedY: number;
  speedX: number;
  radius: number;
  alpha: number;
  fadeSpeed: number;
}

export const VisualAtmosphere: React.FC<VisualAtmosphereProps> = ({ themeId, enabled, activeCount }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || activeCount === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate lightweight ambient particles based on theme
    const particleCount = Math.min(45, 12 + activeCount * 4);
    const particles: Particle[] = [];

    const getThemeColor = () => {
      switch (themeId) {
        case 'midnight':
          return { r: 168, g: 85, b: 247, secondary: { r: 56, g: 189, b: 248 } };
        case 'ocean':
          return { r: 6, g: 182, b: 212, secondary: { r: 56, g: 189, b: 248 } };
        case 'forest':
          return { r: 34, g: 197, b: 94, secondary: { r: 163, g: 230, b: 53 } };
        case 'sunset':
          return { r: 249, g: 115, b: 22, secondary: { r: 244, g: 63, b: 94 } };
        case 'crimson':
          return { r: 239, g: 68, b: 68, secondary: { r: 185, g: 28, b: 28 } };
        case 'lavender':
          return { r: 192, g: 132, b: 252, secondary: { r: 244, g: 114, b: 182 } };
        case 'coffee':
          return { r: 217, g: 119, b: 6, secondary: { r: 245, g: 158, b: 11 } };
        case 'arctic':
          return { r: 56, g: 189, b: 248, secondary: { r: 125, g: 211, b: 252 } };
        case 'neon':
          return { r: 236, g: 72, b: 153, secondary: { r: 6, g: 182, b: 212 } };
        default:
          return { r: 139, g: 92, b: 246, secondary: { r: 56, g: 189, b: 248 } };
      }
    };

    const colorConfig = getThemeColor();

    for (let i = 0; i < particleCount; i++) {
      // Determine vertical velocity based on theme mood
      let sY = 0.3 + Math.random() * 0.8;
      if (themeId === 'sunset' || themeId === 'crimson') {
        sY = -0.4 - Math.random() * 0.9; // Rising embers
      } else if (themeId === 'ocean') {
        sY = -0.2 - Math.random() * 0.5; // Rising bubbles
      } else if (themeId === 'forest') {
        sY = (Math.random() - 0.5) * 0.5; // Drifting fireflies
      } else if (themeId === 'arctic') {
        sY = 0.5 + Math.random() * 0.9; // Falling snow
      }

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedY: sY,
        speedX: (Math.random() - 0.5) * 0.6,
        radius: 1.5 + Math.random() * 2.8,
        alpha: 0.15 + Math.random() * 0.45,
        fadeSpeed: 0.003 + Math.random() * 0.007,
      });
    }

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      // Soft ambient moving glow gradient in the center
      const gradient = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.3) * 120,
        height * 0.35 + Math.cos(time * 0.25) * 100,
        20,
        width * 0.5,
        height * 0.4,
        Math.max(width, height) * 0.75
      );

      gradient.addColorStop(0, `rgba(${colorConfig.r}, ${colorConfig.g}, ${colorConfig.b}, 0.12)`);
      gradient.addColorStop(0.5, `rgba(${colorConfig.secondary.r}, ${colorConfig.secondary.g}, ${colorConfig.secondary.b}, 0.05)`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render floating particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorConfig.r}, ${colorConfig.g}, ${colorConfig.b}, ${p.alpha})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${colorConfig.r}, ${colorConfig.g}, ${colorConfig.b}, 0.8)`;
        ctx.fill();

        p.y += p.speedY;
        p.x += p.speedX;

        // Wrap around boundaries
        if (p.y > height) p.y = 0;
        if (p.y < 0) p.y = height;
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [themeId, enabled, activeCount]);

  if (!enabled || activeCount === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      id="visual-atmosphere-canvas"
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
      style={{ opacity: 0.85 }}
    />
  );
};
