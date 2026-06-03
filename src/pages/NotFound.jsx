import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-600/15">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-5xl font-extrabold text-slate-900 dark:text-white">404</h1>
      <p className="mt-2 text-slate-500">We couldn&apos;t find the page you were looking for.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-outline">Go home</Link>
        <Link to="/dashboard" className="btn-primary">Back to dashboard</Link>
      </div>
    </div>
  );
}
