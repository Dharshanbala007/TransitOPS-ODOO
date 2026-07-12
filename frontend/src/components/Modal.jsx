import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import GlassCard from './GlassCard';

export default function Modal({ isOpen, onClose, title, children, layoutId }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop with fade-in blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card with spring-like overshoot from below */}
          <motion.div
            layoutId={layoutId}
            initial={{ opacity: 0, scale: 0.92, y: 80 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 80 }}
            transition={{ 
              type: 'spring', 
              stiffness: 280, 
              damping: 24, // gentle overshoot
              mass: 0.8
            }}
            className="relative z-10 w-full max-w-lg"
          >
            <div 
              className="w-full p-6 text-left border border-white/20 shadow-2xl relative"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(36px) saturate(150%)',
                WebkitBackdropFilter: 'blur(36px) saturate(150%)',
                borderRadius: '28px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-xl font-bold tracking-tight text-white font-sans">{title}</h3>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[65vh] overflow-y-auto pr-1">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
