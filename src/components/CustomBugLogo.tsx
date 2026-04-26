import { useEffect, useRef } from 'react';

export function CustomBugLogo({ className = '' }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const legs = svg.querySelectorAll('.bug-leg');
    let animFrameId: number;
    let time = 0;

    const animate = () => {
      time += 0.05;
      legs.forEach((leg, i) => {
        const el = leg as SVGGElement;
        const direction = i % 2 === 0 ? 1 : -1;
        const offset = Math.sin(time * 3 + i * 0.5) * 3 * direction;
        el.style.transform = `rotate(${offset}deg)`;
        el.style.transformOrigin = 'center';
      });
      animFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="bugBody" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4a4a4a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
        <radialGradient id="bugEye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff0000" />
          <stop offset="100%" stopColor="#990000" />
        </radialGradient>
      </defs>
      
      {/* Legs */}
      <g className="bug-leg" style={{ transformOrigin: '32px 32px' }}>
        <path d="M12 20 L4 12" stroke="#666" strokeWidth="2" fill="none" />
        <path d="M12 32 L2 32" stroke="#666" strokeWidth="2" fill="none" />
        <path d="M12 44 L4 52" stroke="#666" strokeWidth="2" fill="none" />
      </g>
      <g className="bug-leg" style={{ transformOrigin: '32px 32px' }}>
        <path d="M52 20 L60 12" stroke="#666" strokeWidth="2" fill="none" />
        <path d="M52 32 L62 32" stroke="#666" strokeWidth="2" fill="none" />
        <path d="M52 44 L60 52" stroke="#666" strokeWidth="2" fill="none" />
      </g>
      
      {/* Body */}
      <ellipse cx="32" cy="32" rx="20" ry="18" fill="url(#bugBody)" />
      
      {/* Head */}
      <ellipse cx="32" cy="18" rx="12" ry="10" fill="url(#bugBody)" />
      
      {/* Eyes */}
      <circle cx="27" cy="16" r="4" fill="url(#bugEye)" />
      <circle cx="37" cy="16" r="4" fill="url(#bugEye)" />
      
      {/* Eye shine */}
      <circle cx="26" cy="15" r="1.5" fill="#fff" />
      <circle cx="36" cy="15" r="1.5" fill="#fff" />
      
      {/* Antennae */}
      <path d="M26 10 L22 4" stroke="#666" strokeWidth="1.5" fill="none" />
      <path d="M38 10 L42 4" stroke="#666" strokeWidth="1.5" fill="none" />
      <circle cx="22" cy="4" r="2" fill="#666" />
      <circle cx="42" cy="4" r="2" fill="#666" />
      
      {/* Mouth */}
      <path d="M28 24 Q32 28 36 24" stroke="#444" strokeWidth="1.5" fill="none" />
    </svg>
  );
}