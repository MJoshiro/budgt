import React from 'react';
import { motion } from "motion/react";

const STROKE_WIDTH = 1.5;
const DRAW_TIMING = { duration: 1.2, ease: "easeOut" as const };
const DELAY_INCREMENT = 0.1;

function CustomIconBase({ children, className = "", size = 18 }: { children: React.ReactNode, className?: string, size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      stroke="currentColor" 
      strokeWidth={STROKE_WIDTH} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

// ─── Expense Categories ─────────────────────────────────────────────

export function FoodIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 8 20 L 8 10 C 11 10, 11 4, 8 4 C 5 4, 5 10, 8 10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.path d="M 16 20 L 16 11" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.2 }} />
      <motion.path d="M 13 4 L 13 8 C 13 11, 19 11, 19 8 L 19 4 M 16 4 L 16 11" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.4 }} />
      <motion.circle cx="12" cy="14" r="1.5" fill="var(--chart-1)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}

export function TransportIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.circle cx="12" cy="12" r="8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.circle cx="12" cy="12" r="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.2 }} />
      <motion.path d="M 12 4 L 12 9 M 12 15 L 12 20 M 4 12 L 9 12 M 15 12 L 20 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.4 }} />
      <motion.circle cx="18" cy="6" r="1.5" fill="var(--chart-2)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}

export function ShoppingIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 5 8 C 5 8, 4 21, 6 21 L 18 21 C 20 21, 19 8, 19 8 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.path d="M 8 8 C 8 3, 16 3, 16 8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.3 }} />
      <motion.circle cx="12" cy="14" r="1.5" fill="var(--chart-3)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}

export function EntertainmentIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 12 2 L 15 9 L 22 10 L 17 15 L 18 22 L 12 18 L 6 22 L 7 15 L 2 10 L 9 9 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.circle cx="12" cy="12" r="2" fill="var(--chart-4)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.5 }} />
    </CustomIconBase>
  );
}

export function HealthIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 12 21 C 12 21, 3 14, 3 8 C 3 4.5, 7 3, 10 6 C 10 6, 12 8, 12 8 C 12 8, 14 6, 14 6 C 17 3, 21 4.5, 21 8 C 21 14, 12 21, 12 21 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.path d="M 9 11 L 11 15 L 13 7 L 15 11" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.3 }} />
      <motion.circle cx="16" cy="6" r="1.5" fill="var(--chart-5)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}

export function BillsIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 13 2 L 4 13 L 12 13 L 11 22 L 20 11 L 12 11 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.circle cx="15" cy="6" r="1.5" fill="var(--chart-1)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.4 }} />
    </CustomIconBase>
  );
}

export function EducationIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 4 19 C 4 19, 12 17, 12 21 C 12 17, 20 19, 20 19 L 20 5 C 20 5, 12 3, 12 7 C 12 3, 4 5, 4 5 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.path d="M 12 7 L 12 21" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.3 }} />
      <motion.circle cx="16" cy="11" r="1.5" fill="var(--chart-2)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}

export function TravelIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 12 22 C 12 22, 18 16, 18 10 C 18 6.5, 15 4, 12 4 C 9 4, 6 6.5, 6 10 C 6 16, 12 22, 12 22 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.circle cx="12" cy="10" r="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.3 }} />
      <motion.circle cx="16" cy="6" r="1.5" fill="var(--chart-3)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}

export function GroceriesIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 15 21 L 9 21 C 5 21, 5 17, 5 17 L 3 6 L 21 6 L 19 17 C 19 17, 19 21, 15 21 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.path d="M 12 6 L 12 2 M 8 6 L 10 2 M 16 6 L 14 2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.3 }} />
      <motion.circle cx="12" cy="14" r="1.5" fill="var(--chart-4)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}

export function OtherIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 12 4 L 20 8 L 20 16 L 12 20 L 4 16 L 4 8 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.path d="M 12 4 L 12 12 L 20 8 M 12 12 L 4 8 M 12 12 L 12 20" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.3 }} />
      <motion.circle cx="12" cy="12" r="1.5" fill="var(--chart-5)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}

// ─── Income Categories ──────────────────────────────────────────────

export function SalaryIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 4 8 L 20 8 M 4 16 L 20 16 M 8 4 L 16 4 C 18 4, 20 6, 20 8 L 20 16 C 20 18, 18 20, 16 20 L 8 20 C 6 20, 4 18, 4 16 L 4 8 C 4 6, 6 4, 8 4 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.path d="M 10 4 L 10 8 L 14 8 L 14 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.3 }} />
      <motion.circle cx="12" cy="12" r="1.5" fill="var(--success)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}

export function FreelanceIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 4 16 C 4 16, 4 6, 6 6 L 18 6 C 20 6, 20 16, 20 16 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.path d="M 2 16 L 22 16 L 20 20 L 4 20 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.3 }} />
      <motion.circle cx="12" cy="11" r="1.5" fill="var(--chart-1)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}

export function InvestmentsIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 4 20 L 20 20 L 20 4 M 4 14 L 10 8 L 15 13 L 20 5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.circle cx="20" cy="5" r="2" fill="var(--chart-2)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.4 }} />
    </CustomIconBase>
  );
}

export function OtherIncomeIcon({ size = 18, delayOffset = 0 }: { size?: number, delayOffset?: number }) {
  return (
    <CustomIconBase size={size}>
      <motion.path d="M 6 15 Q 12 21, 18 15 Q 21 12, 19 9 Q 17 6, 12 9 Q 7 6, 5 9 Q 3 12, 6 15 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset }} />
      <motion.path d="M 12 9 M 15 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: delayOffset + 0.3 }} />
      <motion.circle cx="12" cy="12" r="1.5" fill="var(--chart-3)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: delayOffset + 0.6 }} />
    </CustomIconBase>
  );
}
