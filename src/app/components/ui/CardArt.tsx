import React from 'react';
import { motion } from "motion/react";

const STROKE_WIDTH = 8;
const DRAW_TIMING = { duration: 2.5, ease: "easeInOut" as const };

/** Card 1 – Balance: Hand dropping a coin into a pile of coins */
export function WalletArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} preserveAspectRatio="xMidYMid slice">
      <motion.g stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
        {/* Pile of irregular coins/stones */}
        {[
          "M 90 350 C 90 280, 180 280, 190 350 C 190 410, 90 410, 90 350 Z",
          "M 170 340 C 170 270, 290 260, 310 340 C 320 410, 170 420, 170 340 Z",
          "M 290 350 C 290 310, 360 300, 370 350 C 380 400, 290 400, 290 350 Z",
          "M 130 290 C 130 230, 240 220, 260 290",
          "M 230 290 C 230 220, 320 230, 330 300",
          "M 170 230 C 170 160, 290 160, 290 240",
        ].map((d, i) => (
          <motion.path key={i} d={d} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: i * 0.15 }} />
        ))}
        {/* Held Coin */}
        <motion.path d="M 190 120 C 160 60, 250 50, 280 110 C 310 170, 220 180, 190 120 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 1 }} />
        {/* Hand/Fingers */}
        <motion.path d="M -40 140 Q 110 160 180 130 Q 210 110 190 90 Q 120 110 -40 100" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 1.2 }} />
        <motion.path d="M -40 80 Q 110 100 180 50 Q 210 30 190 10 Q 120 30 -40 30" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 1.3 }} />
      </motion.g>
    </svg>
  );
}

/** Card 2 – Today: Hands drawing an asterisk on paper */
export function TransactionsArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} preserveAspectRatio="xMidYMid slice">
      <motion.g stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
        {/* Paper */}
        <motion.path d="M 80 70 L 320 50 L 340 350 L 60 370 Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 0 }} />
        
        {/* Spark/Asterisk */}
        {[
          "M 200 130 L 200 290",
          "M 120 210 L 280 210",
          "M 140 150 L 260 270",
          "M 140 270 L 260 150"
        ].map((d, i) => (
          <motion.path key={`spark-${i}`} d={d} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 0.5 + i * 0.1 }} />
        ))}

        {/* Hands pointing */}
        {/* Bottom Left Hand */}
        <motion.path d="M 20 390 Q 100 330 130 270 Q 150 240 120 240 Q 80 280 50 290" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 1 }} />
        {/* Right Hand */}
        <motion.path d="M 390 240 Q 320 220 275 210 Q 250 200 260 170 Q 300 170 350 180" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 1.1 }} />
        {/* Top Left Hand */}
        <motion.path d="M 70 -20 Q 100 60 150 110 Q 170 130 155 150 Q 120 130 80 90" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 1.2 }} />
      </motion.g>
    </svg>
  );
}

/** Card 3 – Streak: Minimal seedlings */
export function StreakArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} preserveAspectRatio="xMidYMid slice">
      <motion.g stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
        {/* Ground */}
        <motion.path d="M -20 340 Q 200 360 420 330" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={DRAW_TIMING} />
        
        {/* Seedling 1 */}
        <motion.path d="M 90 345 Q 80 260 90 180" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 0.2 }} />
        <motion.path d="M 90 250 C 40 220, 10 260, 60 290 C 70 300, 80 280, 90 250" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 0.4 }} />
        <motion.path d="M 90 200 C 140 170, 170 210, 120 250 C 110 260, 100 240, 90 200" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 0.6 }} />

        {/* Seedling 2 Large */}
        <motion.path d="M 270 345 Q 280 200 270 50" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 0.7 }} />
        <motion.path d="M 270 200 C 180 150, 130 230, 220 280 C 240 290, 250 260, 270 200" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 0.9 }} />
        <motion.path d="M 272 120 C 370 70, 410 170, 310 220 C 290 230, 280 200, 272 120" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 1.1 }} />
        <motion.path d="M 270 60 C 210 20, 180 70, 240 110 C 260 120, 265 90, 270 60" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: 1.3 }} />
      </motion.g>
    </svg>
  );
}

/** Card 4 – Category: Tree structure */
export function CategoryArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} preserveAspectRatio="xMidYMid slice">
      <motion.g stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
        {/* Tree lines */}
        {[
          "M 200 420 Q 220 280 200 160",
          "M 205 320 Q 120 300 80 320",
          "M 208 260 Q 100 240 60 160",
          "M 100 210 Q 50 200 30 240",
          "M 210 280 Q 300 260 340 230",
          "M 205 200 Q 320 180 320 120",
          "M 285 160 Q 360 140 370 80",
          "M 200 160 Q 180 80 200 40",
        ].map((d, i) => (
          <motion.path key={`branch-${i}`} d={d} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...DRAW_TIMING, delay: i * 0.15 }} />
        ))}
      </motion.g>
      
      {/* Nodes */}
      <motion.g fill="currentColor" stroke="none">
        {[
          { cx: 80, cy: 320, r: 16 },
          { cx: 60, cy: 160, r: 24 },
          { cx: 30, cy: 240, r: 12 },
          { cx: 340, cy: 230, r: 20 },
          { cx: 320, cy: 120, r: 16 },
          { cx: 370, cy: 80, r: 22 },
          { cx: 200, cy: 40, r: 26 },
        ].map((node, i) => (
          <motion.circle key={`node-${i}`} cx={node.cx} cy={node.cy} r={node.r} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 1.5 + i * 0.1 }} />
        ))}
      </motion.g>
    </svg>
  );
}

/** Card 5 – AI Insights: Profile head with a sunburst inside */
export function AIInsightArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} preserveAspectRatio="xMidYMid slice">
      <motion.g stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
        {/* Geometric Profile Head */}
        <motion.path 
          d="M 150 360 L 250 360 L 250 260 L 300 200 L 270 70 L 180 50 L 110 110 L 100 180 L 120 200 L 100 230 L 140 260 Z" 
          initial={{ pathLength: 0 }} 
          animate={{ pathLength: 1 }} 
          transition={DRAW_TIMING} 
        />
        
        {/* Sunburst inside the head */}
        {[
          "M 200 150 L 200 100",
          "M 200 210 L 200 260",
          "M 170 180 L 120 180",
          "M 230 180 L 280 180",
          "M 180 160 L 145 125",
          "M 220 200 L 255 235",
          "M 180 200 L 145 235",
          "M 220 160 L 255 125",
        ].map((d, i) => (
          <motion.path 
            key={`sunburst-${i}`} 
            d={d} 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ ...DRAW_TIMING, delay: 0.8 + i * 0.1 }} 
          />
        ))}

        {/* Inner circle or star core */}
        <motion.circle 
          cx="200" 
          cy="180" 
          r="10" 
          fill="currentColor"
          stroke="currentColor"
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: "spring", stiffness: 200, damping: 10, delay: 1.6 }} 
        />
      </motion.g>
    </svg>
  );
}

/** Card 6 – Transactions Sidebar: Abstract connected nodes / sorting concept */
export function TransactionsSidebarArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} preserveAspectRatio="xMidYMid slice">
      <motion.g stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
        {/* Abstract filtering/sorting pathways (nodes and branches) */}
        {[
          "M 80 100 L 200 150",
          "M 320 100 L 200 150",
          "M 200 150 L 200 240",
          "M 200 240 L 120 320",
          "M 200 240 L 280 320",
          "M 120 320 L 80 280",
          "M 280 320 L 320 360",
          "M 120 320 L 160 380",
        ].map((d, i) => (
          <motion.path 
            key={`branch-${i}`} 
            d={d} 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ ...DRAW_TIMING, delay: i * 0.15 }} 
          />
        ))}
      </motion.g>

      <motion.g fill="currentColor" stroke="none">
        {/* Connection Points */}
        {[
          { cx: 80, cy: 100, r: 16 },
          { cx: 320, cy: 100, r: 16 },
          { cx: 200, cy: 150, r: 24 },
          { cx: 200, cy: 240, r: 20 },
          { cx: 120, cy: 320, r: 16 },
          { cx: 280, cy: 320, r: 16 },
          { cx: 80, cy: 280, r: 12 },
          { cx: 320, cy: 360, r: 12 },
          { cx: 160, cy: 380, r: 12 },
        ].map((node, i) => (
          <motion.circle 
            key={`node-${i}`} 
            cx={node.cx} 
            cy={node.cy} 
            r={node.r} 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 1.2 + i * 0.1 }} 
          />
        ))}
      </motion.g>
    </svg>
  );
}

/** Card 7 – App Logo: Abstract hand-drawn "U" or arch */
export function AppLogoArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} preserveAspectRatio="xMidYMid meet">
      <motion.g stroke="currentColor" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        {/* Abstract "U" forming an arch */}
        <motion.path 
          d="M 20 20 Q 25 80 50 85 T 80 20" 
          initial={{ pathLength: 0 }} 
          animate={{ pathLength: 1 }} 
          transition={{ duration: 1.5, ease: "easeOut" }} 
        />
        {/* Accent dot / cursor */}
        <motion.circle 
          cx="86" 
          cy="78" 
          r="8" 
          fill="#BF4D43" 
          stroke="none"
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.8 }} 
        />
        {/* Small underline dash */}
        <motion.path 
          d="M 40 95 L 60 92" 
          initial={{ pathLength: 0 }} 
          animate={{ pathLength: 1 }} 
          transition={{ duration: 0.5, delay: 1 }} 
        />
      </motion.g>
    </svg>
  );
}

/** Card 8 – Sign Out: Abstract door opening or wavy departure lines */
export function SignOutArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} preserveAspectRatio="xMidYMid slice">
      <motion.g stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
        {/* Abstract Doorway Frame */}
        <motion.path 
          d="M 120 320 L 120 100 Q 200 80 280 100 L 280 320" 
          initial={{ pathLength: 0 }} 
          animate={{ pathLength: 1 }} 
          transition={DRAW_TIMING} 
        />
        {/* Opening Door Angle */}
        <motion.path 
          d="M 120 100 L 220 140 L 220 320 L 120 320" 
          initial={{ pathLength: 0 }} 
          animate={{ pathLength: 1 }} 
          transition={{ ...DRAW_TIMING, delay: 0.2 }} 
        />
        {/* Motion lines leaving */}
        {[
          "M 260 200 L 340 200",
          "M 290 170 L 340 200 L 290 230"
        ].map((d, i) => (
          <motion.path 
            key={`leave-${i}`} 
            d={d} 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ ...DRAW_TIMING, delay: 0.6 + i * 0.2 }} 
          />
        ))}
      </motion.g>
    </svg>
  );
}

export type BartState = "idle" | "generating" | "error" | "asleep";

export const BartArt = React.memo(({ state = "idle", className = "" }: { state?: BartState; className?: string }) => {
  const isError = state === "error";
  const isGenerating = state === "generating";
  const isAsleep = state === "asleep";

  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} preserveAspectRatio="xMidYMid meet">
      <motion.g strokeLinecap="round" strokeLinejoin="round">
        {/* Removed Background rectangular squircle to let parent container handle background */}

        {/* Left Fluffy Ear */}
        <motion.path 
          d="M 115 150 C 30 110, 30 250, 105 240" 
          stroke="#C28E70" 
          strokeWidth="12" 
          fill="transparent" 
          strokeLinecap="round"
          animate={isGenerating ? { rotate: [-5, 5, -5] } : isAsleep ? { rotate: -15, y: 10 } : { rotate: 0 }}
          transition={isGenerating ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 3, repeat: isAsleep ? Infinity : 0, repeatType: "reverse", ease: "easeInOut" }}
          style={{ originX: "115px", originY: "150px" }}
        />

        {/* Right Fluffy Ear */}
        <motion.path 
          d="M 285 150 C 370 110, 370 250, 295 240" 
          stroke="#C28E70" 
          strokeWidth="12" 
          fill="transparent" 
          strokeLinecap="round"
          animate={isGenerating ? { rotate: [5, -5, 5] } : isAsleep ? { rotate: 15, y: 10 } : { rotate: 0 }}
          transition={isGenerating ? { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 } : { duration: 3, repeat: isAsleep ? Infinity : 0, repeatType: "reverse", ease: "easeInOut", delay: 0.5 }}
          style={{ originX: "285px", originY: "150px" }}
        />

        {/* Head Base Outline */}
        <motion.rect 
          x="100" 
          y="120" 
          width="200" 
          height="180" 
          rx="90" 
          stroke="#C28E70" 
          strokeWidth="12" 
          fill="var(--surface-base)"
          animate={isError ? { rotate: 2, y: 5 } : isGenerating ? { y: [0, -4, 0] } : isAsleep ? { y: [2, -2, 2] } : { y: 0, rotate: 0 }}
          transition={isGenerating ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : isAsleep ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 200, damping: 20 }}
          style={{ originX: "200px", originY: "210px" }}
        />

        {/* Iconic Large Koala Nose */}
        <motion.rect 
          x="170" 
          y="170" 
          width="60" 
          height="85" 
          rx="30" 
          fill="#C28E70" 
          animate={isError ? { rotate: -10 } : isGenerating ? { scale: [1, 1.05, 1] } : isAsleep ? { scale: [1, 1.05, 1], y: [0, -1, 0] } : { scale: 1 }}
          transition={isAsleep ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "200px", originY: "212px" }}
        />

        {/* Left Sleeping Eye (Slit/Closed Arc) */}
        {!isAsleep ? (
          <motion.line 
            x1="135" 
            y1="185" 
            x2="150" 
            y2="185" 
            stroke="#C28E70" 
            strokeWidth="10" 
            animate={isError ? { rotate: 15 } : isGenerating ? { opacity: [1, 0.4, 1] } : { opacity: 1, rotate: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "142px", originY: "185px" }}
          />
        ) : (
          <motion.path
            d="M 130 185 Q 142 195 155 185"
            stroke="#C28E70"
            strokeWidth="8"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}

        {/* Right Sleeping Eye (Slit/Closed Arc) */}
        {!isAsleep ? (
          <motion.line 
            x1="250" 
            y1="185" 
            x2="265" 
            y2="185" 
            stroke="#C28E70" 
            strokeWidth="10" 
            animate={isError ? { rotate: -15 } : isGenerating ? { opacity: [1, 0.4, 1] } : { opacity: 1, rotate: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            style={{ originX: "257px", originY: "185px" }}
          />
        ) : (
          <motion.path
            d="M 245 185 Q 257 195 270 185"
            stroke="#C28E70"
            strokeWidth="8"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}

        {/* Removed AI Notification Bubble since UI wrappers add their own HTML badges */}
        
        {/* Zzz for Asleep */}
        {isAsleep && (
          <motion.g
            animate={{ opacity: [0, 1, 0], y: [0, -20], x: [0, 10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            fill="#C28E70"
          >
            <text x="310" y="100" fontSize="24" fontWeight="bold" fontFamily="sans-serif">z</text>
          </motion.g>
        )}
        {isAsleep && (
          <motion.g
            animate={{ opacity: [0, 1, 0], y: [0, -20], x: [0, 15] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1.5 }}
            fill="#C28E70"
          >
            <text x="325" y="80" fontSize="18" fontWeight="bold" fontFamily="sans-serif">z</text>
          </motion.g>
        )}

        {/* Error Cross */}
        {isError && (
          <motion.path 
            d="M 304 104 L 316 116 M 316 104 L 304 116" 
            stroke="var(--surface-base)" 
            strokeWidth="4" 
          />
        )}
      </motion.g>
    </svg>
  );
});
