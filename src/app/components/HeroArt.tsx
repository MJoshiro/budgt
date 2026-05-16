import React from "react";
import { motion } from "motion/react";

/*
 Relatable Hero Art: Squishmallow-style Bart (from user reference image).
 Features a single large round body, large ears with ivory inners, 
 small dotted eyes, large black nose, and a wide white belly patch.
 Uses the project's consistent thick stroke lines and warm koala colors.
*/
export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background ambient sparkles */}
      {[
        { cx: 70, cy: 100, r: 4, delay: 0 },
        { cx: 430, cy: 160, r: 6, delay: 0.5 },
        { cx: 90, cy: 370, r: 5, delay: 1 },
        { cx: 410, cy: 390, r: 4, delay: 1.5 },
      ].map((star, i) => (
        <motion.circle
          key={i}
          cx={star.cx}
          cy={star.cy}
          r={star.r}
          fill="#C28E70"
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, delay: star.delay }}
        />
      ))}

      <motion.g
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* === EARS (Behind Body) === */}
        {/* Left Ear Outer */}
        <motion.path 
          d="M 170 170 A 75 75 0 1 0 140 290" 
          fill="var(--surface-base)" stroke="#C28E70" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" 
        />
        {/* Left Ear Inner */}
        <motion.path 
          d="M 160 185 A 50 50 0 1 0 142 270" 
          fill="var(--surface-overlay)" stroke="none" 
        />

        {/* Right Ear Outer */}
        <motion.path 
          d="M 330 170 A 75 75 0 1 1 360 290" 
          fill="var(--surface-base)" stroke="#C28E70" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" 
        />
        {/* Right Ear Inner */}
        <motion.path 
          d="M 340 185 A 50 50 0 1 1 358 270" 
          fill="var(--surface-overlay)" stroke="none" 
        />

        {/* === MAIN ROUND BODY === */}
        <motion.path 
          d="M 250 110 C 80 110, 80 440, 250 440 C 420 440, 420 110, 250 110 Z" 
          fill="var(--surface-base)" stroke="#C28E70" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* === WHITE BELLY PATCH === */}
        <motion.path 
          d="M 140 400 C 130 300, 370 300, 360 400 C 350 435, 300 440, 250 440 C 200 440, 150 435, 140 400 Z" 
          fill="var(--surface-overlay)" stroke="none" 
        />

        {/* === FACE === */}
        {/* Left Eye */}
        <motion.circle cx="190" cy="240" r="14" fill="#191919" />
        
        {/* Right Eye */}
        <motion.circle cx="310" cy="240" r="14" fill="#191919" />
        
        {/* Big Oval Nose */}
        <motion.path 
          d="M 250 220 C 210 220, 220 280, 250 280 C 280 280, 290 220, 250 220 Z" 
          fill="#191919" 
        />
        
        {/* Small Smile below nose */}
        <motion.path 
          d="M 235 290 Q 250 305 265 290" 
          stroke="#191919" strokeWidth="6" strokeLinecap="round" fill="none" 
        />
      </motion.g>
    </svg>
  );
}

