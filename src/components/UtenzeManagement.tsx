'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { Eye, EyeOff, Plus, Edit2, Trash2, Save, X, Search, KeyRound, Copy, Check } from 'lucide-react';
import { Spinner } from '@fluentui/react-components';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { encrypt, decrypt } from '@/lib/crypto';
import { Utenza } from '@/types';

// Sensitive fields that get AES-GCM encryption at rest
const SENSITIVE_FIELDS = ['password', 'codiceSicurezza', 'pin', 'puk'] as const;
type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

const defaultForm = {
  portale: '',
  categoria: '',
  utente: '',
  password: '',
  email: '',
  codiceSicurezza: '',
  link: '',
  pin: '',
  puk: '',
  note: '',
};

// ---------- tiny helper: copy-to-clipboard button ----------
function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copia"
      className="ml-1 text-gray-400 hover:text-blue-600 transition-colors"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

// ---------- secret input (form) ----------
interface SecretInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}
function SecretInput({ id, label, value, onChange, placeholder }: SecretInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? label}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 text-gray-400 hover:text-gray-600 transition-colors"
          title={visible ? 'Nascondi' : 'Mostra'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ---------- secret cell (grid) ----------
interface SecretCellProps {
  value: string;
}
function SecretCell({ value }: SecretCellProps) {
  const [visible, setVisible] = useState(false);
  if (!value) return <span className="text-gray-300">—</span>;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs">
      {visible ? value : '••••••'}
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="ml-0.5 text-gray-400 hover:text-gray-600 transition-colors"
        title={visible ? 'Nascondi' : 'Mostra'}
      >
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      {visible && <CopyBtn value={value} />}
    </span>
  );
}

// ---------- main component ----------
export default function UtenzeManagement() {
  const { user } = useAuth();

  const [utenze, setUtenze] = useState<Utenza[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<typeof defaultForm>(defaultForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---- load ----
  const loadUtenze = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'utenze'), orderBy('portale', 'asc'));
      const snap = await getDocs(q);
      const rows: Utenza[] = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          // Decrypt sensitive fields
          const [password, codiceSicurezza, pin, puk] = await Promise.all([
            decrypt(data.password ?? ''),
            decrypt(data.codiceSicurezza ?? ''),
            decrypt(data.pin ?? ''),
            decrypt(data.puk ?? ''),
          ]);
          return {
            id: d.id,
            portale: data.portale ?? '',
            categoria: data.categoria ?? '',
            utente: data.utente ?? '',
            password,
            email: data.email ?? '',
            codiceSicurezza,
            link: data.link ?? '',
            pin,
            puk,
            note: data.note ?? '',
            createdAt: data.createdAt?.toDate() ?? new Date(),
            userId: data.userId ?? '',
          } satisfies Utenza;
        }),
      );
      setUtenze(rows);
    } catch (err) {
      console.error('Errore caricamento utenze:', err);
      alert('Errore nel caricamento delle utenze');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUtenze();
  }, []);

  // ---- categories for filter ----
  const categorie = useMemo(
    () => Array.from(new Set(utenze.map((u) => u.categoria).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'it')),
    [utenze],
  );

  // ---- filtered list ----
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return utenze.filter((u) => {
      const matchSearch =
        !term ||
        u.portale.toLowerCase().includes(term) ||
        u.utente.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);
      const matchCat = !filterCategoria || u.categoria === filterCategoria;
      return matchSearch && matchCat;
    });
  }, [utenze, searchTerm, filterCategoria]);

  // ---- form helpers ----
  const resetForm = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (u: Utenza) => {
    setFormData({
      portale: u.portale,
      categoria: u.categoria,
      utente: u.utente,
      password: u.password,
      email: u.email,
      codiceSicurezza: u.codiceSicurezza,
      link: u.link,
      pin: u.pin,
      puk: u.puk,
      note: u.note ?? '',
    });
    setEditingId(u.id);
    setShowForm(true);
  };

  // ---- save ----
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.portale.trim()) {
      alert('Il campo Portale è obbligatorio.');
      return;
    }
    setSaving(true);
    try {
      // Encrypt sensitive fields
      const [encPassword, encCodiceSicurezza, encPin, encPuk] = await Promise.all([
        encrypt(formData.password),
        encrypt(formData.codiceSicurezza),
        encrypt(formData.pin),
        encrypt(formData.puk),
      ]);

      const payload = {
        portale: formData.portale.trim(),
        categoria: formData.categoria.trim(),
        utente: formData.utente.trim(),
        password: encPassword,
        email: formData.email.trim(),
        codiceSicurezza: encCodiceSicurezza,
        link: formData.link.trim(),
        pin: encPin,
        puk: encPuk,
        note: formData.note.trim(),
        userId: user?.id ?? '',
      };

      if (editingId) {
        await updateDoc(doc(db, 'utenze', editingId), payload);
      } else {
        await addDoc(collection(db, 'utenze'), {
          ...payload,
          createdAt: new Date(),
        });
      }
      resetForm();
      await loadUtenze();
    } catch (err) {
      console.error('Errore salvataggio utenza:', err);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // ---- delete ----
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'utenze', id));
      setDeleteConfirmId(null);
      await loadUtenze();
    } catch (err) {
      console.error('Errore eliminazione utenza:', err);
      alert('Errore durante l\'eliminazione');
    }
  };

  // ---- render ----
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner label="Caricamento utenze..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <KeyRound size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">Utenze Manager</h2>
            <p className="text-xs text-gray-500">
              {utenze.length} {utenze.length === 1 ? 'utenza' : 'utenze'} registrate
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData(defaultForm); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nuova utenza
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca portale, utente, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <select
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value="">Tutte le categorie</option>
          {categorie.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Form drawer */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">
              {editingId ? 'Modifica utenza' : 'Nuova utenza'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Portale */}
              <div>
                <label htmlFor="portale" className="block text-sm font-medium text-gray-700 mb-1">
                  Portale <span className="text-red-500">*</span>
                </label>
                <input
                  id="portale"
                  type="text"
                  value={formData.portale}
                  onChange={(e) => setFormData((p) => ({ ...p, portale: e.target.value }))}
                  required
                  placeholder="es. Comune di Terni"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              {/* Categoria */}
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input
                  id="categoria"
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData((p) => ({ ...p, categoria: e.target.value }))}
                  list="categorie-list"
                  placeholder="es. Tributi, Utilities..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <datalist id="categorie-list">
                  {categorie.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              {/* Utente */}
              <div>
                <label htmlFor="utente" className="block text-sm font-medium text-gray-700 mb-1">Utente</label>
                <input
                  id="utente"
                  type="text"
                  value={formData.utente}
                  onChange={(e) => setFormData((p) => ({ ...p, utente: e.target.value }))}
                  placeholder="Username / Codice fiscale"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  autoComplete="off"
                />
              </div>
              {/* Password – encrypted */}
              <SecretInput
                id="password"
                label="Password"
                value={formData.password}
                onChange={(v) => setFormData((p) => ({ ...p, password: v }))}
                placeholder="Password di accesso"
              />
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@esempio.it"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  autoComplete="off"
                />
              </div>
              {/* Codice Sicurezza – encrypted */}
              <SecretInput
                id="codiceSicurezza"
                label="Codice Sicurezza"
                value={formData.codiceSicurezza}
                onChange={(v) => setFormData((p) => ({ ...p, codiceSicurezza: v }))}
                placeholder="Codice di sicurezza"
              />
              {/* Link */}
              <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                <input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData((p) => ({ ...p, link: e.target.value }))}
                  placeholder="https://portale.esempio.it"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              {/* PIN – encrypted */}
              <SecretInput
                id="pin"
                label="PIN"
                value={formData.pin}
                onChange={(v) => setFormData((p) => ({ ...p, pin: v }))}
                placeholder="PIN"
              />
              {/* PUK – encrypted */}
              <SecretInput
                id="puk"
                label="PUK"
                value={formData.puk}
                onChange={(v) => setFormData((p) => ({ ...p, puk: v }))}
                placeholder="PUK"
              />
              {/* Note – full width */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  id="note"
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Note aggiuntive"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? <Spinner size="extra-tiny" /> : <Save size={15} />}
                {editingId ? 'Salva modifiche' : 'Aggiungi'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <X size={15} />
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <KeyRound size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">
            {utenze.length === 0 ? 'Nessuna utenza registrata. Aggiungi la prima.' : 'Nessun risultato per i filtri selezionati.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Portale</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Categoria</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Utente</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Password</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Cod. Sicurezza</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Link</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">PIN</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">PUK</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.portale}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.categoria ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                          {u.categoria}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{u.utente || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><SecretCell value={u.password} /></td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {u.email ? (
                        <a href={`mailto:${u.email}`} className="text-blue-600 hover:underline text-xs">{u.email}</a>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><SecretCell value={u.codiceSicurezza} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.link ? (
                        <a href={u.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs max-w-[120px] truncate block">
                          {u.link}
                        </a>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><SecretCell value={u.pin} /></td>
                    <td className="px-4 py-3 whitespace-nowrap"><SecretCell value={u.puk} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifica"
                        >
                          <Edit2 size={14} />
                        </button>
                        {deleteConfirmId === u.id ? (
                          <span className="flex items-center gap-1 text-xs">
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                            >
                              Conferma
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-xs hover:bg-gray-50 transition-colors text-gray-600"
                            >
                              Annulla
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(u.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Elimina"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} {filtered.length === 1 ? 'record' : 'record'} visualizzati
            {filtered.length !== utenze.length && ` (${utenze.length} totali)`}
            <span className="ml-2 inline-flex items-center gap-1">
              <KeyRound size={11} />
              I campi sensibili sono cifrati con AES-GCM
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
