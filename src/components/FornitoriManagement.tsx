'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Fornitore, Settore } from '@/types';
import { Plus, Edit2, Trash2, Save, X, Download, Printer, Building, Search, Filter, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function FornitoriManagement() {
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [settori, setSettori] = useState<Settore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSettore, setFilterSettore] = useState('');
  const [filterAttivo, setFilterAttivo] = useState<'all' | 'attivi' | 'inattivi'>('all');
  const [formData, setFormData] = useState({
    ragioneSociale: '',
    settoreId: '',
    referente: '',
    telefono: '',
    mobile: '',
    email: '',
    sedeLegale: '',
    codiceFiscale: '',
    partitaIva: '',
    note: '',
    attivo: true
  });
  const { user } = useAuth();

  const loadSettori = async () => {
    try {
      const q = query(collection(db, 'settori'), orderBy('nome', 'asc'));
      const querySnapshot = await getDocs(q);
      const settoriData: Settore[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        settoriData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Settore);
      });
      
      setSettori(settoriData);
    } catch (error) {
      console.error('Errore nel caricamento dei settori:', error);
    }
  };

  const loadFornitori = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'fornitori'), orderBy('ragioneSociale', 'asc'));
      const querySnapshot = await getDocs(q);
      const fornitoriData: Fornitore[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fornitoriData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Fornitore);
      });
      
      setFornitori(fornitoriData);
    } catch (error) {
      console.error('Errore nel caricamento dei fornitori:', error);
      alert('Errore nel caricamento dei fornitori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettori();
    loadFornitori();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Validazione campi obbligatori
    if (!formData.ragioneSociale.trim() || !formData.settoreId || !formData.referente.trim() || !formData.email.trim()) {
      alert('Compila tutti i campi obbligatori (*)');
      return;
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Inserisci un indirizzo email valido');
      return;
    }

    try {
      const fornitoreData: any = {
        ragioneSociale: formData.ragioneSociale.trim(),
        settoreId: formData.settoreId,
        referente: formData.referente.trim(),
        email: formData.email.trim(),
        attivo: formData.attivo,
        userId: user.id
      };

      // Aggiungi solo i campi opzionali se hanno un valore
      if (formData.telefono.trim()) {
        fornitoreData.telefono = formData.telefono.trim();
      }
      if (formData.mobile.trim()) {
        fornitoreData.mobile = formData.mobile.trim();
      }
      if (formData.sedeLegale.trim()) {
        fornitoreData.sedeLegale = formData.sedeLegale.trim();
      }
      if (formData.codiceFiscale.trim()) {
        fornitoreData.codiceFiscale = formData.codiceFiscale.trim();
      }
      if (formData.partitaIva.trim()) {
        fornitoreData.partitaIva = formData.partitaIva.trim();
      }
      if (formData.note.trim()) {
        fornitoreData.note = formData.note.trim();
      }

      if (editingId) {
        // Modifica esistente
        const fornitoreRef = doc(db, 'fornitori', editingId);
        await updateDoc(fornitoreRef, fornitoreData);
      } else {
        // Nuovo fornitore
        await addDoc(collection(db, 'fornitori'), {
          ...fornitoreData,
          createdAt: new Date()
        });
      }
      
      setFormData({
        ragioneSociale: '',
        settoreId: '',
        referente: '',
        telefono: '',
        mobile: '',
        email: '',
        sedeLegale: '',
        codiceFiscale: '',
        partitaIva: '',
        note: '',
        attivo: true
      });
      setShowForm(false);
      setEditingId(null);
      await loadFornitori();
    } catch (error) {
      console.error('Errore nel salvare il fornitore:', error);
      alert('Errore nel salvare il fornitore');
    }
  };

  const handleEdit = (fornitore: Fornitore) => {
    setFormData({
      ragioneSociale: fornitore.ragioneSociale,
      settoreId: fornitore.settoreId,
      referente: fornitore.referente,
      telefono: fornitore.telefono || '',
      mobile: fornitore.mobile || '',
      email: fornitore.email,
      sedeLegale: fornitore.sedeLegale || '',
      codiceFiscale: fornitore.codiceFiscale || '',
      partitaIva: fornitore.partitaIva || '',
      note: fornitore.note || '',
      attivo: fornitore.attivo
    });
    setEditingId(fornitore.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo fornitore?')) return;

    try {
      await deleteDoc(doc(db, 'fornitori', id));
      await loadFornitori();
    } catch (error) {
      console.error('Errore nell\'eliminazione del fornitore:', error);
      alert('Errore nell\'eliminazione del fornitore');
    }
  };

  const resetForm = () => {
    setFormData({
      ragioneSociale: '',
      settoreId: '',
      referente: '',
      telefono: '',
      mobile: '',
      email: '',
      sedeLegale: '',
      codiceFiscale: '',
      partitaIva: '',
      note: '',
      attivo: true
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getSettoreNome = (settoreId: string) => {
    const settore = settori.find(s => s.id === settoreId);
    return settore ? settore.nome : 'N/A';
  };

  const openWhatsApp = (mobile: string, ragioneSociale: string) => {
    if (!mobile) {
      alert('Numero di cellulare non disponibile');
      return;
    }
    
    // Rimuovi spazi e caratteri speciali, mantieni solo numeri e +
    const cleanNumber = mobile.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Messaggio predefinito personalizzato
    const message = encodeURIComponent(`Buongiorno ${ragioneSociale}, `);
    
    // URL WhatsApp (formato internazionale)
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
    
    // Apri in nuova finestra
    window.open(whatsappUrl, '_blank');
  };

  const filteredFornitori = fornitori.filter((fornitore) => {
    const matchesSearch = 
      fornitore.ragioneSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornitore.referente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornitore.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSettore = !filterSettore || fornitore.settoreId === filterSettore;
    
    const matchesAttivo = 
      filterAttivo === 'all' || 
      (filterAttivo === 'attivi' && fornitore.attivo) ||
      (filterAttivo === 'inattivi' && !fornitore.attivo);

    return matchesSearch && matchesSettore && matchesAttivo;
  });

  const exportToExcel = () => {
    if (filteredFornitori.length === 0) {
      alert('Nessun dato da esportare');
      return;
    }

    const dataForExport = filteredFornitori.map((fornitore, index) => ({
      'N.': index + 1,
      'Ragione Sociale': fornitore.ragioneSociale,
      'Settore': getSettoreNome(fornitore.settoreId),
      'Referente': fornitore.referente,
      'Telefono': fornitore.telefono || '',
      'Mobile': fornitore.mobile || '',
      'Email': fornitore.email,
      'Sede Legale': fornitore.sedeLegale || '',
      'Codice Fiscale': fornitore.codiceFiscale || '',
      'Partita IVA': fornitore.partitaIva || '',
      'Note': fornitore.note || '',
      'Attivo': fornitore.attivo ? 'Sì' : 'No',
      'Data Creazione': fornitore.createdAt.toLocaleDateString('it-IT')
    }));

    // Aggiungi statistiche
    const stats = [
      { 'N.': '', 'Ragione Sociale': '', 'Settore': '', 'Referente': '', 'Telefono': '', 'Mobile': '', 'Email': '', 'Sede Legale': '', 'Codice Fiscale': '', 'Partita IVA': '', 'Note': '', 'Attivo': '', 'Data Creazione': '' },
      { 'N.': 'STATISTICHE', 'Ragione Sociale': '', 'Settore': '', 'Referente': '', 'Telefono': '', 'Mobile': '', 'Email': '', 'Sede Legale': '', 'Codice Fiscale': '', 'Partita IVA': '', 'Note': '', 'Attivo': '', 'Data Creazione': '' },
      { 'N.': 'Totale fornitori:', 'Ragione Sociale': filteredFornitori.length.toString(), 'Settore': '', 'Referente': '', 'Telefono': '', 'Mobile': '', 'Email': '', 'Sede Legale': '', 'Codice Fiscale': '', 'Partita IVA': '', 'Note': '', 'Attivo': '', 'Data Creazione': '' },
      { 'N.': 'Fornitori attivi:', 'Ragione Sociale': filteredFornitori.filter(f => f.attivo).length.toString(), 'Settore': '', 'Referente': '', 'Telefono': '', 'Mobile': '', 'Email': '', 'Sede Legale': '', 'Codice Fiscale': '', 'Partita IVA': '', 'Note': '', 'Attivo': '', 'Data Creazione': '' },
      { 'N.': 'Fornitori inattivi:', 'Ragione Sociale': filteredFornitori.filter(f => !f.attivo).length.toString(), 'Settore': '', 'Referente': '', 'Telefono': '', 'Mobile': '', 'Email': '', 'Sede Legale': '', 'Codice Fiscale': '', 'Partita IVA': '', 'Note': '', 'Attivo': '', 'Data Creazione': '' }
    ];

    const finalData = [...dataForExport, ...stats];

    const ws = XLSX.utils.json_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    
    // Imposta la larghezza delle colonne
    ws['!cols'] = [
      { wch: 5 },  // N.
      { wch: 30 }, // Ragione Sociale
      { wch: 15 }, // Settore
      { wch: 20 }, // Referente
      { wch: 15 }, // Telefono
      { wch: 15 }, // Mobile
      { wch: 25 }, // Email
      { wch: 30 }, // Sede Legale
      { wch: 16 }, // Codice Fiscale
      { wch: 16 }, // Partita IVA
      { wch: 30 }, // Note
      { wch: 8 },  // Attivo
      { wch: 15 }  // Data Creazione
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Fornitori');
    
    const fileName = `fornitori_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const printTable = () => {
    if (filteredFornitori.length === 0) {
      alert('Nessun dato da stampare');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fornitori - ${new Date().toLocaleDateString('it-IT')}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #8d9c71;
              padding-bottom: 10px;
            }
            .header h1 {
              color: #8d9c71;
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0 0 0;
              color: #666;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 30px;
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px 6px; 
              text-align: left; 
            }
            th { 
              background-color: #8d9c71; 
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            tr:hover { 
              background-color: #f5f5f5; 
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: bold;
            }
            .badge-attivo {
              background-color: #d4edda;
              color: #155724;
            }
            .badge-inattivo {
              background-color: #f8d7da;
              color: #721c24;
            }
            .stats {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #dee2e6;
            }
            .stats h3 {
              color: #8d9c71;
              margin-top: 0;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 15px;
            }
            .stat-item {
              background: white;
              padding: 10px 15px;
              border-radius: 5px;
              border-left: 4px solid #8d9c71;
            }
            .stat-value {
              font-size: 18px;
              font-weight: bold;
              color: #8d9c71;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
              margin-top: 2px;
            }
            @media print {
              body { margin: 0; }
              .header { page-break-after: avoid; }
              table { font-size: 9px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 Gestione Fornitori</h1>
            <p>Data stampa: ${new Date().toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%;">N.</th>
                <th style="width: 20%;">Ragione Sociale</th>
                <th style="width: 10%;">Settore</th>
                <th style="width: 12%;">Referente</th>
                <th style="width: 10%;">Telefono</th>
                <th style="width: 18%;">Email</th>
                <th style="width: 13%;">Codice Fiscale</th>
                <th style="width: 13%;">Partita IVA</th>
                <th style="width: 7%;">Stato</th>
              </tr>
            </thead>
            <tbody>
              ${filteredFornitori.map((fornitore, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${fornitore.ragioneSociale}</strong></td>
                  <td>${getSettoreNome(fornitore.settoreId)}</td>
                  <td>${fornitore.referente}</td>
                  <td>${fornitore.telefono || '-'}<br/>${fornitore.mobile || ''}</td>
                  <td>${fornitore.email}</td>
                  <td>${fornitore.codiceFiscale || '-'}</td>
                  <td>${fornitore.partitaIva || '-'}</td>
                  <td>
                    <span class="badge ${fornitore.attivo ? 'badge-attivo' : 'badge-inattivo'}">
                      ${fornitore.attivo ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="stats">
            <h3>📊 Riepilogo</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">${filteredFornitori.length}</div>
                <div class="stat-label">Fornitori totali</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${filteredFornitori.filter(f => f.attivo).length}</div>
                <div class="stat-label">Fornitori attivi</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${filteredFornitori.filter(f => !f.attivo).length}</div>
                <div class="stat-label">Fornitori inattivi</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Caricamento fornitori...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Fornitori</h1>
          <p className="text-gray-600">Gestisci i fornitori e i loro dati</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors cursor-pointer ${
              showFilters
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={showFilters ? {backgroundColor: '#8d9c71'} : {}}
            title="Filtri e ordinamento"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtri
            {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </button>
          
          <button
            onClick={exportToExcel}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors cursor-pointer"
            title="Esporta in Excel"
          >
            <Download className="h-4 w-4 mr-1" />
            Excel
          </button>
          
          <button
            onClick={printTable}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors cursor-pointer"
            title="Stampa tabella"
          >
            <Printer className="h-4 w-4 mr-1" />
            Stampa
          </button>
          
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm hover:opacity-90 transition-opacity cursor-pointer w-full sm:w-auto"
            style={{backgroundColor: '#8d9c71'}}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Fornitore
          </button>
        </div>
      </div>

      {/* Filtri */}
      {showFilters && (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Ricerca */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="inline h-4 w-4 mr-1" />
              Ricerca
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per ragione sociale, referente o email..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filtro Settore */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Settore
            </label>
            <select
              value={filterSettore}
              onChange={(e) => setFilterSettore(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tutti i settori</option>
              {settori.map((settore) => (
                <option key={settore.id} value={settore.id}>
                  {settore.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Stato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              value={filterAttivo}
              onChange={(e) => setFilterAttivo(e.target.value as 'all' | 'attivi' | 'inattivi')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="attivi">Solo attivi</option>
              <option value="inattivi">Solo inattivi</option>
            </select>
          </div>
        </div>

        {/* Info Risultati */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {filteredFornitori.length !== fornitori.length && (
                <span className="text-indigo-600 font-medium">
                  {filteredFornitori.length} di {fornitori.length} fornitori mostrati
                </span>
              )}
              {filteredFornitori.length === fornitori.length && (
                <span>
                  {fornitori.length} fornitori totali
                </span>
              )}
            </div>
            {(searchTerm || filterSettore || filterAttivo !== 'all') && (
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                Filtri attivi
              </span>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Tabella Fornitori */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ragione Sociale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Settore
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contatti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P.IVA / C.F.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFornitori.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Building className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">Nessun fornitore trovato</p>
                      <p className="text-sm text-gray-400">Clicca "Nuovo Fornitore" per aggiungerne uno</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFornitori.map((fornitore) => (
                  <tr key={fornitore.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleEdit(fornitore)}>
                      <div className="text-sm font-medium text-gray-900">
                        {fornitore.ragioneSociale}
                      </div>
                      {fornitore.sedeLegale && (
                        <div className="text-xs text-gray-500">{fornitore.sedeLegale}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getSettoreNome(fornitore.settoreId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{fornitore.referente}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{fornitore.email}</div>
                      {fornitore.telefono && (
                        <div className="text-xs text-gray-500">Tel: {fornitore.telefono}</div>
                      )}
                      {fornitore.mobile && (
                        <div className="text-xs text-gray-500">Mob: {fornitore.mobile}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {fornitore.partitaIva && (
                        <div className="text-sm text-gray-900">P.IVA: {fornitore.partitaIva}</div>
                      )}
                      {fornitore.codiceFiscale && (
                        <div className="text-xs text-gray-500">CF: {fornitore.codiceFiscale}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        fornitore.attivo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {fornitore.attivo ? 'Attivo' : 'Inattivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {fornitore.mobile && (
                          <button
                            onClick={() => openWhatsApp(fornitore.mobile!, fornitore.ragioneSociale)}
                            className="inline-flex items-center p-2 text-green-600 hover:text-green-900 cursor-pointer"
                            title="Invia messaggio WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(fornitore)}
                          className="inline-flex items-center p-2 text-indigo-600 hover:text-indigo-900 cursor-pointer"
                          title="Modifica"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fornitore.id)}
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

      {/* Form Modale */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium">
                {editingId ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ragione Sociale */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ragione Sociale <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ragioneSociale}
                    onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                    placeholder="Es. Rossi S.r.l."
                  />
                </div>

                {/* Settore */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Settore <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.settoreId}
                    onChange={(e) => setFormData({ ...formData, settoreId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Seleziona un settore</option>
                    {settori.map((settore) => (
                      <option key={settore.id} value={settore.id}>
                        {settore.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Referente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.referente}
                    onChange={(e) => setFormData({ ...formData, referente: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                    placeholder="Nome del referente"
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                    placeholder="email@esempio.it"
                  />
                </div>

                {/* Telefono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Es. 06 12345678"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Es. 333 1234567"
                  />
                </div>

                {/* Sede Legale */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sede Legale
                  </label>
                  <input
                    type="text"
                    value={formData.sedeLegale}
                    onChange={(e) => setFormData({ ...formData, sedeLegale: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Via, Città, CAP"
                  />
                </div>

                {/* Codice Fiscale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    value={formData.codiceFiscale}
                    onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="RSSMRA80A01H501X"
                    maxLength={16}
                  />
                </div>

                {/* Partita IVA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    value={formData.partitaIva}
                    onChange={(e) => setFormData({ ...formData, partitaIva: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="12345678901"
                    maxLength={11}
                  />
                </div>

                {/* Note */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Note aggiuntive..."
                  />
                </div>

                {/* Attivo */}
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.attivo}
                      onChange={(e) => setFormData({ ...formData, attivo: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Fornitore attivo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 text-white rounded-md hover:opacity-90"
                  style={{backgroundColor: '#8d9c71'}}
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
