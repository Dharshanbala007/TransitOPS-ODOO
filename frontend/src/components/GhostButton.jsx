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
        background: 'var(--glass-fill)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'inset 0 1px 0 var(--glass-highlight)'
      }}
    >
      {children}
    </motion.button>
  );
}
