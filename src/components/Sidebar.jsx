import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  ListChecks,
  MessageSquare,
  BarChart3,
  BookOpen,
  Shield,
  User,
  X,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { cn } from '../lib/cn.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/materials', label: 'Study Materials', icon: FileText },
  { to: '/quiz/generate', label: 'Quiz Generator', icon: Sparkles },
  { to: '/quizzes', label: 'Quizzes', icon: ListChecks },
  { to: '/tutor', label: 'AI Tutor', icon: MessageSquare },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin', label: 'Admin Panel', icon: Shield, roles: ['admin'] },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = NAV.filter((i) => !i.roles || i.roles.includes(user?.role));

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button className="btn-ghost !p-1.5 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
          <p className="text-sm font-semibold">Learn smarter ✨</p>
          <p className="mt-1 text-xs text-white/80">
            Generate a quiz or ask the AI tutor anything.
          </p>
        </div>
      </aside>
    </>
  );
}
