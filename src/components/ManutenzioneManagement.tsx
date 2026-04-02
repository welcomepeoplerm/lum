"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Manutenzione, Fornitore, Settore } from "@/types";
import { Plus, Edit2, Trash2, Save, X, Download, Printer, Wrench, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Spinner } from "@fluentui/react-components";
import * as XLSX from "xlsx";

const defaultForm = {
  descrizioneBreve: "",
  oggetto: "",
  fornitoreId: "",
  imponibile: 0,
  aliquotaIVA: 22,
  importoTotale: 0,
  numeroDocumento: "",
  dataInizio: "",
  dataFine: "",
  statoPagamento: "Da Pagare",
  metodoPagamento: "Bonifico",
  categoriaSpesaId: "",
  note: ""
};

export default function ManutenzioneManagement() {
  const [manutenzioni, setManutenzioni] = useState<Manutenzione[]>([]);
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
    loadManutenzioni();
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

  const loadManutenzioni = async () => {
    setLoading(true);
    const q = query(collection(db, "manutenzioni"), orderBy("dataInizio", "desc"));
    const snap = await getDocs(q);
    setManutenzioni(snap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(), 
      dataInizio: doc.data().dataInizio?.toDate?.() || new Date(), 
      dataFine: doc.data().dataFine?.toDate?.() || new Date() 
    }) as Manutenzione));
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
    if (!formData.descrizioneBreve.trim() || !formData.oggetto.trim() || !formData.fornitoreId || !formData.imponibile || !formData.aliquotaIVA || !formData.importoTotale || !formData.dataInizio || !formData.dataFine) {
      alert("Compila tutti i campi obbligatori (*)");
      return;
    }

    try {
      if (editingId) {
        // Modifica manutenzione esistente
        const manutenzioneCorrente = manutenzioni.find(m => m.id === editingId);
        
        const manutenzioneData: any = {
          ...formData,
          imponibile: Number(formData.imponibile),
          aliquotaIVA: Number(formData.aliquotaIVA),
          importoTotale: Number(formData.importoTotale),
          dataInizio: formData.dataInizio ? new Date(formData.dataInizio) : null,
          dataFine: formData.dataFine ? new Date(formData.dataFine) : null,
          scadenzaId: manutenzioneCorrente?.scadenzaId || null,
          userId: user.id
        };
        
        await updateDoc(doc(db, "manutenzioni", editingId), manutenzioneData);
        
        // Aggiorna anche la scadenza correlata se esiste
        if (manutenzioneCorrente?.scadenzaId) {
          const scadenzaData = {
            titolo: formData.oggetto,
            descrizione: "Scadenza importata da Manutenzioni",
            categoria: "manutenzione",
            dataScadenza: new Date(formData.dataFine),
            importo: Number(formData.importoTotale),
            note: formData.note || ""
          };
          
          await updateDoc(doc(db, "scadenze", manutenzioneCorrente.scadenzaId), scadenzaData);
        }
      } else {
        // Crea nuova manutenzione
        // Prima crea la scadenza
        const scadenzaData = {
          titolo: formData.oggetto,
          descrizione: "Scadenza importata da Manutenzioni",
          categoria: "manutenzione",
          dataScadenza: new Date(formData.dataFine),
          importo: Number(formData.importoTotale),
          ricorrente: false,
          frequenza: "mensile",
          priorita: "media",
          completata: false,
          dataCompletamento: null,
          note: formData.note || "",
          createdAt: new Date(),
          userId: user.id,
          emails: ["gozzolif@gmail.com"]
        };
        
        const scadenzaRef = await addDoc(collection(db, "scadenze"), scadenzaData);
        
        // Poi crea la manutenzione con l'ID della scadenza
        const manutenzioneData: any = {
          ...formData,
          imponibile: Number(formData.imponibile),
          aliquotaIVA: Number(formData.aliquotaIVA),
          importoTotale: Number(formData.importoTotale),
          dataInizio: formData.dataInizio ? new Date(formData.dataInizio) : null,
          dataFine: formData.dataFine ? new Date(formData.dataFine) : null,
          scadenzaId: scadenzaRef.id,
          createdAt: new Date(),
          userId: user.id
        };
        
        await addDoc(collection(db, "manutenzioni"), manutenzioneData);
      }
      
      resetForm();
      await loadManutenzioni();
    } catch (error) {
      console.error("Errore nel salvataggio manutenzione:", error);
      alert("Errore nel salvataggio: " + (error instanceof Error ? error.message : JSON.stringify(error)));
    }
  };

  const handleEdit = (man: Manutenzione) => {
    setEditingId(man.id);
    setFormData({
      ...man,
      dataInizio: man.dataInizio ? new Date(man.dataInizio).toISOString().slice(0, 10) : "",
      dataFine: man.dataFine ? new Date(man.dataFine).toISOString().slice(0, 10) : ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa manutenzione?")) return;
    try {
      // Trova la manutenzione da eliminare per ottenere l'ID della scadenza
      const manutenzione = manutenzioni.find(m => m.id === id);
      
      // Elimina la manutenzione
      await deleteDoc(doc(db, "manutenzioni", id));
      
      // Elimina anche la scadenza correlata se esiste
      if (manutenzione?.scadenzaId) {
        await deleteDoc(doc(db, "scadenze", manutenzione.scadenzaId));
      }
      
      await loadManutenzioni();
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
      alert("Errore nell'eliminazione");
    }
  };

  // Filtri base
  const filteredManutenzioni = manutenzioni.filter(m =>
    m.descrizioneBreve.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.oggetto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornitori.find(f => f.id === m.fornitoreId)?.ragioneSociale?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="h-full">
        {/* Card bianca contenitore principale */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6 min-h-[calc(100vh-12rem)]">
          {/* Header con titolo e pulsanti */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8" style={{color: '#2f5fdd'}} />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestione Manutenzioni</h1>
            </div>
            
            {/* Pulsanti azioni */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors ${showFilters ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                style={showFilters ? {backgroundColor: '#2f5fdd'} : {}}
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
                style={{backgroundColor: '#2f5fdd'}}
                onMouseEnter={e => (e.target as HTMLButtonElement).style.backgroundColor = '#244fbf'}
                onMouseLeave={e => (e.target as HTMLButtonElement).style.backgroundColor = '#2f5fdd'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuova Manutenzione
              </button>
            </div>
          </div>

          {/* Inline form sopra la lista */}
          {(showForm || editingId) && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{editingId ? 'Modifica Manutenzione' : 'Nuova Manutenzione'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Breve <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.descrizioneBreve} onChange={e => setFormData({ ...formData, descrizioneBreve: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Oggetto <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.oggetto} onChange={e => setFormData({ ...formData, oggetto: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornitore <span className="text-red-500">*</span></label>
                    <select value={formData.fornitoreId} onChange={e => handleFornitoreChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" required>
                      <option value="">Seleziona...</option>
                      {fornitori.map(f => <option key={f.id} value={f.id}>{f.ragioneSociale}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Spesa</label>
                    <select value={formData.categoriaSpesaId} onChange={e => setFormData({ ...formData, categoriaSpesaId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">Seleziona...</option>
                      {settori.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imponibile (€) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" step="0.01" value={formData.imponibile} onChange={e => handleImponibileIvaChange("imponibile", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aliquota IVA (%) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" max="100" step="0.01" value={formData.aliquotaIVA} onChange={e => handleImponibileIvaChange("aliquotaIVA", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Importo Totale (€) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" step="0.01" value={formData.importoTotale} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numero Documento</label>
                    <input type="text" value={formData.numeroDocumento} onChange={e => setFormData({ ...formData, numeroDocumento: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio <span className="text-red-500">*</span></label>
                    <input type="date" value={formData.dataInizio} onChange={e => setFormData({ ...formData, dataInizio: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine <span className="text-red-500">*</span></label>
                    <input type="date" value={formData.dataFine} onChange={e => setFormData({ ...formData, dataFine: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stato Pagamento</label>
                    <select value={formData.statoPagamento} onChange={e => setFormData({ ...formData, statoPagamento: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="Pagato">Pagato</option>
                      <option value="Da Pagare">Da Pagare</option>
                      <option value="In Scadenza">In Scadenza</option>
                      <option value="Contestato">Contestato</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metodo Pagamento</label>
                    <select value={formData.metodoPagamento} onChange={e => setFormData({ ...formData, metodoPagamento: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="Bonifico">Bonifico</option>
                      <option value="Carta di Credito">Carta di Credito</option>
                      <option value="RID">RID</option>
                      <option value="Contanti">Contanti</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                    <textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" rows={2} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Annulla</button>
                  <button type="submit" className="inline-flex items-center justify-center px-4 py-2 text-white rounded-md hover:opacity-90" style={{backgroundColor: '#2f5fdd'}}><Save className="h-4 w-4 mr-2" />{editingId ? 'Modifica' : 'Salva'}</button>
                </div>
              </form>
            </div>
          )}

          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cerca per descrizione, oggetto, fornitore..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
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
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Inizio</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Fine</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                  <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={10} className="px-2 sm:px-4 py-8 text-center"><Spinner label="Caricamento..." /></td></tr>
                ) : filteredManutenzioni.length === 0 ? (
                  <tr><td colSpan={10} className="px-2 sm:px-4 py-4 text-center">Nessuna manutenzione trovata</td></tr>
                ) : filteredManutenzioni.map(m => (
                  <tr key={m.id}>
                    <td className="px-2 sm:px-4 py-4 text-sm text-gray-900">{m.descrizioneBreve}</td>
                    <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{m.oggetto}</td>
                    <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{fornitori.find(f => f.id === m.fornitoreId)?.ragioneSociale || '-'}</td>
                    <td className="px-2 sm:px-4 py-4 text-sm text-gray-900">€ {m.imponibile.toFixed(2)}</td>
                    <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{m.aliquotaIVA}%</td>
                    <td className="px-2 sm:px-4 py-4 text-sm font-medium text-gray-900">€ {m.importoTotale.toFixed(2)}</td>
                    <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{m.dataInizio ? new Date(m.dataInizio).toLocaleDateString() : '-'}</td>
                    <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{m.dataFine ? new Date(m.dataFine).toLocaleDateString() : '-'}</td>
                    <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">{m.statoPagamento}</td>
                    <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEdit(m)} title="Modifica" className="hover:text-blue-900 cursor-pointer p-1 rounded hover:bg-blue-50 w-8 h-8 flex items-center justify-center" style={{color: '#3b82f6'}}>
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} title="Elimina" className="text-red-600 hover:text-red-900 cursor-pointer p-1 rounded hover:bg-red-50 w-8 h-8 flex items-center justify-center">
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
    const data = filteredManutenzioni.map(m => ({
      Descrizione: m.descrizioneBreve,
      Oggetto: m.oggetto,
      Fornitore: fornitori.find(f => f.id === m.fornitoreId)?.ragioneSociale || '-',
      Imponibile: m.imponibile,
      "Aliquota IVA": m.aliquotaIVA,
      "Totale": m.importoTotale,
      "Data Inizio": m.dataInizio ? new Date(m.dataInizio).toLocaleDateString() : '-',
      "Data Fine": m.dataFine ? new Date(m.dataFine).toLocaleDateString() : '-',
      "Stato Pagamento": m.statoPagamento
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Manutenzioni");
    XLSX.writeFile(wb, "manutenzioni.xlsx");
  }

  // Stampa
  function handlePrint() {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <h2>Manutenzioni</h2>
      <table border="1" style="border-collapse:collapse;width:100%">
        <thead>
          <tr>
            <th>Descrizione</th>
            <th>Oggetto</th>
            <th>Fornitore</th>
            <th>Imponibile</th>
            <th>IVA %</th>
            <th>Totale</th>
            <th>Data Inizio</th>
            <th>Data Fine</th>
            <th>Stato</th>
          </tr>
        </thead>
        <tbody>
          ${filteredManutenzioni.map(m => `
            <tr>
              <td>${m.descrizioneBreve}</td>
              <td>${m.oggetto}</td>
              <td>${fornitori.find(f => f.id === m.fornitoreId)?.ragioneSociale || '-'}</td>
              <td>€ ${m.imponibile.toFixed(2)}</td>
              <td>${m.aliquotaIVA}%</td>
              <td>€ ${m.importoTotale.toFixed(2)}</td>
              <td>${m.dataInizio ? new Date(m.dataInizio).toLocaleDateString() : '-'}</td>
              <td>${m.dataFine ? new Date(m.dataFine).toLocaleDateString() : '-'}</td>
              <td>${m.statoPagamento}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    const win = window.open('', '', 'width=900,height=700');
    if (win) {
      win.document.write('<html><head><title>Stampa Manutenzioni</title></head><body>');
      win.document.write(printContent.innerHTML);
      win.document.write('</body></html>');
      win.document.close();
      win.print();
    }
  }
}
