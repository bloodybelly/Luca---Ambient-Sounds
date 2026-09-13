import React, { useEffect, useRef } from 'react';
import { ThemeId, ThemeConfig } from '../types';

interface VisualAtmosphereProps {
  themeId: ThemeId;
  currentTheme?: ThemeConfig;
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
  colorRgb: { r: number; g: number; b: number };
}

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16) || 255,
      g: parseInt(clean[1] + clean[1], 16) || 255,
      b: parseInt(clean[2] + clean[2], 16) || 255,
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16) || 255,
    g: parseInt(clean.substring(2, 4), 16) || 255,
    b: parseInt(clean.substring(4, 6), 16) || 255,
  };
};

export const VisualAtmosphere: React.FC<VisualAtmosphereProps> = ({
  themeId,
  currentTheme,
  enabled,
  activeCount,
}) => {
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

    // Multi-color palette for this scenario
    const rawColors = currentTheme?.colorMix && currentTheme.colorMix.length > 0
      ? currentTheme.colorMix
      : ['#a855f7', '#38bdf8', '#ec4899', '#facc15'];

    const rgbColors = rawColors.map(hexToRgb);

    // Generate lightweight ambient particles based on theme
    const particleCount = Math.min(50, 15 + activeCount * 4);
    const particles: Particle[] = [];

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

      const assignedColor = rgbColors[i % rgbColors.length];

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedY: sY,
        speedX: (Math.random() - 0.5) * 0.6,
        radius: 1.5 + Math.random() * 2.8,
        alpha: 0.18 + Math.random() * 0.45,
        colorRgb: assignedColor,
      });
    }

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      // Soft ambient moving glow gradient mixing primary & secondary colors
      const c1 = rgbColors[0] || { r: 168, g: 85, b: 247 };
      const c2 = rgbColors[1] || { r: 56, g: 189, b: 248 };
      const c3 = rgbColors[2] || { r: 236, g: 72, b: 153 };

      const gradient = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.3) * 120,
        height * 0.35 + Math.cos(time * 0.25) * 100,
        20,
        width * 0.5,
        height * 0.4,
        Math.max(width, height) * 0.75
      );

      gradient.addColorStop(0, `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.12)`);
      gradient.addColorStop(0.45, `rgba(${c2.r}, ${c2.g}, ${c2.b}, 0.07)`);
      gradient.addColorStop(0.75, `rgba(${c3.r}, ${c3.g}, ${c3.b}, 0.03)`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render floating multi-color particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, ${p.alpha})`;
        ctx.shadowBlur = 14;
        ctx.shadowColor = `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, 0.8)`;
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
  }, [themeId, currentTheme, enabled, activeCount]);

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
