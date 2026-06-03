import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Logo from './Logo.jsx';

/** Split-screen auth layout shared by login / register / reset pages. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen">
      {/* Form side */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <Link to="/"><Logo /></Link>
          <div className="mt-10">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>

      {/* Brand side */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-600 to-brand-900 lg:block">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative flex h-full flex-col justify-center px-16 text-white">
          <Sparkles className="h-10 w-10" />
          <h2 className="mt-6 text-4xl font-extrabold leading-tight">
            Your personal AI mentor for every subject.
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/80">
            Generate quizzes, chat with an AI tutor, manage study materials, and watch your
            progress climb — all in one platform.
          </p>
          <ul className="mt-8 space-y-3 text-white/90">
            {['AI-generated quizzes with explanations', 'Context-aware AI tutor', 'Beautiful progress analytics'].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 text-sm">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
