import { useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, Save, KeyRound } from 'lucide-react';
import { PageHeader, Card, Button, Input, Textarea, Field, Badge } from '../components/ui.jsx';
import { userApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/axios.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    subjects: (user?.subjects || []).join(', '),
  });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  const initials = (user?.name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const { data } = await userApi.updateProfile(payload);
      setUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const onAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await userApi.uploadAvatar(fd);
      setUser(data.user);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setChanging(true);
    try {
      await userApi.changePassword(pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setChanging(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account and learning preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar card */}
        <Card className="flex flex-col items-center text-center">
          <div className="relative">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <span className="grid h-24 w-24 place-items-center rounded-full bg-brand-600 text-2xl font-bold text-white">{initials}</span>
            )}
            <label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white shadow-soft ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <Camera className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            </label>
          </div>
          <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{user?.name}</h3>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <Badge color={{ admin: 'red', teacher: 'amber', student: 'brand' }[user?.role] || 'slate'} className="mt-3 capitalize">
            {user?.role}
          </Badge>
        </Card>

        {/* Edit profile */}
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Account details</h3>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Bio"><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself…" /></Field>
            <Field label="Subjects of interest" hint="Comma separated">
              <Input value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} placeholder="Mathematics, Physics" />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Save changes</Button>
            </div>
          </form>
        </Card>

        {/* Change password */}
        <Card className="lg:col-span-3">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <KeyRound className="h-4 w-4" /> Change password
          </h3>
          <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
            <Field label="Current password">
              <Input type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} required />
            </Field>
            <Field label="New password" hint="8+ chars, uppercase + number">
              <Input type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required />
            </Field>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" variant="outline" loading={changing}>Update password</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
