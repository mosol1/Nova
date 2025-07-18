import React from 'react';
import { motion } from 'framer-motion';

const SpiralAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main spiral */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg
          width="800"
          height="800"
          viewBox="0 0 800 800"
          className="opacity-10"
        >
          <defs>
            <linearGradient id="spiral-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          
          {/* Spiral path */}
          <path
            d="M 400 400 m -50 0 a 50 50 0 1 1 100 0 a 100 100 0 1 1 -200 0 a 150 150 0 1 1 300 0 a 200 200 0 1 1 -400 0 a 250 250 0 1 1 500 0 a 300 300 0 1 1 -600 0"
            fill="none"
            stroke="url(#spiral-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          
          {/* Additional spiral rings */}
          <path
            d="M 400 400 m -80 0 a 80 80 0 1 1 160 0 a 160 160 0 1 1 -320 0 a 240 240 0 1 1 480 0 a 320 320 0 1 1 -640 0"
            fill="none"
            stroke="url(#spiral-gradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />
          
          <path
            d="M 400 400 m -120 0 a 120 120 0 1 1 240 0 a 240 240 0 1 1 -480 0 a 360 360 0 1 1 720 0"
            fill="none"
            stroke="url(#spiral-gradient)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.3"
          />
        </svg>
      </motion.div>

      {/* Counter-rotating spiral */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: -360 }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg
          width="600"
          height="600"
          viewBox="0 0 600 600"
          className="opacity-8"
        >
          <defs>
            <linearGradient id="spiral-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#F472B6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FBCFE8" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          <path
            d="M 300 300 m -30 0 a 30 30 0 1 1 60 0 a 60 60 0 1 1 -120 0 a 90 90 0 1 1 180 0 a 120 120 0 1 1 -240 0 a 150 150 0 1 1 300 0 a 180 180 0 1 1 -360 0"
            fill="none"
            stroke="url(#spiral-gradient-2)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
          
          <path
            d="M 300 300 m -60 0 a 60 60 0 1 1 120 0 a 120 120 0 1 1 -240 0 a 180 180 0 1 1 360 0 a 240 240 0 1 1 -480 0"
            fill="none"
            stroke="url(#spiral-gradient-2)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.3"
          />
        </svg>
      </motion.div>

      {/* Floating particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-20"
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
            scale: [1, 1.5, 0.8, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + i * 10}%`,
          }}
        />
      ))}

      {/* Ambient glow effect */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
};

export default SpiralAnimation; 