import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  onClick 
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -5, scale: 1.02 } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        backdrop-blur-xl 
        bg-white/70 dark:bg-gray-900/70 
        border border-white/20 dark:border-gray-700/30
        rounded-2xl 
        shadow-xl 
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export const GradientButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false,
  type = 'button'
}) => {
  const variants = {
    primary: 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
    secondary: 'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
    success: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    danger: 'from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3
        bg-gradient-to-r ${variants[variant]}
        text-white
        font-semibold
        rounded-xl
        shadow-lg
        hover:shadow-xl
        transition-all
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
};

export const AnimatedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        {...props}
        className={`
          w-full
          px-4 py-3
          bg-white/50 dark:bg-gray-800/50
          backdrop-blur-sm
          border-2
          ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
          rounded-xl
          focus:outline-none
          focus:border-blue-500
          dark:focus:border-blue-400
          transition-all
          text-gray-900 dark:text-white
          placeholder-gray-400
          ${className}
        `}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`} />
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span className={`
      inline-flex items-center
      px-3 py-1
      rounded-full
      text-xs font-semibold
      ${variants[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
};
