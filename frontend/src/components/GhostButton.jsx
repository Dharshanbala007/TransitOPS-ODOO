import React from 'react';
import { motion } from 'framer-motion';

export default function GhostButton({ children, onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <motion.button
      whileHover={{ 
        scale: 1.03, 
        y: -1.5,
        backgroundColor: 'var(--glass-fill-hover)',
        borderColor: 'rgba(255, 255, 255, 0.25)'
      }}
      whileTap={{ 
        scale: 0.95,
        y: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.04)'
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 18 
      }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-medium py-2.5 px-6 rounded-full text-slate-300 transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
    >
      {children}
    </motion.button>
  );
}
