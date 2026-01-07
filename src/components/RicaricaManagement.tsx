'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Ricarica } from '@/types';
import { Plus, Trash2, Edit, Save, X, Droplets, ChevronUp, ChevronDown, Calendar, Filter, Search, Download, Printer } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';

interface RicaricaFormData {
  dataRicarica: string; // Input type="date" returns string
  litriRicarica: number;
  importoRicaricato: number;
  indicatoreRicarica: number;
  indicatoreRicaricato: number;
  pagato: boolean;
}

export default function RicaricaManagement() {
  const [ricariche, setRicariche] = useState<Ricarica[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Stati per filtri e ordinamento
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnno, setFilterAnno] = useState('');
  const [filterImporto, setFilterImporto] = useState('');
  const [filterPagato, setFilterPagato] = useState('');
  const [sortField, setSortField] = useState<string>('dataRicarica');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const { user } = useAuth();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<RicaricaFormData>();

  // Watch fields for calculation
  const indicatoreRicarica = watch('indicatoreRicarica');
  const indicatoreRicaricato = watch('indicatoreRicaricato');
  const diffRicaricata = (Number(indicatoreRicaricato) || 0) - (Number(indicatoreRicarica) || 0);

  // Sort and paginate data
  const filteredAndSortedRicariche = ricariche
    .filter(ricarica => {
      // Filtro anno
      if (filterAnno && ricarica.dataRicarica.getFullYear().toString() !== filterAnno) {
        return false;
      }
      // Filtro importo (range)
      if (filterImporto) {
        const importo = ricarica.importoRicaricato;
        switch (filterImporto) {
          case 'basso':
            if (importo >= 100) return false;
            break;
          case 'medio':
            if (importo < 100 || importo >= 500) return false;
            break;
          case 'alto':
            if (importo < 500) return false;
            break;
        }
      }
      // Filtro pagato
      if (filterPagato === 'si' && !ricarica.pagato) return false;
      if (filterPagato === 'no' && ricarica.pagato) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'dataRicarica':
          aValue = a.dataRicarica.getTime();
          bValue = b.dataRicarica.getTime();
          break;
        case 'litriRicarica':
          aValue = a.litriRicarica;
          bValue = b.litriRicarica;
          break;
        case 'importoRicaricato':
          aValue = a.importoRicaricato;
          bValue = b.importoRicaricato;
          break;
        case 'indicatoreRicarica':
          aValue = a.indicatoreRicarica;
          bValue = b.indicatoreRicarica;
          break;
        case 'indicatoreRicaricato':
          aValue = a.indicatoreRicaricato;
          bValue = b.indicatoreRicaricato;
          break;
        case 'diffRicaricata':
          aValue = a.diffRicaricata;
          bValue = b.diffRicaricata;
          break;
        case 'pagato':
          aValue = a.pagato ? 1 : 0;
          bValue = b.pagato ? 1 : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Calcoli per la paginazione sui dati filtrati
  const totalPages = Math.ceil(filteredAndSortedRicariche.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRicariche = filteredAndSortedRicariche.slice(startIndex, endIndex);

  // Funzione per resettare filtri
  const clearFilters = () => {
    setFilterAnno('');
    setFilterImporto('');
    setFilterPagato('');
    setSortField('dataRicarica');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  // Get unique years from ricariche for filter dropdown
  const availableYears = [...new Set(ricariche.map(r => r.dataRicarica.getFullYear()))].sort((a, b) => b - a);

  // Funzione per gestire l'ordinamento da click su colonna
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Componente per intestazione colonna ordinabile
  const SortableHeader = ({ field, children, className = '' }: { field: string; children: React.ReactNode; className?: string }) => {
    const isActive = sortField === field;
    return (
      <th 
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
        onClick={() => handleSort(field)}
        title={`Ordina per ${children}`}
      >
        <div className="flex items-center space-x-1">
          <span>{children}</span>
          <div className="flex flex-col">
            <ChevronUp className={`h-3 w-3 ${isActive && sortDirection === 'asc' ? '' : 'text-gray-300'}`} style={isActive && sortDirection === 'asc' ? {color: '#8d9c71'} : {}} />
            <ChevronDown className={`h-3 w-3 -mt-1 ${isActive && sortDirection === 'desc' ? '' : 'text-gray-300'}`} style={isActive && sortDirection === 'desc' ? {color: '#8d9c71'} : {}} />
          </div>
        </div>
      </th>
    );
  };

  // Funzioni di navigazione
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  useEffect(() => {
    if (user) {
      loadRicariche();
    }
  }, [user]);

  // Reset alla prima pagina quando i dati filtrati cambiano
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredAndSortedRicariche.length, totalPages, currentPage]);

  const loadRicariche = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'ricariche'), orderBy('dataRicarica', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const data: Ricarica[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        data.push({
          id: doc.id,
          dataRicarica: d.dataRicarica.toDate(),
          litriRicarica: d.litriRicarica,
          importoRicaricato: d.importoRicaricato,
          indicatoreRicarica: d.indicatoreRicarica,
          indicatoreRicaricato: d.indicatoreRicaricato,
          diffRicaricata: d.diffRicaricata || (d.indicatoreRicaricato - d.indicatoreRicarica),
          pagato: d.pagato || false,
          dataPagamento: d.dataPagamento ? d.dataPagamento.toDate() : null,
          createdAt: d.createdAt.toDate(),
          userId: d.userId
        });
      });
      
      setRicariche(data);
    } catch (error) {
      console.error('Errore nel caricamento delle ricariche:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RicaricaFormData) => {
    if (!user) return;

    try {
      const diff = Number(data.indicatoreRicaricato) - Number(data.indicatoreRicarica);
      const isPagato = data.pagato === true || String(data.pagato) === 'true';

      const ricaricaData = {
        dataRicarica: Timestamp.fromDate(new Date(data.dataRicarica)),
        litriRicarica: Number(data.litriRicarica),
        importoRicaricato: Number(data.importoRicaricato),
        indicatoreRicarica: Number(data.indicatoreRicarica),
        indicatoreRicaricato: Number(data.indicatoreRicaricato),
        diffRicaricata: diff,
        pagato: isPagato,
        dataPagamento: isPagato ? Timestamp.now() : null,
        userId: user.id,
        createdAt: Timestamp.now()
      };

      if (editingId) {
        // Update existing
        const { createdAt, userId, ...updateData } = ricaricaData; // Keep original createdAt and userId
        
        // Se stiamo modificando e pagato era già true, mantieni la data originale se non è cambiato lo stato
        const existingRecord = ricariche.find(r => r.id === editingId);
        if (existingRecord && existingRecord.pagato && isPagato) {
           updateData.dataPagamento = existingRecord.dataPagamento ? Timestamp.fromDate(existingRecord.dataPagamento) : Timestamp.now();
        }

        await updateDoc(doc(db, 'ricariche', editingId), updateData);
        setEditingId(null);
      } else {
        // Create new
        await addDoc(collection(db, 'ricariche'), ricaricaData);
      }

      reset();
      setShowAddForm(false);
      loadRicariche();
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvataggio dei dati');
    }
  };

  const startEdit = (ricarica: Ricarica) => {
    setEditingId(ricarica.id);
    setShowAddForm(true);
    
    // Format date for input type="date" (YYYY-MM-DD)
    const dateStr = ricarica.dataRicarica.toISOString().split('T')[0];
    
    setValue('dataRicarica', dateStr);
    setValue('litriRicarica', ricarica.litriRicarica);
    setValue('importoRicaricato', ricarica.importoRicaricato);
    setValue('indicatoreRicarica', ricarica.indicatoreRicarica);
    setValue('indicatoreRicaricato', ricarica.indicatoreRicaricato);
    setValue('pagato', ricarica.pagato);
  };

  const deleteRicarica = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo record?')) return;
    
    try {
      await deleteDoc(doc(db, 'ricariche', id));
      loadRicariche();
    } catch (error) {
      console.error('Errore durante eliminazione:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    reset();
  };

  // Funzione per esportare in Excel
  const exportToExcel = () => {
    try {
      // Prepara i dati per l'export
      const exportData = filteredAndSortedRicariche.map((ricarica, index) => {
        return {
          'N.': index + 1,
          'Data Ricarica': ricarica.dataRicarica.toLocaleDateString('it-IT'),
          'Litri': ricarica.litriRicarica,
          'Importo (€)': ricarica.importoRicaricato.toFixed(2),
          'Indicatore Prima': ricarica.indicatoreRicarica,
          'Indicatore Dopo': ricarica.indicatoreRicaricato,
          'Differenza': ricarica.diffRicaricata,
          'Pagato': ricarica.pagato ? 'Sì' : 'No',
          'Data Pagamento': ricarica.pagato && ricarica.dataPagamento 
            ? ricarica.dataPagamento.toLocaleDateString('it-IT') 
            : 'Non pagato'
        };
      });

      // Crea il workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Imposta la larghezza delle colonne
      const columnWidths = [
        { wch: 5 },   // N.
        { wch: 12 },  // Data Ricarica
        { wch: 8 },   // Litri
        { wch: 12 },  // Importo
        { wch: 15 },  // Indicatore Prima
        { wch: 15 },  // Indicatore Dopo
        { wch: 10 },  // Differenza
        { wch: 8 },   // Pagato
        { wch: 15 }   // Data Pagamento
      ];
      worksheet['!cols'] = columnWidths;

      // Aggiunge il worksheet al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'RicaricheGAS');

      // Genera il nome del file con data corrente
      const now = new Date();
      const fileName = `RicaricheGAS_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

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
      // Calcola i totali per il riepilogo
      const totaleImporto = filteredAndSortedRicariche.reduce((sum, r) => sum + r.importoRicaricato, 0);
      const totaleLitri = filteredAndSortedRicariche.reduce((sum, r) => sum + r.litriRicarica, 0);
      const totalePagato = filteredAndSortedRicariche.filter(r => r.pagato).length;
      const totaleNonPagato = filteredAndSortedRicariche.filter(r => !r.pagato).length;

      let printContent = `
        <html>
          <head>
            <title>Ricariche GAS - ${new Date().toLocaleDateString('it-IT')}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; color: #d17f3d; margin-bottom: 30px; }
              .info { text-align: center; margin-bottom: 20px; color: #666; }
              .summary { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
              .summary-item { text-align: center; }
              .summary-value { font-size: 18px; font-weight: bold; color: #d17f3d; }
              .summary-label { font-size: 12px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .pagato-si { background-color: #f0f9f0; color: #166534; font-weight: bold; }
              .pagato-no { background-color: #fef2f2; color: #991b1b; }
              .importo { text-align: right; font-weight: bold; }
              .centro { text-align: center; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>⛽ Ricariche GAS</h1>
            <div class="info">
              Stampato il: ${new Date().toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} | Totale record: ${filteredAndSortedRicariche.length}
            </div>
            
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-value">€${totaleImporto.toFixed(2)}</div>
                  <div class="summary-label">Importo Totale</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">${totaleLitri.toFixed(1)}L</div>
                  <div class="summary-label">Litri Totali</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">${totalePagato}</div>
                  <div class="summary-label">Pagate</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">${totaleNonPagato}</div>
                  <div class="summary-label">Non Pagate</div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>N.</th>
                  <th>Data</th>
                  <th>Litri</th>
                  <th>Importo</th>
                  <th>Ind. Prima</th>
                  <th>Ind. Dopo</th>
                  <th>Diff.</th>
                  <th>Pagato</th>
                </tr>
              </thead>
              <tbody>
      `;

      filteredAndSortedRicariche.forEach((ricarica, index) => {
        printContent += `
          <tr>
            <td class="centro">${index + 1}</td>
            <td class="centro">${ricarica.dataRicarica.toLocaleDateString('it-IT')}</td>
            <td class="centro">${ricarica.litriRicarica}</td>
            <td class="importo">€${ricarica.importoRicaricato.toFixed(2)}</td>
            <td class="centro">${ricarica.indicatoreRicarica}</td>
            <td class="centro">${ricarica.indicatoreRicaricato}</td>
            <td class="centro">${ricarica.diffRicaricata}</td>
            <td class="${ricarica.pagato ? 'pagato-si' : 'pagato-no'} centro">${ricarica.pagato ? 'SÌ' : 'NO'}</td>
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

  if (loading) {
    return <div className="p-4 text-center">Caricamento...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center">
            <Droplets className="h-6 w-6 mr-2" style={{color: '#d17f3d'}} />
            <h2 className="text-xl font-semibold text-gray-800">Ricariche GAS</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors ${
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
              onClick={() => {
                loadRicariche();
                // Chiudi il form di inserimento/modifica quando si ricarica la lista
                setShowAddForm(false);
                setEditingId(null);
                reset();
              }}
              className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
              title="Ricarica lista"
            >
              <Calendar className="h-4 w-4" />
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              title="Esporta in Excel"
            >
              <Download className="h-4 w-4 mr-1" />
              Excel
            </button>
            <button
              onClick={printTable}
              className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              title="Stampa tabella"
            >
              <Printer className="h-4 w-4 mr-1" />
              Stampa
            </button>
            {!showAddForm && (
              <button
                onClick={() => {
                  setEditingId(null);
                  reset();
                  setShowAddForm(true);
                }}
                className="flex items-center justify-center px-4 py-2 text-white rounded-md transition-colors cursor-pointer w-full sm:w-auto"
                style={{backgroundColor: '#8d9c71'}}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#7a8a60'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#8d9c71'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuova Ricarica
              </button>
            )}
          </div>
        </div>

      {/* Pannello Filtri Collassabile */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Filtro Anno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anno
              </label>
              <select
                value={filterAnno}
                onChange={(e) => setFilterAnno(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tutti gli anni</option>
                {availableYears.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtro Importo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fascia Importo
              </label>
              <select
                value={filterImporto}
                onChange={(e) => setFilterImporto(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tutti gli importi</option>
                <option value="basso">Fino a 100€</option>
                <option value="medio">100€ - 500€</option>
                <option value="alto">Oltre 500€</option>
              </select>
            </div>
            
            {/* Filtro Pagato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato Pagamento
              </label>
              <select
                value={filterPagato}
                onChange={(e) => setFilterPagato(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tutti</option>
                <option value="no">Non pagato</option>
                <option value="si">Pagato</option>
              </select>
            </div>
            
            {/* Pulsante Reset */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Azioni
              </label>
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <X className="inline h-4 w-4 mr-1" />
                Reset Filtri
              </button>
            </div>
            
          </div>
          
          {/* Info Risultati */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                {filteredAndSortedRicariche.length !== ricariche.length && (
                  <span className="font-medium" style={{color: '#8d9c71'}}>
                    {filteredAndSortedRicariche.length} di {ricariche.length} ricariche mostrate
                  </span>
                )}
                {filteredAndSortedRicariche.length === ricariche.length && (
                  <span>
                    {ricariche.length} ricariche totali
                  </span>
                )}
              </div>
              {(filterAnno || filterImporto || filterPagato) && (
                <span 
                  className="text-xs px-2 py-1 rounded text-white"
                  style={{backgroundColor: '#8d9c71'}}
                >
                  Filtri attivi
                </span>
              )}
            </div>
          </div>
          
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Modifica Ricarica' : 'Nuova Ricarica'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Ricarica</label>
              <input
                {...register('dataRicarica', { required: 'Data obbligatoria' })}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.dataRicarica && <p className="text-xs text-red-600 mt-1">{errors.dataRicarica.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Litri Ricarica</label>
              <input
                {...register('litriRicarica', { required: 'Campo obbligatorio', min: 0 })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Importo Ricaricato (€)</label>
              <input
                {...register('importoRicaricato', { required: 'Campo obbligatorio', min: 0 })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Indicatore Ricarica</label>
              <input
                {...register('indicatoreRicarica', { required: 'Campo obbligatorio', min: 0 })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Indicatore Ricaricato</label>
              <input
                {...register('indicatoreRicaricato', { required: 'Campo obbligatorio', min: 0 })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diff. Ricaricata (Auto)</label>
              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-md text-gray-700">
                {diffRicaricata.toLocaleString('it-IT', { minimumFractionDigits: 1 })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pagato</label>
              <select
                {...register('pagato')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="false">NO</option>
                <option value="true">SI</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 text-white rounded-md"
              style={{backgroundColor: '#8d9c71'}}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#7a8a60'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#8d9c71'}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingId ? 'Aggiorna' : 'Salva'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="dataRicarica">Data</SortableHeader>
              <SortableHeader field="litriRicarica">Litri</SortableHeader>
              <SortableHeader field="importoRicaricato">Importo (€)</SortableHeader>
              <SortableHeader field="indicatoreRicarica">Ind. Ricarica</SortableHeader>
              <SortableHeader field="indicatoreRicaricato">Ind. Ricaricato</SortableHeader>
              <SortableHeader field="diffRicaricata">Diff.</SortableHeader>
              <SortableHeader field="pagato">Pagato</SortableHeader>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ricariche.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nessuna ricarica presente
                </td>
              </tr>
            ) : (
              currentRicariche.map((ricarica) => (
                <tr key={ricarica.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ricarica.dataRicarica.toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ricarica.litriRicarica.toLocaleString('it-IT', { minimumFractionDigits: 1 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ricarica.importoRicaricato.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ricarica.indicatoreRicarica.toLocaleString('it-IT', { minimumFractionDigits: 1 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ricarica.indicatoreRicaricato.toLocaleString('it-IT', { minimumFractionDigits: 1 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ricarica.diffRicaricata.toLocaleString('it-IT', { minimumFractionDigits: 1 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ricarica.pagato ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {ricarica.pagato ? 'SI' : 'NO'}
                    </span>
                    {ricarica.pagato && ricarica.dataPagamento && (
                      <div className="text-xs text-gray-500 mt-1">
                        {ricarica.dataPagamento.toLocaleDateString('it-IT')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => startEdit(ricarica)}
                      className="hover:text-gray-900 mr-4 cursor-pointer"
                      style={{color: '#8d9c71'}}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRicarica(ricarica.id)}
                      className="text-red-600 hover:text-red-900 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Controlli di Paginazione */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{Math.min(startIndex + 1, filteredAndSortedRicariche.length)}</span> - <span className="font-medium">{Math.min(endIndex, filteredAndSortedRicariche.length)}</span> di <span className="font-medium">{filteredAndSortedRicariche.length}</span> risultati
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            >
              ≪
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            >
              ← Prec
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === pageNum
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={currentPage === pageNum ? {backgroundColor: '#8d9c71'} : {}}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            >
              Succ →
            </button>
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            >
              ≫
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500">
        Totale ricariche: {ricariche.length}
        {ricariche.filter(r => r.pagato).length > 0 && (
          <span className="ml-3">| Pagate: {ricariche.filter(r => r.pagato).length}</span>
        )}
        {filteredAndSortedRicariche.length !== ricariche.length && (
          <span className="ml-3" style={{color: '#8d9c71'}}>
            | Risultati mostrati: {filteredAndSortedRicariche.length}
          </span>
        )}
      </div>
    </div>
  );
}
