import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const buttonVariants = {
  default: 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl',
  destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl',
  outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 shadow-md hover:shadow-lg',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-md hover:shadow-lg',
  ghost: 'hover:bg-gray-100 hover:text-gray-900',
  link: 'text-primary-600 underline-offset-4 hover:underline',
  success: 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg hover:shadow-xl',
};

const sizeVariants = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default', 
  disabled = false,
  loading = false,
  children,
  ...props 
}, ref) => {
  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        sizeVariants[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      ref={ref}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };