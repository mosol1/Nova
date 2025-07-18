import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'search';
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const getInputClasses = () => {
    const baseClasses = `
      w-full px-4 py-3 text-white placeholder-muted 
      glass-input rounded-lg
      transition-all duration-200 focus:outline-none
      ${leftIcon ? 'pl-12' : ''}
      ${rightIcon ? 'pr-12' : ''}
    `;

    if (error) {
      return `${baseClasses} border-red-500 focus:border-red-400 focus:glow-focus`;
    }

    return `${baseClasses} border-secondary focus:border-accent focus:glow-focus`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-secondary">
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">
            {leftIcon}
          </div>
        )}

        {/* Input Field */}
        <input
          ref={ref}
          className={getInputClasses()}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Helper Text / Error */}
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-400' : 'text-muted'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 