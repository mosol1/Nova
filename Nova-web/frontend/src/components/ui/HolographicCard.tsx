import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'purple' | 'cyan' | 'green';
}

const HolographicCard: React.FC<HolographicCardProps> = ({ 
  children, 
  className,
  glowColor = 'purple'
}) => {
  const glowClasses = {
    purple: 'hover:glow-purple',
    cyan: 'hover:glow-cyan',
    green: 'hover:shadow-green-500/20'
  };

  return (
    <motion.div
      className={cn(
        'relative group',
        className
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Holographic Background */}
      <div className="absolute inset-0 holographic rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Main Card */}
      <div className={cn(
        'relative glass rounded-xl border-glow transition-all duration-500',
        'group-hover:border-purple-500/50 group-hover:bg-white/[0.04]',
        glowClasses[glowColor]
      )}>
        {/* Scan Lines Effect */}
        <div className="absolute inset-0 scan-lines rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500/50 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-500/50 rounded-tr-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-500/50 rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500/50 rounded-br-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
};

export default HolographicCard;