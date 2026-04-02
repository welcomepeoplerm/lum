'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { Edit2, MapPin, Plus, Save, Search, Trash2, Users, X } from 'lucide-react';
import { Spinner } from '@fluentui/react-components';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Contatto } from '@/types';

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-4 w-4" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.01 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.25.59 4.45 1.72 6.39L3.1 28.8l6.57-1.72a12.74 12.74 0 0 0 6.34 1.72h.01c7.07 0 12.8-5.73 12.8-12.8S23.08 3.2 16.01 3.2Zm0 23.35h-.01a10.5 10.5 0 0 1-5.35-1.47l-.38-.22-3.9 1.02 1.04-3.8-.25-.4a10.55 10.55 0 1 1 8.85 4.87Zm5.78-7.88c-.32-.16-1.9-.94-2.2-1.04-.29-.11-.5-.16-.71.16-.21.31-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.56-.94-.84-1.58-1.88-1.76-2.2-.19-.31-.02-.48.14-.64.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.7-.97-2.33-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.31-1.11 1.08-1.11 2.64s1.14 3.06 1.3 3.27c.16.21 2.23 3.4 5.4 4.77.75.32 1.34.51 1.8.65.76.24 1.45.2 1.99.12.61-.09 1.9-.78 2.17-1.54.27-.76.27-1.41.19-1.54-.08-.14-.29-.22-.61-.38Z"
      />
    </svg>
  );
}

export default function ContattiManagement() {
  const { user } = useAuth();
  const [contatti, setContatti] = useState<Contatto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchNominativo, setSearchNominativo] = useState('');
  const [searchArea, setSearchArea] = useState('');
  const [formData, setFormData] = useState({
    nominativo: '',
    telefono: '',
    mobile: '',
    indirizzo: '',
    competenza: ''
  });

  const loadContatti = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'contatti'), orderBy('nominativo', 'asc'));
      const querySnapshot = await getDocs(q);
      const contattiData: Contatto[] = [];

      querySnapshot.forEach((currentDoc) => {
        const data = currentDoc.data();
        contattiData.push({
          id: currentDoc.id,
          nominativo: data.nominativo || '',
          telefono: data.telefono || '',
          mobile: data.mobile || '',
          indirizzo: data.indirizzo || '',
          competenza: data.competenza || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          userId: data.userId || ''
        });
      });

      setContatti(contattiData);
    } catch (error) {
      console.error('Errore nel caricamento dei contatti:', error);
      alert('Errore nel caricamento dei contatti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContatti();
  }, []);

  const competenze = useMemo(
    () => Array.from(new Set(contatti.map((item) => item.competenza?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'it')),
    [contatti]
  );

  const filteredContatti = useMemo(
    () => contatti.filter((item) => {
      const byNominativo = !searchNominativo.trim() || item.nominativo.toLowerCase().includes(searchNominativo.toLowerCase());
      const byArea = !searchArea.trim() || (item.competenza || '').toLowerCase().includes(searchArea.toLowerCase());
      return byNominativo && byArea;
    }),
    [contatti, searchNominativo, searchArea]
  );

  const mapPreviewUrl = useMemo(() => {
    const address = formData.indirizzo.trim();
    if (!address) return '';
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  }, [formData.indirizzo]);

  const resetForm = () => {
    setFormData({
      nominativo: '',
      telefono: '',
      mobile: '',
      indirizzo: '',
      competenza: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;
    if (!formData.nominativo.trim()) {
      alert('Il campo Nominativo è obbligatorio');
      return;
    }

    const contattoData: Record<string, string> = {
      nominativo: formData.nominativo.trim(),
      userId: user.id
    };

    if (formData.telefono.trim()) contattoData.telefono = formData.telefono.trim();
    if (formData.mobile.trim()) contattoData.mobile = formData.mobile.trim();
    if (formData.indirizzo.trim()) contattoData.indirizzo = formData.indirizzo.trim();
    if (formData.competenza.trim()) contattoData.competenza = formData.competenza.trim();

    try {
      if (editingId) {
        await updateDoc(doc(db, 'contatti', editingId), contattoData);
      } else {
        await addDoc(collection(db, 'contatti'), {
          ...contattoData,
          createdAt: new Date()
        });
      }

      await loadContatti();
      resetForm();
    } catch (error) {
      console.error('Errore nel salvataggio del contatto:', error);
      alert('Errore nel salvataggio del contatto');
    }
  };

  const handleEdit = (contatto: Contatto) => {
    setFormData({
      nominativo: contatto.nominativo,
      telefono: contatto.telefono || '',
      mobile: contatto.mobile || '',
      indirizzo: contatto.indirizzo || '',
      competenza: contatto.competenza || ''
    });
    setEditingId(contatto.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo contatto?')) return;

    try {
      await deleteDoc(doc(db, 'contatti', id));
      await loadContatti();
    } catch (error) {
      console.error("Errore nell'eliminazione del contatto:", error);
      alert("Errore nell'eliminazione del contatto");
    }
  };

  const openMap = (indirizzo: string) => {
    if (!indirizzo.trim()) return;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(indirizzo)}`;
    window.open(mapUrl, '_blank');
  };

  const cleanPhoneNumber = (value: string) => value.replace(/\s+/g, '').replace(/[^\d+]/g, '');

  const openWhatsApp = (number: string, nominativo: string) => {
    if (!number.trim()) return;
    const cleanNumber = cleanPhoneNumber(number);
    const message = encodeURIComponent(`Buongiorno ${nominativo}, `);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Caricamento contatti..." size="large" />
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center">
          <Users className="h-6 w-6 mr-2" style={{ color: '#2f5fdd' }} />
          <h2 className="text-xl font-semibold text-gray-800">Gestione Contatti</h2>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm hover:opacity-90 transition-opacity cursor-pointer w-full sm:w-auto"
          style={{ backgroundColor: '#2f5fdd' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuovo
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0' }} />

      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ricerca nominativo</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchNominativo}
                onChange={(e) => setSearchNominativo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Es. Mario Rossi"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ricerca area</label>
            <input
              type="text"
              value={searchArea}
              onChange={(e) => setSearchArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Es. Idraulica"
              list="aree-competenza-list"
            />
            <datalist id="aree-competenza-list">
              {competenze.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominativo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indirizzo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competenza</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContatti.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Nessun contatto trovato</td>
                </tr>
              ) : (
                filteredContatti.map((contatto) => (
                  <tr key={contatto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{contatto.nominativo}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {contatto.telefono ? (
                        <a
                          href={`tel:${cleanPhoneNumber(contatto.telefono)}`}
                          className="text-[#2f5fdd] hover:underline"
                          title="Chiama numero telefono"
                        >
                          {contatto.telefono}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {contatto.mobile ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${cleanPhoneNumber(contatto.mobile)}`}
                            className="text-[#2f5fdd] hover:underline"
                            title="Chiama numero mobile"
                          >
                            {contatto.mobile}
                          </a>
                          <button
                            onClick={() => openWhatsApp(contatto.mobile || contatto.telefono || '', contatto.nominativo)}
                            className="inline-flex items-center text-green-600 hover:opacity-80 cursor-pointer"
                            title="Apri WhatsApp"
                          >
                            <WhatsAppIcon />
                          </button>
                        </div>
                      ) : (
                        contatto.telefono ? (
                          <button
                            onClick={() => openWhatsApp(contatto.telefono || '', contatto.nominativo)}
                            className="inline-flex items-center text-green-600 hover:opacity-80 cursor-pointer"
                            title="Apri WhatsApp"
                          >
                            <WhatsAppIcon />
                          </button>
                        ) : (
                          '-'
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <span>{contatto.indirizzo || '-'}</span>
                        {contatto.indirizzo && (
                          <button
                            onClick={() => openMap(contatto.indirizzo || '')}
                            className="inline-flex items-center text-[#2f5fdd] hover:opacity-80 cursor-pointer"
                            title="Visualizza su mappa"
                          >
                            <MapPin className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{contatto.competenza || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(contatto)}
                          className="inline-flex items-center p-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Modifica"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contatto.id)}
                          className="inline-flex items-center p-2 text-red-600 hover:text-red-900 cursor-pointer"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25" onClick={resetForm}></div>
          <div className="relative w-full max-w-2xl p-5 border shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editingId ? 'Modifica Contatto' : 'Nuovo Contatto'}</h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nominativo *</label>
                  <input
                    type="text"
                    value={formData.nominativo}
                    onChange={(e) => setFormData({ ...formData, nominativo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Es. Mario Rossi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competenza</label>
                  <input
                    type="text"
                    value={formData.competenza}
                    onChange={(e) => setFormData({ ...formData, competenza: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Es. Elettricista"
                    list="competenze-list"
                  />
                  <datalist id="competenze-list">
                    {competenze.map((value) => (
                      <option key={value} value={value} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Es. 075123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Es. 3331234567"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.indirizzo}
                      onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Es. Via Roma 10, Perugia"
                    />
                    <button
                      type="button"
                      onClick={() => openMap(formData.indirizzo)}
                      disabled={!formData.indirizzo.trim()}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title="Cerca su mappa"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                  </div>
                  {mapPreviewUrl && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Anteprima su Google Maps</p>
                      <div className="border border-gray-200 rounded-md overflow-hidden">
                      <iframe
                        title="Anteprima Google Maps"
                        src={mapPreviewUrl}
                        width="100%"
                        height="220"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 text-white rounded-md hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: '#2f5fdd' }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Modifica' : 'Salva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
