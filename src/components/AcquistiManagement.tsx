"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Acquisto, Fornitore, Settore } from "@/types";
import { Plus, Edit2, Trash2, Save, X, Download, Printer, Building, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import * as XLSX from "xlsx";

const defaultForm = {
  descrizioneBreve: "",
  testo: "",
  oggettoSpesa: "",
  fornitoreId: "",
  imponibile: 0,
  aliquotaIVA: 22,
  importoTotale: 0,
  numeroDocumento: "",
  dataDocumento: "",
  dataScadenza: "",
  statoPagamento: "Da Pagare",
  metodoPagamento: "Bonifico",
  categoriaSpesaId: "",
  note: ""
};

export default function AcquistiManagement() {
  const [acquisti, setAcquisti] = useState<Acquisto[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [settori, setSettori] = useState<Settore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<any>(defaultForm);
  const { user } = useAuth();

  useEffect(() => {
    loadFornitori();
    loadSettori();
    loadAcquisti();
  }, []);

  const loadFornitori = async () => {
    const q = query(collection(db, "fornitori"), orderBy("ragioneSociale", "asc"));
    const snap = await getDocs(q);
    setFornitori(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Fornitore));
  };
  const loadSettori = async () => {
    const q = query(collection(db, "settori"), orderBy("nome", "asc"));
    const snap = await getDocs(q);
    setSettori(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Settore));
  };
  const loadAcquisti = async () => {
    setLoading(true);
    const q = query(collection(db, "acquisti"), orderBy("dataDocumento", "desc"));
    const snap = await getDocs(q);
    setAcquisti(snap.docs.map(doc => ({ id: doc.id, ...doc.data(), dataDocumento: doc.data().dataDocumento?.toDate?.() || new Date(), dataScadenza: doc.data().dataScadenza?.toDate?.() || new Date() }) as Acquisto));
    setLoading(false);
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleFornitoreChange = (fornitoreId: string) => {
    setFormData((prev: any) => {
      const fornitore = fornitori.find(f => f.id === fornitoreId);
      return {
        ...prev,
        fornitoreId,
        categoriaSpesaId: fornitore?.settoreId || ""
      };
    });
  };

  const handleImponibileIvaChange = (field: "imponibile" | "aliquotaIVA", value: number) => {
    setFormData((prev: any) => {
      const imponibile = field === "imponibile" ? value : prev.imponibile;
      const aliquotaIVA = field === "aliquotaIVA" ? value : prev.aliquotaIVA;
      const importoTotale = imponibile + (imponibile * aliquotaIVA / 100);
      return { ...prev, [field]: value, importoTotale };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!formData.descrizioneBreve.trim() || !formData.fornitoreId || !formData.imponibile || !formData.aliquotaIVA || !formData.importoTotale) {
      alert("Compila tutti i campi obbligatori (*)");
      return;
    }
    const data: any = {
      ...formData,
      imponibile: Number(formData.imponibile),
      aliquotaIVA: Number(formData.aliquotaIVA),
      importoTotale: Number(formData.importoTotale),
      dataDocumento: formData.dataDocumento ? new Date(formData.dataDocumento) : null,
      dataScadenza: formData.dataScadenza ? new Date(formData.dataScadenza) : null,
      createdAt: new Date(),
      userId: user.id
    };
    try {
      if (editingId) {
        await updateDoc(doc(db, "acquisti", editingId), data);
      } else {
        await addDoc(collection(db, "acquisti"), data);
      }
      resetForm();
      await loadAcquisti();
    } catch (error) {
      console.error("Errore nel salvataggio acquisto:", error);
      alert("Errore nel salvataggio: " + (error instanceof Error ? error.message : JSON.stringify(error)));
    }
  };

  const handleEdit = (acq: Acquisto) => {
    setEditingId(acq.id);
    setFormData({
      ...acq,
      dataDocumento: acq.dataDocumento ? new Date(acq.dataDocumento).toISOString().slice(0, 10) : "",
      dataScadenza: acq.dataScadenza ? new Date(acq.dataScadenza).toISOString().slice(0, 10) : ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo acquisto?")) return;
    try {
      await deleteDoc(doc(db, "acquisti", id));
      await loadAcquisti();
    } catch {
      alert("Errore nell'eliminazione");
    }
  };

  // Filtri base
  const filteredAcquisti = acquisti.filter(a =>
    a.descrizioneBreve.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.oggettoSpesa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornitori.find(f => f.id === a.fornitoreId)?.ragioneSociale?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="h-full">
        {/* Card bianca contenitore principale */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6 min-h-[calc(100vh-12rem)]">
          {/* Header con titolo e pulsanti */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8" style={{color: '#8d9c71'}} />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestione Acquisti</h1>
            </div>
            
            {/* Pulsanti azioni */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors ${showFilters ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                style={showFilters ? {backgroundColor: '#8d9c71'} : {}}
                title="Filtri e ordinamento"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtri
                {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                title="Esporta in Excel"
              >
                <Download className="h-4 w-4 mr-1" />
                Excel
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                title="Stampa tabella"
              >
                <Printer className="h-4 w-4 mr-1" />
                Stampa
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center px-4 py-2 text-white rounded-md transition-colors cursor-pointer w-full sm:w-auto"
                style={{backgroundColor: '#8d9c71'}}
                onMouseEnter={e => (e.target as HTMLButtonElement).style.backgroundColor = '#7a8a60'}
                onMouseLeave={e => (e.target as HTMLButtonElement).style.backgroundColor = '#8d9c71'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Acquisto
              </button>
            </div>
          </div>

          {/* Inline form sopra la lista */}
          {(showForm || editingId) && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{editingId ? 'Modifica Acquisto' : 'Nuovo Acquisto'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Breve <span className="text-red-500">*</span></label>
                <input type="text" value={formData.descrizioneBreve} onChange={e => setFormData({ ...formData, descrizioneBreve: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oggetto della spesa</label>
                <input type="text" value={formData.oggettoSpesa} onChange={e => setFormData({ ...formData, oggettoSpesa: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornitore <span className="text-red-500">*</span></label>
                <select value={formData.fornitoreId} onChange={e => handleFornitoreChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" required>
                  <option value="">Seleziona...</option>
                  {fornitori.map(f => <option key={f.id} value={f.id}>{f.ragioneSociale}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Spesa</label>
                <select value={formData.categoriaSpesaId} onChange={e => setFormData({ ...formData, categoriaSpesaId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Seleziona...</option>
                  {settori.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imponibile (€) <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.01" value={formData.imponibile} onChange={e => handleImponibileIvaChange("imponibile", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aliquota IVA (%) <span className="text-red-500">*</span></label>
                <input type="number" min="0" max="100" step="0.01" value={formData.aliquotaIVA} onChange={e => handleImponibileIvaChange("aliquotaIVA", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Importo Totale (€) <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.01" value={formData.importoTotale} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero Documento</label>
                <input type="text" value={formData.numeroDocumento} onChange={e => setFormData({ ...formData, numeroDocumento: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Documento</label>
                <input type="date" value={formData.dataDocumento} onChange={e => setFormData({ ...formData, dataDocumento: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Scadenza</label>
                <input type="date" value={formData.dataScadenza} onChange={e => setFormData({ ...formData, dataScadenza: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stato Pagamento</label>
                <select value={formData.statoPagamento} onChange={e => setFormData({ ...formData, statoPagamento: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="Pagato">Pagato</option>
                  <option value="Da Pagare">Da Pagare</option>
                  <option value="In Scadenza">In Scadenza</option>
                  <option value="Contestato">Contestato</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metodo Pagamento</label>
                <select value={formData.metodoPagamento} onChange={e => setFormData({ ...formData, metodoPagamento: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="Bonifico">Bonifico</option>
                  <option value="Carta di Credito">Carta di Credito</option>
                  <option value="RID">RID</option>
                  <option value="Contanti">Contanti</option>
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" rows={2} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Annulla</button>
              <button type="submit" className="inline-flex items-center justify-center px-4 py-2 text-white rounded-md hover:opacity-90" style={{backgroundColor: '#8d9c71'}}><Save className="h-4 w-4 mr-2" />{editingId ? 'Modifica' : 'Salva'}</button>
            </div>
          </form>
            </div>
          )}
          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cerca per descrizione, oggetto, fornitore..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrizione</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oggetto</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornitore</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imponibile</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IVA %</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Totale</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Doc.</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
              <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={9} className="px-2 sm:px-4 py-4 text-center">Caricamento...</td></tr>
            ) : filteredAcquisti.length === 0 ? (
              <tr><td colSpan={9} className="px-2 sm:px-4 py-4 text-center">Nessun acquisto trovato</td></tr>
            ) : filteredAcquisti.map(a => (
              <tr key={a.id}>
                <td className="px-2 sm:px-4 py-4 text-sm text-gray-900">{a.descrizioneBreve}</td>
                <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{a.oggettoSpesa}</td>
                <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{fornitori.find(f => f.id === a.fornitoreId)?.ragioneSociale || '-'}</td>
                <td className="px-2 sm:px-4 py-4 text-sm text-gray-900">€ {a.imponibile.toFixed(2)}</td>
                <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{a.aliquotaIVA}%</td>
                <td className="px-2 sm:px-4 py-4 text-sm font-medium text-gray-900">€ {a.importoTotale.toFixed(2)}</td>
                <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{a.dataDocumento ? new Date(a.dataDocumento).toLocaleDateString() : '-'}</td>
                <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{a.statoPagamento}</td>
                <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleEdit(a)} title="Modifica" className="hover:text-blue-900 cursor-pointer p-1 rounded hover:bg-blue-50 w-8 h-8 flex items-center justify-center" style={{color: '#3b82f6'}}>
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(a.id)} title="Elimina" className="text-red-600 hover:text-red-900 cursor-pointer p-1 rounded hover:bg-red-50 w-8 h-8 flex items-center justify-center">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </div>
      </div>
    </div>
  );
  // Esporta Excel
  function handleExportExcel() {
    const data = filteredAcquisti.map(a => ({
      Descrizione: a.descrizioneBreve,
      Oggetto: a.oggettoSpesa,
      Fornitore: fornitori.find(f => f.id === a.fornitoreId)?.ragioneSociale || '-',
      Imponibile: a.imponibile,
      "Aliquota IVA": a.aliquotaIVA,
      "Totale": a.importoTotale,
      "Data Documento": a.dataDocumento ? new Date(a.dataDocumento).toLocaleDateString() : '-',
      "Stato Pagamento": a.statoPagamento
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Acquisti");
    XLSX.writeFile(wb, "acquisti.xlsx");
  }

  // Stampa
  function handlePrint() {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <h2>Acquisti</h2>
      <table border="1" style="border-collapse:collapse;width:100%">
        <thead>
          <tr>
            <th>Descrizione</th>
            <th>Oggetto</th>
            <th>Fornitore</th>
            <th>Imponibile</th>
            <th>IVA %</th>
            <th>Totale</th>
            <th>Data Doc.</th>
            <th>Stato</th>
          </tr>
        </thead>
        <tbody>
          ${filteredAcquisti.map(a => `
            <tr>
              <td>${a.descrizioneBreve}</td>
              <td>${a.oggettoSpesa}</td>
              <td>${fornitori.find(f => f.id === a.fornitoreId)?.ragioneSociale || '-'}</td>
              <td>€ ${a.imponibile.toFixed(2)}</td>
              <td>${a.aliquotaIVA}%</td>
              <td>€ ${a.importoTotale.toFixed(2)}</td>
              <td>${a.dataDocumento ? new Date(a.dataDocumento).toLocaleDateString() : '-'}</td>
              <td>${a.statoPagamento}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    const win = window.open('', '', 'width=900,height=700');
    if (win) {
      win.document.write('<html><head><title>Stampa Acquisti</title></head><body>');
      win.document.write(printContent.innerHTML);
      win.document.write('</body></html>');
      win.document.close();
      win.print();
    }
  }
}
