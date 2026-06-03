import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Badge } from './ui.jsx';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleColor = { admin: 'red', teacher: 'amber', student: 'brand' }[user?.role] || 'slate';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:px-6">
      <button className="btn-ghost !p-2 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name?.split(' ')[0]}</span> 👋
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-ghost !p-2" onClick={toggle} aria-label="Toggle theme">
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="relative" ref={ref}>
          <button
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setOpen((o) => !o)}
          >
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {initials}
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 animate-fade-in rounded-xl border border-slate-200 bg-white p-2 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                <Badge color={roleColor} className="mt-2 capitalize">
                  {user?.role}
                </Badge>
              </div>
              <hr className="my-1" />
              <button
                className="nav-link w-full"
                onClick={() => {
                  setOpen(false);
                  navigate('/profile');
                }}
              >
                <UserIcon className="h-4 w-4" /> Profile
              </button>
              <button
                className="nav-link w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
