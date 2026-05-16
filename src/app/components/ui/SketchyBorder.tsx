import React from 'react';
import { motion } from 'motion/react';

export function handDrawnRect(
  w: number,
  h: number,
  seed: number,
  jitter = 3,
  steps = 12
): string {
  // Simple seeded pseudo-random
  const rand = (s: number) => {
    const x = Math.sin(s * 9301 + 49297) * 49297;
    return x - Math.floor(x);
  };

  const pts: [number, number][] = [];
  let si = seed;

  // Top edge (left to right)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    si++;
    pts.push([t * w, (rand(si) - 0.5) * jitter]);
  }
  // Right edge (top to bottom)
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    si++;
    pts.push([w + (rand(si) - 0.5) * jitter, t * h]);
  }
  // Bottom edge (right to left)
  for (let i = 1; i <= steps; i++) {
    const t = 1 - i / steps;
    si++;
    pts.push([t * w, h + (rand(si) - 0.5) * jitter]);
  }
  // Left edge (bottom to top)
  for (let i = 1; i < steps; i++) {
    const t = 1 - i / steps;
    si++;
    pts.push([(rand(si) - 0.5) * jitter, t * h]);
  }

  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
  }
  d += " Z";
  return d;
}

interface SketchBorderProps {
  seed: number;
  w?: number;
  h?: number;
  strokeWidth?: number;
}

/** Hand-drawn border overlay SVG */
export function SketchBorder({ 
  seed,
  w = 300,
  h = 180,
  strokeWidth = 3.5,
}: SketchBorderProps) {
  
  const pad = 6; // padding so the jitter doesn't clip

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`}
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    >
      {/* Double stroke for that thick pen look */}
      <motion.path
        d={handDrawnRect(w, h, seed, 3.5, 14)}
        fill="none"
        stroke="rgba(30,25,20,0.7)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: seed * 0.08, ease: "easeOut" }}
      />
      {/* Second pass — slightly offset for hand-drawn imperfection */}
      <motion.path
        d={handDrawnRect(w, h, seed + 100, 2.5, 14)}
        fill="none"
        stroke="rgba(30,25,20,0.25)"
        strokeWidth={Math.max(1, strokeWidth - 1.5)}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay: seed * 0.08 + 0.1, ease: "easeOut" }}
      />
    </svg>
  );
}
