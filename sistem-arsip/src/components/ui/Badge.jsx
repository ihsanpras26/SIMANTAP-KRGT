import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const badgeVariants = {
  default: 'border-transparent bg-primary-100 text-primary-800 hover:bg-primary-200',
  secondary: 'border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200',
  destructive: 'border-transparent bg-red-100 text-red-800 hover:bg-red-200',
  outline: 'text-gray-700 border-gray-300 hover:bg-gray-50',
  success: 'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
  warning: 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  info: 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200',
};

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';

export { Badge, badgeVariants };