import { Link } from 'react-router-dom';
import { Sparkles, MessageSquare, BarChart3, FileText, ArrowRight, GraduationCap } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  { icon: Sparkles, title: 'AI Quiz Generator', desc: 'Turn any topic into a tailored quiz with instant explanations — beginner to advanced.' },
  { icon: MessageSquare, title: 'AI Tutor', desc: 'A patient, context-aware tutor that explains concepts step-by-step in Markdown.' },
  { icon: FileText, title: 'Study Materials', desc: 'Upload PDFs, DOCX and notes, organised by subject and searchable tags.' },
  { icon: BarChart3, title: 'Progress Analytics', desc: 'Track scores, streaks and subject mastery with beautiful dashboards.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const cta = isAuthenticated ? '/dashboard' : '/register';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-center lg:pt-20">
        <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-300">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Powered by Google Gemini
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          Learn anything, <span className="text-brand-600">faster</span>, with your AI mentor.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
          EduMentor AI personalises your learning with AI-generated quizzes, a 24/7 tutor,
          smart study-material management, and progress analytics — all in one place.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to={cta} className="btn-primary px-6 py-3 text-base">
            Start learning free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="btn-outline px-6 py-3 text-base">I have an account</Link>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-3 gap-4 text-center">
          {[
            ['AI-graded', 'quizzes'],
            ['24/7', 'AI tutor'],
            ['3 roles', 'student · teacher · admin'],
          ].map(([n, l]) => (
            <div key={l} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{n}</p>
              <p className="text-sm text-slate-500">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white">
            Everything you need to learn smarter
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-slate-400 sm:flex-row">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> EduMentor AI © {new Date().getFullYear()}
        </div>
        <p>Built with the MERN stack.</p>
      </footer>
    </div>
  );
}
