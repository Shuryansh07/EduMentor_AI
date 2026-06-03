import { GraduationCap } from 'lucide-react';
import { cn } from '../lib/cn.js';

export default function Logo({ collapsed = false, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
        <GraduationCap className="h-5 w-5" />
      </div>
      {!collapsed && (
        <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          EduMentor<span className="text-brand-600"> AI</span>
        </span>
      )}
    </div>
  );
}
