'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Filter, Clock, AlertTriangle, CheckCircle, Euro, FileText, Zap, Wrench, Receipt, Grid, List as ListIcon, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Scadenza } from '../types';
import { useAuth } from '../hooks/useAuth';
import * as XLSX from 'xlsx';

interface ScadenzarioManagerProps {
  initialFilter?: string | null;
  onFilterChange?: () => void;
}

const ScadenzarioManager = ({ initialFilter = null, onFilterChange }: ScadenzarioManagerProps = {}) => {
  const { user } = useAuth();
  const [scadenze, setScadenze] = useState<Scadenza[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingScadenza, setEditingScadenza] = useState<Scadenza | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('tutte');
  const [filtroStato, setFiltroStato] = useState<string>('tutte');
  const [vistaCalendario, setVistaCalendario] = useState(false);
  const [meseCorrente, setMeseCorrente] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    categoria: 'bollette' as 'tributi' | 'bollette' | 'manutenzione' | 'documenti',
    dataScadenza: '',
    importo: '',
    ricorrente: false,
    frequenza: 'mensile' as 'mensile' | 'trimestrale' | 'semestrale' | 'annuale',
    priorita: 'media' as 'bassa' | 'media' | 'alta' | 'critica',
    note: '',
    emails: [''] // Nuovo campo: array di email
  });

  useEffect(() => {
    if (user) {
      loadScadenze();
    }
  }, [user]);

  // Gestire il filtro iniziale dalla dashboard
  useEffect(() => {
    if (initialFilter) {
      setFiltroStato(initialFilter);
      if (onFilterChange) {
        onFilterChange();
      }
    }
  }, [initialFilter, onFilterChange]);

  const loadScadenze = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, 'scadenze'),
        orderBy('dataScadenza', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const scadenzeData: Scadenza[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scadenzeData.push({
          id: doc.id,
          titolo: data.titolo || '',
          descrizione: data.descrizione || '',
          categoria: data.categoria || 'bollette',
          dataScadenza: data.dataScadenza ? data.dataScadenza.toDate() : new Date(),
          importo: data.importo || 0,
          ricorrente: data.ricorrente || false,
          frequenza: data.frequenza || 'mensile',
          priorita: data.priorita || 'media',
          completata: data.completata || false,
          dataCompletamento: data.dataCompletamento ? data.dataCompletamento.toDate() : null,
          note: data.note || '',
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          userId: data.userId || user.id,
          emails: data.emails || []
        });
      });
      
      setScadenze(scadenzeData);
    } catch (error) {
      console.error('Errore nel caricamento delle scadenze:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titolo: '',
      descrizione: '',
      categoria: 'bollette',
      dataScadenza: '',
      importo: '',
      ricorrente: false,
      frequenza: 'mensile',
      priorita: 'media',
      note: '',
      emails: ['']
    });
    setEditingScadenza(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.titolo.trim() || !formData.dataScadenza) return;

    try {
      const scadenzaData = {
        titolo: formData.titolo.trim(),
        descrizione: formData.descrizione.trim(),
        categoria: formData.categoria,
        dataScadenza: new Date(formData.dataScadenza),
        importo: parseFloat(formData.importo) || 0,
        ricorrente: formData.ricorrente,
        frequenza: formData.frequenza,
        priorita: formData.priorita,
        completata: false,
        dataCompletamento: null,
        note: formData.note.trim(),
        createdAt: new Date(),
        userId: user.id,
        emails: formData.emails.filter(e => e && e.trim() !== '')
      };

      if (editingScadenza) {
        await updateDoc(doc(db, 'scadenze', editingScadenza.id), scadenzaData);
      } else {
        await addDoc(collection(db, 'scadenze'), scadenzaData);
      }

      await loadScadenze();
      resetForm();
    } catch (error) {
      console.error('Errore nel salvataggio della scadenza:', error);
    }
  };

  const toggleCompletata = async (scadenza: Scadenza) => {
    try {
      const updatedData = {
        completata: !scadenza.completata,
        dataCompletamento: !scadenza.completata ? new Date() : null
      };
      
      await updateDoc(doc(db, 'scadenze', scadenza.id), updatedData);
      await loadScadenze();
    } catch (error) {
      console.error('Errore nell\'aggiornamento della scadenza:', error);
    }
  };

  const deleteScadenza = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa scadenza?')) return;
    
    try {
      await deleteDoc(doc(db, 'scadenze', id));
      await loadScadenze();
    } catch (error) {
      console.error('Errore nell\'eliminazione della scadenza:', error);
    }
  };

  const editScadenza = (scadenza: Scadenza) => {
    setFormData({
      titolo: scadenza.titolo,
      descrizione: scadenza.descrizione || '',
      categoria: scadenza.categoria,
      dataScadenza: scadenza.dataScadenza.toISOString().split('T')[0],
      importo: scadenza.importo?.toString() || '',
      ricorrente: scadenza.ricorrente,
      frequenza: scadenza.frequenza || 'mensile',
      priorita: scadenza.priorita,
      note: scadenza.note || '',
      emails: scadenza.emails && scadenza.emails.length > 0 ? scadenza.emails : ['']
    });
                {/* Email utenti associati */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utendi da avvisare:
                  </label>
                  {formData.emails.map((email, idx) => (
                    <div key={idx} className="flex items-center mb-2">
                      <input
                        type="email"
                        value={email}
                        onChange={e => {
                          const newEmails = [...formData.emails];
                          newEmails[idx] = e.target.value;
                          setFormData({ ...formData, emails: newEmails });
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Email utente"
                      />
                      <button
                        type="button"
                        className="ml-2 px-2 py-1 text-sm text-white bg-red-500 rounded cursor-pointer"
                        onClick={() => {
                          const newEmails = formData.emails.filter((_, i) => i !== idx);
                          setFormData({ ...formData, emails: newEmails.length ? newEmails : [''] });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-1 px-3 py-1 text-sm text-white bg-green-600 rounded cursor-pointer"
                    onClick={() => setFormData({ ...formData, emails: [...formData.emails, ''] })}
                  >
                    + Aggiungi email
                  </button>
                </div>
    setEditingScadenza(scadenza);
    setShowForm(true);
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'tributi': return Receipt;
      case 'bollette': return Zap;
      case 'manutenzione': return Wrench;
      case 'documenti': return FileText;
      default: return Calendar;
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'tributi': return '#d17f3d';
      case 'bollette': return '#8d9c71';
      case 'manutenzione': return '#46433c';
      case 'documenti': return '#6366f1';
      default: return '#6b7280';
    }
  };

  const getPrioritaColor = (priorita: string) => {
    switch (priorita) {
      case 'critica': return '#dc2626';
      case 'alta': return '#ea580c';
      case 'media': return '#d97706';
      case 'bassa': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const isScadenzaImminente = (dataScadenza: Date) => {
    const oggi = new Date();
    const diffDays = Math.ceil((dataScadenza.getTime() - oggi.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isScadenzaScaduta = (dataScadenza: Date) => {
    const oggi = new Date();
    return dataScadenza < oggi;
  };

  const scadenzeFiltrate = scadenze.filter(scadenza => {
    const filtroCategOk = filtroCategoria === 'tutte' || scadenza.categoria === filtroCategoria;
    const filtroStatoOk = filtroStato === 'tutte' || 
      (filtroStato === 'completate' && scadenza.completata) ||
      (filtroStato === 'pending' && !scadenza.completata) ||
      (filtroStato === 'imminenti' && !scadenza.completata && isScadenzaImminente(scadenza.dataScadenza) && !isScadenzaScaduta(scadenza.dataScadenza)) ||
      (filtroStato === 'scadute' && !scadenza.completata && isScadenzaScaduta(scadenza.dataScadenza));
    
    return filtroCategOk && filtroStatoOk;
  });

  const scadenzeImminenti = scadenze.filter(s => !s.completata && isScadenzaImminente(s.dataScadenza) && !isScadenzaScaduta(s.dataScadenza));
  const scadenzeScadute = scadenze.filter(s => !s.completata && isScadenzaScaduta(s.dataScadenza));

  // Funzioni per il calendario
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Lunedì = 0
  };

  const getScadenzePerGiorno = (giorno: number) => {
    const dataGiorno = new Date(meseCorrente.getFullYear(), meseCorrente.getMonth(), giorno);
    return scadenze.filter(scadenza => {
      const scadenzaData = new Date(scadenza.dataScadenza);
      return scadenzaData.getDate() === giorno &&
             scadenzaData.getMonth() === dataGiorno.getMonth() &&
             scadenzaData.getFullYear() === dataGiorno.getFullYear();
    });
  };

  const navigaMese = (direzione: 'precedente' | 'successivo') => {
    const nuovoMese = new Date(meseCorrente);
    if (direzione === 'precedente') {
      nuovoMese.setMonth(nuovoMese.getMonth() - 1);
    } else {
      nuovoMese.setMonth(nuovoMese.getMonth() + 1);
    }
    setMeseCorrente(nuovoMese);
  };

  // Funzione per esportare in Excel
  const exportToExcel = () => {
    try {
      // Prepara i dati per l'export con filtri applicati
      const exportData = scadenzeFiltrate.map((scadenza, index) => {
        const categoriaLabels = {
          'tributi': 'Tributi',
          'bollette': 'Bollette',
          'manutenzione': 'Manutenzione',
          'documenti': 'Documenti'
        };
        
        const prioritaLabels = {
          'alta': 'Alta',
          'media': 'Media',
          'bassa': 'Bassa'
        };

        return {
          'N.': index + 1,
          'Titolo': scadenza.titolo,
          'Descrizione': scadenza.descrizione || '',
          'Categoria': categoriaLabels[scadenza.categoria as keyof typeof categoriaLabels] || scadenza.categoria,
          'Data Scadenza': scadenza.dataScadenza.toLocaleDateString('it-IT'),
          'Importo (€)': scadenza.importo ? scadenza.importo.toFixed(2) : '',
          'Priorità': prioritaLabels[scadenza.priorita as keyof typeof prioritaLabels] || scadenza.priorita,
          'Ricorrente': scadenza.ricorrente ? 'Sì' : 'No',
          'Frequenza': scadenza.ricorrente ? (scadenza.frequenza || 'mensile') : '',
          'Completata': scadenza.completata ? 'Sì' : 'No',
          'Data Completamento': scadenza.completata && scadenza.dataCompletamento 
            ? scadenza.dataCompletamento.toLocaleDateString('it-IT') 
            : '',
          'Note': scadenza.note || ''
        };
      });

      // Crea il workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Imposta la larghezza delle colonne
      const columnWidths = [
        { wch: 5 },   // N.
        { wch: 25 },  // Titolo
        { wch: 30 },  // Descrizione
        { wch: 12 },  // Categoria
        { wch: 12 },  // Data Scadenza
        { wch: 10 },  // Importo
        { wch: 8 },   // Priorità
        { wch: 10 },  // Ricorrente
        { wch: 10 },  // Frequenza
        { wch: 10 },  // Completata
        { wch: 15 },  // Data Completamento
        { wch: 25 }   // Note
      ];
      worksheet['!cols'] = columnWidths;

      // Aggiunge il worksheet al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Scadenzario');

      // Genera il nome del file con data corrente
      const now = new Date();
      const fileName = `Scadenzario_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

      // Scarica il file
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Errore durante l\'export Excel:', error);
      alert('Errore durante l\'esportazione. Riprova più tardi.');
    }
  };

  // Funzione per stampare la tabella
  const printTable = () => {
    try {
      // Calcola statistiche per il riepilogo
      const totaleCompletate = scadenzeFiltrate.filter(s => s.completata).length;
      const totaleImminenti = scadenzeFiltrate.filter(s => !s.completata && isScadenzaImminente(s.dataScadenza)).length;
      const totaleScadute = scadenzeFiltrate.filter(s => !s.completata && isScadenzaScaduta(s.dataScadenza)).length;
      const totaleImporto = scadenzeFiltrate.reduce((sum, s) => sum + (s.importo || 0), 0);

      let printContent = `
        <html>
          <head>
            <title>Scadenzario - ${new Date().toLocaleDateString('it-IT')}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; color: #8d9c71; margin-bottom: 30px; }
              .info { text-align: center; margin-bottom: 20px; color: #666; }
              .summary { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
              .summary-item { text-align: center; }
              .summary-value { font-size: 18px; font-weight: bold; }
              .summary-label { font-size: 12px; color: #666; }
              .completate { color: #16a34a; }
              .imminenti { color: #f59e0b; }
              .scadute { color: #dc2626; }
              .importo-totale { color: #8d9c71; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
              th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .categoria-tributi { background-color: #fef3f2; color: #b45309; }
              .categoria-bollette { background-color: #f0f9f0; color: #166534; }
              .categoria-manutenzione { background-color: #fef9c3; color: #a16207; }
              .categoria-documenti { background-color: #eff6ff; color: #1d4ed8; }
              .completata { background-color: #f0f9f0; }
              .scaduta { background-color: #fef2f2; }
              .imminente { background-color: #fffbeb; }
              .priorita-alta { color: #dc2626; font-weight: bold; }
              .priorita-media { color: #f59e0b; }
              .priorita-bassa { color: #16a34a; }
              .centro { text-align: center; }
              .importo { text-align: right; font-weight: bold; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>📅 Scadenzario</h1>
            <div class="info">
              Stampato il: ${new Date().toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} | Totale scadenze: ${scadenzeFiltrate.length}
            </div>
            
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-value completate">${totaleCompletate}</div>
                  <div class="summary-label">Completate</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value imminenti">${totaleImminenti}</div>
                  <div class="summary-label">Imminenti</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value scadute">${totaleScadute}</div>
                  <div class="summary-label">Scadute</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value importo-totale">€${totaleImporto.toFixed(2)}</div>
                  <div class="summary-label">Importo Totale</div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>N.</th>
                  <th>Titolo</th>
                  <th>Categoria</th>
                  <th>Data Scadenza</th>
                  <th>Importo</th>
                  <th>Priorità</th>
                  <th>Stato</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
      `;

      scadenzeFiltrate.forEach((scadenza, index) => {
        const statusClass = scadenza.completata ? 'completata' : 
          (isScadenzaScaduta(scadenza.dataScadenza) ? 'scaduta' : 
          (isScadenzaImminente(scadenza.dataScadenza) ? 'imminente' : ''));
        
        const categoriaClass = `categoria-${scadenza.categoria}`;
        const prioritaClass = `priorita-${scadenza.priorita}`;
        
        printContent += `
          <tr class="${statusClass}">
            <td class="centro">${index + 1}</td>
            <td><strong>${scadenza.titolo}</strong></td>
            <td class="${categoriaClass} centro">${scadenza.categoria.toUpperCase()}</td>
            <td class="centro">${scadenza.dataScadenza.toLocaleDateString('it-IT')}</td>
            <td class="importo">${scadenza.importo ? '€' + scadenza.importo.toFixed(2) : '-'}</td>
            <td class="${prioritaClass} centro">${scadenza.priorita.toUpperCase()}</td>
            <td class="centro">${scadenza.completata ? '✅ COMPLETATA' : 
              (isScadenzaScaduta(scadenza.dataScadenza) ? '🔴 SCADUTA' : 
              (isScadenzaImminente(scadenza.dataScadenza) ? '⚠️ IMMINENTE' : '⏳ IN SOSPESO'))}</td>
            <td>${scadenza.note || ''}</td>
          </tr>
        `;
      });

      printContent += `
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Apri una nuova finestra per la stampa
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Attendi che il contenuto sia caricato poi stampa
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      } else {
        alert('Impossibile aprire la finestra di stampa. Controlla se i popup sono bloccati.');
      }

    } catch (error) {
      console.error('Errore durante la stampa:', error);
      alert('Errore durante la preparazione della stampa. Riprova più tardi.');
    }
  };

  const renderCalendario = () => {
    const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    const daysInMonth = getDaysInMonth(meseCorrente);
    const firstDayOfMonth = getFirstDayOfMonth(meseCorrente);
    const today = new Date();
    
    const calendarDays = [];
    
    // Giorni vuoti all'inizio
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="h-20 border border-gray-100"></div>
      );
    }
    
    // Giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      const scadenzeGiorno = getScadenzePerGiorno(day);
      const isToday = today.getDate() === day && 
                      today.getMonth() === meseCorrente.getMonth() && 
                      today.getFullYear() === meseCorrente.getFullYear();
      
      calendarDays.push(
        <div key={day} className={`h-20 border border-gray-100 p-1 ${isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {scadenzeGiorno.slice(0, 2).map((scadenza) => {
              const IconComponent = getCategoriaIcon(scadenza.categoria);
              return (
                <div
                  key={scadenza.id}
                  onClick={() => editScadenza(scadenza)}
                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center ${
                    scadenza.completata ? 'bg-green-100 text-green-800' :
                    isScadenzaScaduta(scadenza.dataScadenza) ? 'bg-red-100 text-red-800' :
                    isScadenzaImminente(scadenza.dataScadenza) ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}
                  title={`${scadenza.titolo} - ${scadenza.categoria}`}
                >
                  <IconComponent className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{scadenza.titolo}</span>
                </div>
              );
            })}
            {scadenzeGiorno.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{scadenzeGiorno.length - 2} altro/i
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return calendarDays;
  };

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8" style={{color: '#8d9c71'}} />
            <div className="ml-3">
              <h1 className="text-2xl font-bold" style={{color: '#46433c'}}>Scadenzario</h1>
              <p className="text-sm" style={{color: '#8d9c71'}}>Gestione scadenze e promemoria</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 p-1" style={{backgroundColor: '#f9f9f9'}}>
              <button
                onClick={() => setVistaCalendario(false)}
                className={`flex items-center justify-center px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer flex-1 ${
                  !vistaCalendario 
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{backgroundColor: !vistaCalendario ? '#8d9c71' : 'transparent'}}
              >
                <ListIcon className="h-4 w-4 mr-1" />
                Lista
              </button>
              <button
                onClick={() => setVistaCalendario(true)}
                className={`flex items-center justify-center px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer flex-1 ${
                  vistaCalendario 
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{backgroundColor: vistaCalendario ? '#8d9c71' : 'transparent'}}
              >
                <Grid className="h-4 w-4 mr-1" />
                Calendario
              </button>
            </div>
            
            <button
              onClick={exportToExcel}
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              title="Esporta in Excel"
            >
              <Download className="h-4 w-4 mr-1" />
              Excel
            </button>
            
            <button
              onClick={printTable}
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
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
              Nuova Scadenza
            </button>
          </div>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border" style={{backgroundColor: '#fef3f2', borderColor: '#fecaca'}}>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5" style={{color: '#dc2626'}} />
              <div className="ml-2">
                <p className="text-xs text-gray-600">Scadute</p>
                <p className="text-lg font-semibold" style={{color: '#dc2626'}}>{scadenzeScadute.length}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border" style={{backgroundColor: '#fffbeb', borderColor: '#fed7aa'}}>
            <div className="flex items-center">
              <Clock className="h-5 w-5" style={{color: '#d97706'}} />
              <div className="ml-2">
                <p className="text-xs text-gray-600">Imminenti</p>
                <p className="text-lg font-semibold" style={{color: '#d97706'}}>{scadenzeImminenti.length}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border" style={{backgroundColor: '#f0f9ff', borderColor: '#bae6fd'}}>
            <div className="flex items-center">
              <Calendar className="h-5 w-5" style={{color: '#0369a1'}} />
              <div className="ml-2">
                <p className="text-xs text-gray-600">Totali</p>
                <p className="text-lg font-semibold" style={{color: '#0369a1'}}>{scadenze.length}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border" style={{backgroundColor: '#f0fdf4', borderColor: '#bbf7d0'}}>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5" style={{color: '#16a34a'}} />
              <div className="ml-2">
                <p className="text-xs text-gray-600">Completate</p>
                <p className="text-lg font-semibold" style={{color: '#16a34a'}}>
                  {scadenze.filter(s => s.completata).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtri:</span>
          </div>
          
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="text-sm border-gray-300 rounded-md"
          >
            <option value="tutte">Tutte le categorie</option>
            <option value="tributi">Tributi</option>
            <option value="bollette">Bollette</option>
            <option value="manutenzione">Manutenzione</option>
            <option value="documenti">Documenti</option>
          </select>
          
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="text-sm border-gray-300 rounded-md"
          >
            <option value="tutte">Tutti gli stati</option>
            <option value="pending">Da completare</option>
            <option value="imminenti">Imminenti (7 giorni)</option>
            <option value="scadute">Scadute</option>
            <option value="completate">Completate</option>
          </select>
        </div>
      </div>

      {/* Form nuova/modifica scadenza */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium" style={{color: '#46433c'}}>
              {editingScadenza ? 'Modifica Scadenza' : 'Nuova Scadenza'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="tributi">Tributi</option>
                  <option value="bollette">Bollette</option>
                  <option value="manutenzione">Manutenzione</option>
                  <option value="documenti">Documenti</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Scadenza *
                </label>
                <input
                  type="date"
                  value={formData.dataScadenza}
                  onChange={(e) => setFormData({ ...formData, dataScadenza: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importo €
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.importo}
                  onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorità
                </label>
                <select
                  value={formData.priorita}
                  onChange={(e) => setFormData({ ...formData, priorita: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="bassa">Bassa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Critica</option>
                </select>
              </div>
            </div>

            {/* Sezione Ricorrente - fuori dal grid */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              border: '2px solid #e5e7eb'
            }}>
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFormData({ ...formData, ricorrente: !formData.ricorrente });
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #8d9c71',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: formData.ricorrente ? '#8d9c71' : 'white'
                }}>
                  {formData.ricorrente && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <span style={{ 
                  userSelect: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Scadenza Ricorrente
                </span>
              </div>
                
              {formData.ricorrente && (
                <div style={{ marginTop: '12px', marginLeft: '32px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Frequenza
                  </label>
                  <select
                    value={formData.frequenza}
                    onChange={(e) => setFormData({ ...formData, frequenza: e.target.value as any })}
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      width: '200px'
                    }}
                  >
                    <option value="mensile">Mensile</option>
                    <option value="trimestrale">Trimestrale</option>
                    <option value="semestrale">Semestrale</option>
                    <option value="annuale">Annuale</option>
                  </select>
                </div>
              )}
            </div>

            {/* Email utenti associati */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Utendi da avvisare:
              </label>
              {formData.emails.map((email, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      const newEmails = [...formData.emails];
                      newEmails[idx] = e.target.value;
                      setFormData({ ...formData, emails: newEmails });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Email utente"
                  />
                  <button
                    type="button"
                    className="ml-2 px-2 py-1 text-sm text-white bg-red-500 rounded cursor-pointer"
                    onClick={() => {
                      const newEmails = formData.emails.filter((_, i) => i !== idx);
                      setFormData({ ...formData, emails: newEmails.length ? newEmails : [''] });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="mt-1 px-3 py-1 text-sm text-white bg-green-600 rounded cursor-pointer"
                onClick={() => setFormData({ ...formData, emails: [...formData.emails, ''] })}
              >
                + Aggiungi email
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <textarea
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity cursor-pointer"
                style={{backgroundColor: '#8d9c71'}}
              >
                {editingScadenza ? 'Aggiorna' : 'Salva'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vista Calendario o Lista */}
      {vistaCalendario ? (
        /* Vista Calendario */
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium" style={{color: '#46433c'}}>
                Calendario Scadenze
              </h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigaMese('precedente')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="text-lg font-semibold" style={{color: '#46433c'}}>
                  {meseCorrente.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </div>
                
                <button
                  onClick={() => navigaMese('successivo')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Header giorni della settimana */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((giorno) => (
                <div key={giorno} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500 bg-gray-50">
                  {giorno}
                </div>
              ))}
            </div>
            
            {/* Griglia calendario */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {renderCalendario()}
            </div>
            
            {/* Legenda */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-2"></div>
                <span className="text-gray-600">Scadute</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded mr-2"></div>
                <span className="text-gray-600">Imminenti</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-2"></div>
                <span className="text-gray-600">Future</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
                <span className="text-gray-600">Completate</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded mr-2"></div>
                <span className="text-gray-600">Oggi</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Vista Lista */
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium" style={{color: '#46433c'}}>
              Elenco Scadenze ({scadenzeFiltrate.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                Caricamento scadenze...
              </div>
            ) : scadenzeFiltrate.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nessuna scadenza trovata
              </div>
            ) : (
              scadenzeFiltrate.map((scadenza) => {
                const IconComponent = getCategoriaIcon(scadenza.categoria);
                const isImminente = isScadenzaImminente(scadenza.dataScadenza);
                const isScaduta = isScadenzaScaduta(scadenza.dataScadenza);
                
                return (
                  <div key={scadenza.id} className={`p-6 hover:bg-gray-50 ${scadenza.completata ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <IconComponent 
                            className="h-8 w-8" 
                            style={{color: getCategoriaColor(scadenza.categoria)}}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-lg font-medium ${scadenza.completata ? 'line-through text-gray-500' : ''}`} 
                                style={{color: scadenza.completata ? '#6b7280' : '#46433c'}}>
                              {scadenza.titolo}
                            </h4>
                            
                            {/* Badge priorità */}
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{backgroundColor: getPrioritaColor(scadenza.priorita)}}
                            >
                              {scadenza.priorita.charAt(0).toUpperCase() + scadenza.priorita.slice(1)}
                            </span>
                            
                            {/* Badge stato */}
                            {!scadenza.completata && isScaduta && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white bg-red-600">
                                SCADUTA
                              </span>
                            )}
                            {!scadenza.completata && isImminente && !isScaduta && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white bg-orange-500">
                                IMMINENTE
                              </span>
                            )}
                            {scadenza.completata && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white bg-green-600">
                                COMPLETATA
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                            <span>📅 {scadenza.dataScadenza.toLocaleDateString('it-IT')}</span>
                            {scadenza.importo && scadenza.importo > 0 && (
                              <span className="flex items-center">
                                <Euro className="h-3 w-3 mr-1" />
                                {scadenza.importo.toFixed(2)}
                              </span>
                            )}
                            <span className="capitalize">
                              📂 {scadenza.categoria}
                            </span>
                            {scadenza.ricorrente && (
                              <span>🔄 {scadenza.frequenza}</span>
                            )}
                          </div>
                          
                          {scadenza.descrizione && (
                            <p className="mt-2 text-sm text-gray-600">{scadenza.descrizione}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCompletata(scadenza)}
                          className={`p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer ${
                            scadenza.completata ? 'text-green-600' : 'text-gray-400'
                          }`}
                          title={scadenza.completata ? 'Segna come non completata' : 'Segna come completata'}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => editScadenza(scadenza)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                          title="Modifica"
                        >
                          ✏️
                        </button>
                        
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => deleteScadenza(scadenza.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            title="Elimina"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScadenzarioManager;