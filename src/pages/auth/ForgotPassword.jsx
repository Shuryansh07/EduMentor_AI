import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ShieldCheck, ArrowLeft } from 'lucide-react';
import AuthShell from '../../components/AuthShell.jsx';
import { Button, Field, Input } from '../../components/ui.jsx';
import { authApi } from '../../api/endpoints.js';
import { setAccessToken, errMsg } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

const RESEND_SECONDS = 30;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState(1); // 1 = email, 2 = otp + new password
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otp: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const sendCode = async (e) => {
    e?.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgot(email);
      toast.success('Code sent — check your email');
      setStep(2);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await authApi.resetOtp({ email, otp: form.otp, password: form.password });
      // Backend returns fresh tokens — sign the user straight in.
      setAccessToken(data.accessToken);
      setUser(data.user);
      toast.success('Password updated — you are signed in!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Reset failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? 'Forgot your password?' : 'Enter your reset code'}
      subtitle={
        step === 1
          ? "Enter your email and we'll send a 6-digit code."
          : `We sent a 6-digit code to ${email}. It expires in 10 minutes.`
      }
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      {step === 1 ? (
        <form onSubmit={sendCode} className="space-y-4">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            <Mail className="h-4 w-4" /> Send reset code
          </Button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <Field label="6-digit code">
            <Input
              inputMode="numeric"
              maxLength={6}
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
              placeholder="••••••"
              className="text-center text-2xl font-bold tracking-[0.5em]"
              required
            />
          </Field>
          <Field label="New password" hint="8+ chars, with an uppercase letter and a number.">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </Field>
          <Field label="Confirm password">
            <Input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </Field>

          <Button type="submit" loading={loading} className="w-full">
            <ShieldCheck className="h-4 w-4" /> Reset password
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:underline">
              Change email
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={sendCode}
              className="font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
