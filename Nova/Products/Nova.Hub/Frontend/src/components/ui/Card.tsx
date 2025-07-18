import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'glass';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'accent':
        return 'nova-card border-accent glow-purple-soft';
      case 'glass':
        return 'glass-ultra';
      default:
        return 'nova-card';
    }
  };

  const hoverClasses = hover ? 'hover:transform hover:scale-[1.02]' : '';

  return (
    <div 
      className={`${getVariantClasses()} ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;