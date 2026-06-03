import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FileText, Upload, Search, Trash2, Download, FileType2, Image as ImageIcon, NotebookPen,
} from 'lucide-react';
import {
  PageHeader, Card, Button, Input, Select, Field, Textarea, Modal, Loading, EmptyState, Badge,
} from '../components/ui.jsx';
import { materialApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../lib/cn.js';
import { errMsg } from '../api/axios.js';

const fileIcon = { pdf: FileType2, docx: FileText, image: ImageIcon, note: NotebookPen };

export default function Materials() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ search: '', subject: '', mine: 'false' });
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (query.search) params.search = query.search;
      if (query.subject) params.subject = query.subject;
      if (query.mine === 'true') params.mine = 'true';
      const { data } = await materialApi.list(params);
      setItems(data.items);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const onDelete = async (id) => {
    if (!confirm('Delete this material?')) return;
    try {
      await materialApi.remove(id);
      setItems((prev) => prev.filter((m) => m._id !== id));
      toast.success('Deleted');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div>
      <PageHeader title="Study Materials" subtitle="Upload and organise PDFs, DOCX and notes.">
        <Button onClick={() => setModal(true)}><Upload className="h-4 w-4" /> Upload</Button>
      </PageHeader>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search materials…" value={query.search} onChange={(e) => setQuery({ ...query, search: e.target.value })} />
        </div>
        <Input className="sm:w-48" placeholder="Subject" value={query.subject} onChange={(e) => setQuery({ ...query, subject: e.target.value })} />
        <Select className="sm:w-40" value={query.mine} onChange={(e) => setQuery({ ...query, mine: e.target.value })}>
          <option value="false">All visible</option>
          <option value="true">My uploads</option>
        </Select>
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="No materials found" subtitle="Upload your first study material to get started.">
          <Button onClick={() => setModal(true)}><Upload className="h-4 w-4" /> Upload material</Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => {
            const Icon = fileIcon[m.fileType] || FileText;
            const owner = m.uploadedBy?._id === user?._id;
            return (
              <Card key={m._id} className="flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge color="slate" className="uppercase">{m.fileType}</Badge>
                </div>
                <h3 className="mt-3 line-clamp-1 font-semibold text-slate-900 dark:text-white">{m.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{m.description || 'No description'}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge color="brand">{m.subject}</Badge>
                  {m.tags?.slice(0, 2).map((t) => <Badge key={t} color="slate">#{t}</Badge>)}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className="text-xs text-slate-400">{formatDate(m.createdAt)}</span>
                  <div className="flex gap-1">
                    <a href={m.fileUrl} target="_blank" rel="noreferrer" className="btn-ghost !p-2" title="Open">
                      <Download className="h-4 w-4" />
                    </a>
                    {(owner || user?.role === 'admin') && (
                      <button onClick={() => onDelete(m._id)} className="btn-ghost !p-2 text-red-500" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <UploadModal open={modal} onClose={() => setModal(false)} onUploaded={(m) => setItems((p) => [m, ...p])} />
    </div>
  );
}

function UploadModal({ open, onClose, onUploaded }) {
  const [form, setForm] = useState({ title: '', subject: '', description: '', tags: '', visibility: 'private' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setForm({ title: '', subject: '', description: '', tags: '', visibility: 'private' });
    setFile(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please choose a file');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const { data } = await materialApi.upload(fd);
      toast.success('Uploaded!');
      onUploaded(data.material);
      reset();
      onClose();
    } catch (err) {
      toast.error(errMsg(err, 'Upload failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload study material">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Title">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject">
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          </Field>
          <Field label="Visibility">
            <Select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
              <option value="private">Private</option>
              <option value="course">Course</option>
              <option value="public">Public</option>
            </Select>
          </Field>
        </div>
        <Field label="Tags" hint="Comma separated, e.g. algebra, exam">
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="File" hint="PDF, DOCX, TXT or image · up to 15 MB">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.txt,.md,image/*"
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Upload</Button>
        </div>
      </form>
    </Modal>
  );
}
