import React from 'react';
import { motion } from 'framer-motion';

export default function PrimaryButton({ children, onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <motion.button
      whileHover={{ 
        scale: 1.03, 
        y: -1.5,
        boxShadow: '0 8px 20px rgba(110, 110, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
      }}
      whileTap={{ 
        scale: 0.95, 
        y: 0,
        boxShadow: '0 2px 8px rgba(110, 110, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 18 
      }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative text-white font-medium py-2.5 px-6 rounded-full overflow-hidden transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(110, 110, 246, 0.3) 0%, rgba(110, 110, 246, 0.1) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(110, 110, 246, 0.45)',
        boxShadow: '0 8px 24px rgba(110, 110, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}
    >
      {children}
    </motion.button>
  );
}
