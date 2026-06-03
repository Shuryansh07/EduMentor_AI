import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/AuthShell.jsx';
import { Button, Field, Input } from '../../components/ui.jsx';
import { authApi } from '../../api/endpoints.js';
import { setAccessToken, errMsg } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await authApi.reset(token, form.password);
      setAccessToken(data.accessToken);
      setUser(data.user);
      toast.success('Password updated!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Reset failed — the link may have expired'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you don't use elsewhere."
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="New password" hint="8+ chars, with an uppercase letter and a number.">
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        <Field label="Confirm password">
          <Input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        </Field>
        <Button type="submit" loading={loading} className="w-full">Update password</Button>
      </form>
    </AuthShell>
  );
}
