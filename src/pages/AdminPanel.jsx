import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Users, Search, ShieldAlert, Trash2, Ban, CheckCircle2, Flag } from 'lucide-react';
import { PageHeader, Card, Input, Select, Loading, Badge, Button, EmptyState } from '../components/ui.jsx';
import { adminApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/axios.js';
import { formatDate } from '../lib/cn.js';

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="Manage users and moderate platform content." />
      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {[['users', 'Users'], ['content', 'Content moderation']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === k ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'users' ? <UsersTab /> : <ContentTab />}
    </div>
  );
}

function UsersTab() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState({ search: '', role: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q.search) params.search = q.search;
      if (q.role) params.role = q.role;
      const { data } = await adminApi.users(params);
      setUsers(data.users);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const setRole = async (id, role) => {
    try {
      const { data } = await adminApi.setRole(id, role);
      setUsers((p) => p.map((u) => (u._id === id ? data.user : u)));
      toast.success('Role updated');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const toggleActive = async (u) => {
    try {
      const { data } = await adminApi.setActive(u._id, !u.isActive);
      setUsers((p) => p.map((x) => (x._id === u._id ? data.user : x)));
      toast.success(data.user.isActive ? 'Activated' : 'Deactivated');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async (id) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await adminApi.deleteUser(id);
      setUsers((p) => p.filter((u) => u._id !== id));
      toast.success('User removed');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <Card className="!p-0">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search by name or email…" value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value })} />
        </div>
        <Select className="sm:w-44" value={q.role} onChange={(e) => setQ({ ...q, role: e.target.value })}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </Select>
      </div>

      {loading ? <Loading /> : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Select className="!py-1.5 text-xs" value={u.role} disabled={u._id === me._id}
                      onChange={(e) => setRole(u._id, e.target.value)}>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toggleActive(u)} disabled={u._id === me._id}
                        className="btn-ghost !p-2 disabled:opacity-30" title={u.isActive ? 'Deactivate' : 'Activate'}>
                        {u.isActive ? <Ban className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </button>
                      <button onClick={() => remove(u._id)} disabled={u._id === me._id}
                        className="btn-ghost !p-2 text-red-500 disabled:opacity-30" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ContentTab() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.flagged();
      setMaterials(data.materials);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const unflag = async (id) => {
    try {
      await adminApi.flagMaterial(id, false);
      setMaterials((p) => p.filter((m) => m._id !== id));
      toast.success('Cleared flag');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async (id) => {
    if (!confirm('Remove this content permanently?')) return;
    try {
      await adminApi.removeMaterial(id);
      setMaterials((p) => p.filter((m) => m._id !== id));
      toast.success('Removed');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  if (loading) return <Loading />;
  if (materials.length === 0)
    return <EmptyState icon={ShieldAlert} title="Nothing flagged 🎉" subtitle="Flagged materials will appear here for review." />;

  return (
    <div className="space-y-3">
      {materials.map((m) => (
        <Card key={m._id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{m.title}</p>
              <p className="text-xs text-slate-400">{m.subject} · by {m.uploadedBy?.name} ({m.uploadedBy?.email})</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={m.fileUrl} target="_blank" rel="noreferrer" className="btn-outline">Review</a>
            <Button variant="outline" onClick={() => unflag(m._id)}>Clear flag</Button>
            <Button variant="danger" onClick={() => remove(m._id)}><Trash2 className="h-4 w-4" /> Remove</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
