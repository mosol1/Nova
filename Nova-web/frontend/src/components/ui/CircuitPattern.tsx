import React from 'react';
import { motion } from 'framer-motion';

const CircuitPattern: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Horizontal Lines */}
        <motion.path
          d="M0 200 L300 200 L320 180 L400 180 L420 200 L1000 200"
          stroke="rgba(168, 85, 247, 0.2)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 0.5 }}
        />
        <motion.path
          d="M0 400 L200 400 L220 420 L300 420 L320 400 L600 400 L620 380 L800 380 L820 400 L1000 400"
          stroke="rgba(168, 85, 247, 0.15)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 1 }}
        />
        <motion.path
          d="M0 600 L150 600 L170 580 L250 580 L270 600 L500 600 L520 620 L700 620 L720 600 L1000 600"
          stroke="rgba(168, 85, 247, 0.1)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 1.5 }}
        />

        {/* Vertical Lines */}
        <motion.path
          d="M200 0 L200 300 L180 320 L180 400 L200 420 L200 1000"
          stroke="rgba(168, 85, 247, 0.2)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 0.8 }}
        />
        <motion.path
          d="M500 0 L500 200 L520 220 L520 300 L500 320 L500 600 L480 620 L480 800 L500 820 L500 1000"
          stroke="rgba(168, 85, 247, 0.15)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 1.3 }}
        />
        <motion.path
          d="M800 0 L800 150 L820 170 L820 250 L800 270 L800 500 L780 520 L780 700 L800 720 L800 1000"
          stroke="rgba(168, 85, 247, 0.1)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 1.8 }}
        />

        {/* Circuit Nodes */}
        {[
          { x: 200, y: 200 },
          { x: 400, y: 180 },
          { x: 300, y: 420 },
          { x: 600, y: 400 },
          { x: 800, y: 380 },
          { x: 250, y: 580 },
          { x: 500, y: 600 },
          { x: 700, y: 620 }
        ].map((node, index) => (
          <motion.circle
            key={index}
            cx={node.x}
            cy={node.y}
            r="3"
            fill="rgba(168, 85, 247, 0.6)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2 + index * 0.1 }}
          >
            <animate
              attributeName="r"
              values="3;5;3"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="2s"
              repeatCount="indefinite"
            />
          </motion.circle>
        ))}

        {/* Data Flow Indicators */}
        <motion.circle
          r="2"
          fill="rgba(192, 132, 252, 0.8)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
        >
          <animateMotion
            dur="4s"
            repeatCount="indefinite"
            path="M0 200 L300 200 L320 180 L400 180 L420 200 L1000 200"
          />
        </motion.circle>
        <motion.circle
          r="2"
          fill="rgba(192, 132, 252, 0.8)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
        >
          <animateMotion
            dur="5s"
            repeatCount="indefinite"
            path="M200 0 L200 300 L180 320 L180 400 L200 420 L200 1000"
          />
        </motion.circle>
      </svg>
    </div>
  );
};

export default CircuitPattern;