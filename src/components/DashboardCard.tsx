import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cardEntranceVariants } from '../lib/animationVariants';

interface DashboardCardProps {
  title: string;
  value?: string;
  unit?: string;
  children?: ReactNode;
  className?: string;
  delay?: number;
}

export default function DashboardCard({ 
  title, 
  value, 
  unit, 
  children, 
  className = '',
  delay = 0 
}: DashboardCardProps) {
  return (
    <motion.div 
      variants={cardEntranceVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      className={`bg-[#061426]/80 backdrop-blur-md border border-[#172b4d] rounded-2xl p-5 flex flex-col gap-2 shadow-xl glass-panel-hover ${className}`}
    >
      <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
        <span>{title}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
      </h3>
      {value && (
        <div className="text-2xl sm:text-3xl font-mono font-extrabold text-white tabular-nums tracking-tight">
          {value}
          <span className="text-xs font-sans font-normal text-slate-400 ml-1.5">{unit}</span>
        </div>
      )}
      <div className="flex-1">{children}</div>
    </motion.div>
  );
}
