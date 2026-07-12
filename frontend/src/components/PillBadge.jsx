import React from 'react';
import { motion } from 'framer-motion';

export default function PillBadge({ status }) {
  const statusKey = status ? status.toLowerCase().replace(/\s+/g, '') : 'default';

  const themeMap = {
    available: {
      text: 'text-[#34d399]'
    },
    ontrip: {
      text: 'text-[#60a5fa]'
    },
    inshop: {
      text: 'text-[#fbbf24]'
    },
    suspended: {
      text: 'text-[#f87171]'
    },
    offduty: {
      text: 'text-[#a1a1aa]'
    },
    retired: {
      text: 'text-[#d4d4d8]'
    },
    draft: {
      text: 'text-[#c084fc]'
    },
    dispatched: {
      text: 'text-[#f43f5e]'
    },
    completed: {
      text: 'text-[#2dd4bf]'
    },
    cancelled: {
      text: 'text-[#f43f5e]'
    },
    default: {
      text: 'text-zinc-400'
    }
  };

  const theme = themeMap[statusKey] || themeMap.default;

  return (
    <motion.span
      layout
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`inline-flex items-center text-xs font-bold tracking-wide select-none ${theme.text}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-2 bg-current" style={{ boxShadow: '0 0 8px currentColor' }} />
      {status}
    </motion.span>
  );
}
