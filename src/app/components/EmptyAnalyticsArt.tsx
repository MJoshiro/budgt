import React from "react";
import { motion } from "motion/react";

/*
  Reference: Graphic block with shapes, where a hand interacts with floating abstract pieces/charts.
*/
export function EmptyAnalyticsArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Floating abstract chart fragments/shapes */}
      <motion.g
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, staggerChildren: 0.2 }}
      >
        <motion.path d="M 120 100 L 160 80 L 180 120 L 140 140 Z" fill="var(--primary)" stroke="var(--primary)" />
        <motion.circle cx="280" cy="110" r="30" fill="var(--accent)" stroke="var(--accent)" />
        <motion.path d="M 100 240 C 100 200, 160 200, 160 240 C 160 280, 100 280, 100 240" fill="var(--success)" stroke="var(--success)" />
      </motion.g>

      {/* A single prominent interacting hand hovering over the empty canvas */}
      <motion.g
        stroke="#000000"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="var(--background)"
        initial={{ y: 80, x: -20, opacity: 0 }}
        animate={{ y: 0, x: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 12 }}
      >
        {/* Palm / Wrist */}
        <path d="M 200 400 C 200 350, 180 300, 150 260" />
        <path d="M 260 400 C 260 350, 280 320, 270 280" />
        <path d="M 150 260 C 200 270, 230 290, 270 280" />
        
        {/* Fingers */}
        <path d="M 150 260 C 140 220, 110 230, 130 200 C 150 170, 180 220, 180 250" />
        <path d="M 180 250 C 170 200, 140 180, 160 150 C 180 120, 210 180, 210 240" />
        <path d="M 210 240 C 200 190, 180 170, 200 140 C 220 110, 240 180, 240 230" />
        <path d="M 240 230 C 230 180, 220 160, 240 140 C 260 120, 270 190, 270 210" />
        
        {/* Thumb */}
        <path d="M 270 280 C 290 260, 310 260, 310 240 C 310 220, 290 230, 270 240" />
      </motion.g>
    </svg>
  );
}
