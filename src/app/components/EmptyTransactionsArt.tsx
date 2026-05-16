import React from "react";
import { motion } from "motion/react";

/*
  Reference: A chaotic scribble or a set of intertwined hands expressing emptiness or confusion.
  Here we build a hand-drawn looking "messy ball of scribbles" with hands trying to unravel it,
  signifying no transactions / empty state.
*/
export function EmptyTransactionsArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Search Lens (Solid Color Pop) */}
      <motion.circle
        cx="200"
        cy="150"
        r="60"
        fill="var(--ring)" // Blue Focus color
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
      />
      
      {/* Hand 1 (Left - Holding the lens) */}
      <motion.g
        stroke="#000000"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="var(--background)"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", damping: 18 }}
      >
        <path d="M 50 200 C 100 190, 120 170, 140 180" />
        {/* Fingers wrapping the lens */}
        <path d="M 140 180 C 150 160, 145 140, 160 145 C 170 150, 160 170, 155 180" />
        <path d="M 145 185 C 160 175, 170 150, 180 165 C 185 175, 160 195, 150 190" />
        <path d="M 152 195 C 170 185, 180 170, 190 185 C 195 195, 165 210, 155 205" />
      </motion.g>

      {/* Hand 2 (Right - Waiting/Open) */}
      <motion.g
        stroke="#000000"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="var(--background)"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", damping: 18 }}
      >
        <path d="M 350 220 C 310 210, 270 230, 260 180" />
        <path d="M 260 180 C 255 150, 230 140, 240 120 C 255 100, 270 140, 265 170" />
        <path d="M 265 170 C 270 140, 260 110, 275 100 C 290 90, 280 150, 270 180" />
        <path d="M 270 180 C 285 150, 290 130, 305 130 C 315 130, 285 190, 275 190" />
      </motion.g>

      {/* Little floating question marks / dots denoting emptiness */}
      <motion.g fill="#000000">
        <motion.circle cx="160" cy="80" r="4" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1, duration: 1, repeat: Infinity, repeatType: "reverse" }} />
        <motion.circle cx="180" cy="65" r="3" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2, duration: 1, repeat: Infinity, repeatType: "reverse" }} />
        <motion.circle cx="210" cy="70" r="5" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.4, duration: 1, repeat: Infinity, repeatType: "reverse" }} />
      </motion.g>
    </svg>
  );
}
