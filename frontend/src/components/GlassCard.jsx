import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hoverable = true, layoutId, onClick }) {
  const Component = onClick ? motion.button : motion.div;
  
  return (
    <Component
      layoutId={layoutId}
      onClick={onClick}
      className={`glass-panel text-left ${hoverable ? 'glass-panel-hover cursor-pointer' : ''} ${className}`}
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 15 }}
      whileHover={hoverable ? { 
        scale: 1.015, 
        y: -3,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
      } : {}}
      whileTap={hoverable ? { 
        scale: 0.99,
        transition: { duration: 0.15 }
      } : {}}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
