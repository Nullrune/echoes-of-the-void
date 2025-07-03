import React, { useEffect, useRef } from 'react';

interface VoidParticlesProps {
  count?: number;
  color?: string;
  speed?: number;
  opacity?: number;
  size?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

const VoidParticles: React.FC<VoidParticlesProps> = ({
  count = 30,
  color = '#7b88e8',
  speed = 0.3,
  opacity = 0.4,
  size = 1.5,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Create particles
    const particles: Particle[] = [];
    
    // Initialize particles
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * size + 0.5,
        speedX: (Math.random() - 0.5) * speed,
        speedY: (Math.random() - 0.5) * speed,
        opacity: Math.random() * opacity + 0.1,
      });
    }
    
    // Animation loop
    let animationFrameId: number;
    let time = 0;
    
    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach((particle) => {
        // Move particles with a subtle drift effect
        particle.x += particle.speedX;
        particle.y += particle.speedY + Math.sin(time + particle.y * 0.01) * 0.05;
        
        // Wrap around screen edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Draw the particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(')', `, ${particle.opacity})`).replace('rgb', 'rgba');
        ctx.fill();
      });
      
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [count, color, speed, opacity, size]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-10 ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default VoidParticles; 