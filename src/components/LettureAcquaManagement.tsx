'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { LetturaAcqua } from '@/types';
import { Plus, Trash2, Edit, Save, X, Droplet, ChevronUp, ChevronDown, Calendar, Filter, Search, Download, Printer } from 'lucide-react';
import { Spinner } from '@fluentui/react-components';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';

interface LetturaAcquaFormData {
  dataLettura: string; // Input type="date" returns string
  letturaContatore: string;
  reale: boolean;
  dataComunicazione: string; // Input type="date" returns string
}

export default function LettureAcquaManagement() {
  const [letture, setLetture] = useState<LetturaAcqua[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Stati per filtri e ordinamento
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnno, setFilterAnno] = useState('');
  const [filterReale, setFilterReale] = useState('');
  const [sortField, setSortField] = useState<string>('dataLettura');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const { user } = useAuth();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<LetturaAcquaFormData>({
    defaultValues: {
      reale: true
    }
  });

  // Watch fields for calculation
  const letturaContatore = watch('letturaContatore');

  // Sort and paginate data with useMemo to prevent unnecessary recalculations
  const filteredAndSortedLetture = useMemo(() => {
    return letture
      .filter(lettura => {
        // Filtro anno
        if (filterAnno && lettura.dataLettura.getFullYear().toString() !== filterAnno) {
          return false;
        }
        // Filtro reale
        if (filterReale === 'si' && !lettura.reale) return false;
        if (filterReale === 'no' && lettura.reale) return false;
        return true;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'dataLettura':
            aValue = a.dataLettura.getTime();
            bValue = b.dataLettura.getTime();
            break;
          case 'letturaContatore':
            aValue = parseFloat(a.letturaContatore) || 0;
            bValue = parseFloat(b.letturaContatore) || 0;
            break;
          case 'm3LetturaPrecedente':
            aValue = a.m3LetturaPrecedente;
            bValue = b.m3LetturaPrecedente;
            break;
          case 'reale':
            aValue = a.reale ? 1 : 0;
            bValue = b.reale ? 1 : 0;
            break;
          case 'dataComunicazione':
            aValue = a.dataComunicazione ? a.dataComunicazione.getTime() : 0;
            bValue = b.dataComunicazione ? b.dataComunicazione.getTime() : 0;
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [letture, filterAnno, filterReale, sortField, sortDirection]);

  // Calcoli per la paginazione sui dati filtrati
  const totalPages = Math.ceil(filteredAndSortedLetture.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLetture = filteredAndSortedLetture.slice(startIndex, endIndex);

  // Funzione per resettare filtri
  const clearFilters = () => {
    setFilterAnno('');
    setFilterReale('');
    setSortField('dataLettura');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  // Get unique years from letture for filter dropdown
  const availableYears = [...new Set(letture.map(l => l.dataLettura.getFullYear()))].sort((a, b) => b - a);

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
            <ChevronUp className={`h-3 w-3 ${isActive && sortDirection === 'asc' ? '' : 'text-gray-300'}`} style={isActive && sortDirection === 'asc' ? {color: '#3b82f6'} : {}} />
            <ChevronDown className={`h-3 w-3 -mt-1 ${isActive && sortDirection === 'desc' ? '' : 'text-gray-300'}`} style={isActive && sortDirection === 'desc' ? {color: '#3b82f6'} : {}} />
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
      loadLetture();
    }
  }, [user]);

  // Reset alla prima pagina quando i dati filtrati cambiano
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredAndSortedLetture.length, totalPages]);

  const loadLetture = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'lettureAcqua'), orderBy('dataLettura', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const data: LetturaAcqua[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        data.push({
          id: doc.id,
          dataLettura: d.dataLettura.toDate(),
          letturaContatore: d.letturaContatore,
          reale: d.reale !== undefined ? d.reale : true,
          dataComunicazione: d.dataComunicazione ? d.dataComunicazione.toDate() : null,
          m3LetturaPrecedente: d.m3LetturaPrecedente || 0,
          createdAt: d.createdAt.toDate(),
          userId: d.userId
        });
      });
      
      setLetture(data);
    } catch (error) {
      console.error('Errore nel caricamento delle letture acqua:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per calcolare m3LetturaPrecedente
  const calculateM3Precedente = (newLetturaContatore: string, dataLettura: string): number => {
    // Ordina le letture per data (più recente prima)
    const sortedLetture = [...letture].sort((a, b) => 
      b.dataLettura.getTime() - a.dataLettura.getTime()
    );

    // Trova la lettura precedente più recente rispetto alla data inserita
    const dataLetturaDate = new Date(dataLettura);
    const letturaPrecedente = sortedLetture.find(l => 
      l.dataLettura.getTime() < dataLetturaDate.getTime()
    );

    if (letturaPrecedente) {
      const letturaCorrente = parseFloat(newLetturaContatore) || 0;
      const letturaPrecedenteVal = parseFloat(letturaPrecedente.letturaContatore) || 0;
      return Math.max(0, letturaCorrente - letturaPrecedenteVal);
    }

    return 0;
  };

  const onSubmit = async (data: LetturaAcquaFormData) => {
    if (!user) return;

    try {
      const isReale = data.reale === true || String(data.reale) === 'true';
      const m3Precedente = editingId ? 
        letture.find(l => l.id === editingId)?.m3LetturaPrecedente || 0 : 
        calculateM3Precedente(data.letturaContatore, data.dataLettura);

      const letturaData = {
        dataLettura: Timestamp.fromDate(new Date(data.dataLettura)),
        letturaContatore: data.letturaContatore,
        reale: isReale,
        dataComunicazione: data.dataComunicazione ? Timestamp.fromDate(new Date(data.dataComunicazione)) : null,
        m3LetturaPrecedente: m3Precedente,
        userId: user.id,
        createdAt: Timestamp.now()
      };

      if (editingId) {
        // Update existing
        const { createdAt, userId, ...updateData } = letturaData;
        await updateDoc(doc(db, 'lettureAcqua', editingId), updateData);
        setEditingId(null);
      } else {
        // Create new
        await addDoc(collection(db, 'lettureAcqua'), letturaData);
      }

      reset({ reale: true });
      setShowAddForm(false);
      loadLetture();
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvataggio dei dati');
    }
  };

  const startEdit = (lettura: LetturaAcqua) => {
    setEditingId(lettura.id);
    setShowAddForm(true);
    
    // Format date for input type="date" (YYYY-MM-DD)
    const dateStr = lettura.dataLettura.toISOString().split('T')[0];
    const dataComunicazioneStr = lettura.dataComunicazione ? lettura.dataComunicazione.toISOString().split('T')[0] : '';
    
    setValue('dataLettura', dateStr);
    setValue('letturaContatore', lettura.letturaContatore);
    setValue('reale', lettura.reale);
    setValue('dataComunicazione', dataComunicazioneStr);
  };

  const deleteLettura = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa lettura?')) return;
    
    try {
      await deleteDoc(doc(db, 'lettureAcqua', id));
      loadLetture();
    } catch (error) {
      console.error('Errore durante eliminazione:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    reset({ reale: true });
  };

  // Funzione per esportare in Excel
  const exportToExcel = () => {
    try {
      const exportData = filteredAndSortedLetture.map((lettura, index) => {
        return {
          'N.': index + 1,
          'Data Lettura': lettura.dataLettura.toLocaleDateString('it-IT'),
          'Lettura Contatore': lettura.letturaContatore,
          'M3 Precedente': lettura.m3LetturaPrecedente.toFixed(2),
          'Reale': lettura.reale ? 'Sì' : 'No',
          'Data Comunicazione': lettura.dataComunicazione 
            ? lettura.dataComunicazione.toLocaleDateString('it-IT') 
            : 'Non comunicato'
        };
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const columnWidths = [
        { wch: 5 },   // N.
        { wch: 12 },  // Data Lettura
        { wch: 15 },  // Lettura Contatore
        { wch: 12 },  // M3 Precedente
        { wch: 8 },   // Reale
        { wch: 15 }   // Data Comunicazione
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'LettureAcqua');

      const now = new Date();
      const fileName = `LettureAcqua_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Errore durante l\'export Excel:', error);
      alert('Errore durante l\'esportazione. Riprova più tardi.');
    }
  };

  // Funzione per stampare la tabella
  const printTable = () => {
    try {
      const totaleM3 = filteredAndSortedLetture.reduce((sum, l) => sum + l.m3LetturaPrecedente, 0);
      const totaleReali = filteredAndSortedLetture.filter(l => l.reale).length;
      const totaleStimate = filteredAndSortedLetture.filter(l => !l.reale).length;

      let printContent = `
        <html>
          <head>
            <title>Letture Acqua - ${new Date().toLocaleDateString('it-IT')}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; color: #3b82f6; margin-bottom: 30px; }
              .info { text-align: center; margin-bottom: 20px; color: #666; }
              .summary { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
              .summary-item { text-align: center; }
              .summary-value { font-size: 18px; font-weight: bold; color: #3b82f6; }
              .summary-label { font-size: 12px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .reale-si { background-color: #f0f9f0; color: #166534; font-weight: bold; }
              .reale-no { background-color: #fef2f2; color: #991b1b; }
              .centro { text-align: center; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>💧 Letture Acqua</h1>
            <div class="info">
              Stampato il: ${new Date().toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} | Totale record: ${filteredAndSortedLetture.length}
            </div>
            
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-value">${totaleM3.toFixed(2)} m³</div>
                  <div class="summary-label">Totale M³</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">${totaleReali}</div>
                  <div class="summary-label">Letture Reali</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">${totaleStimate}</div>
                  <div class="summary-label">Letture Stimate</div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>N.</th>
                  <th>Data</th>
                  <th>Lettura</th>
                  <th>M³ Prec.</th>
                  <th>Reale</th>
                  <th>Data Com.</th>
                </tr>
              </thead>
              <tbody>
      `;

      filteredAndSortedLetture.forEach((lettura, index) => {
        printContent += `
          <tr>
            <td class="centro">${index + 1}</td>
            <td class="centro">${lettura.dataLettura.toLocaleDateString('it-IT')}</td>
            <td class="centro">${lettura.letturaContatore}</td>
            <td class="centro">${lettura.m3LetturaPrecedente.toFixed(2)}</td>
            <td class="${lettura.reale ? 'reale-si' : 'reale-no'} centro">${lettura.reale ? 'SÌ' : 'NO'}</td>
            <td class="centro">${lettura.dataComunicazione ? lettura.dataComunicazione.toLocaleDateString('it-IT') : '-'}</td>
          </tr>
        `;
      });

      printContent += `
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
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
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Caricamento letture acqua..." size="large" />
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center">
          <Droplet className="h-6 w-6 mr-2" style={{color: '#3b82f6'}} />
          <h2 className="text-xl font-semibold text-gray-800">Letture Acqua</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors cursor-pointer ${
              showFilters
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={showFilters ? {backgroundColor: '#3b82f6'} : {}}
            title="Filtri e ordinamento"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtri
            {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </button>
          <button
            onClick={() => {
              loadLetture();
              setShowAddForm(false);
              setEditingId(null);
              reset({ reale: true });
            }}
            className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
            title="Ricarica lista"
          >
            <Calendar className="h-4 w-4" />
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors cursor-pointer"
            title="Esporta in Excel"
          >
            <Download className="h-4 w-4 mr-1" />
            Excel
          </button>
          <button
            onClick={printTable}
            className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors cursor-pointer"
            title="Stampa tabella"
          >
            <Printer className="h-4 w-4 mr-1" />
            Stampa
          </button>
          {!showAddForm && (
            <button
              onClick={() => {
                setEditingId(null);
                reset({ reale: true });
                setShowAddForm(true);
              }}
              className="flex items-center justify-center px-4 py-2 text-white rounded-md transition-colors cursor-pointer w-full sm:w-auto"
              style={{backgroundColor: '#3b82f6'}}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuova Lettura
            </button>
          )}
        </div>
      </div>

      {/* Pannello Filtri Collassabile */}
      {showFilters && (
        <div className="mt-6 mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Filtro Anno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anno
              </label>
              <select
                value={filterAnno}
                onChange={(e) => setFilterAnno(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti gli anni</option>
                {availableYears.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtro Reale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Lettura
              </label>
              <select
                value={filterReale}
                onChange={(e) => setFilterReale(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutte</option>
                <option value="si">Reale</option>
                <option value="no">Stimata</option>
              </select>
            </div>
            
            {/* Pulsante Reset */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Azioni
              </label>
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
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
                {filteredAndSortedLetture.length !== letture.length && (
                  <span className="font-medium" style={{color: '#3b82f6'}}>
                    {filteredAndSortedLetture.length} di {letture.length} letture mostrate
                  </span>
                )}
                {filteredAndSortedLetture.length === letture.length && (
                  <span>
                    {letture.length} letture totali
                  </span>
                )}
              </div>
              {(filterAnno || filterReale) && (
                <span 
                  className="text-xs px-2 py-1 rounded text-white"
                  style={{backgroundColor: '#3b82f6'}}
                >
                  Filtri attivi
                </span>
              )}
            </div>
          </div>
          
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
          <button
            type="button"
            onClick={cancelEdit}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-full hover:bg-gray-200 transition-colors"
            title="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Modifica Lettura' : 'Nuova Lettura'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Lettura *</label>
              <input
                {...register('dataLettura', { required: 'Data obbligatoria' })}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.dataLettura && <p className="text-xs text-red-600 mt-1">{errors.dataLettura.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lettura Contatore *</label>
              <input
                {...register('letturaContatore', { required: 'Campo obbligatorio' })}
                type="text"
                placeholder="es. 12345.67"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.letturaContatore && <p className="text-xs text-red-600 mt-1">{errors.letturaContatore.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reale</label>
              <select
                {...register('reale')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">SI</option>
                <option value="false">NO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Comunicazione</label>
              <input
                {...register('dataComunicazione')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 text-white rounded-md cursor-pointer"
              style={{backgroundColor: '#3b82f6'}}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingId ? 'Aggiorna' : 'Salva'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="dataLettura">Data Lettura</SortableHeader>
              <SortableHeader field="letturaContatore">Lettura Contatore</SortableHeader>
              <SortableHeader field="m3LetturaPrecedente">M³ Prec.</SortableHeader>
              <SortableHeader field="reale">Reale</SortableHeader>
              <SortableHeader field="dataComunicazione">Data Com.</SortableHeader>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {letture.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nessuna lettura presente
                </td>
              </tr>
            ) : (
              currentLetture.map((lettura) => (
                <tr key={lettura.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lettura.dataLettura.toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lettura.letturaContatore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lettura.m3LetturaPrecedente.toFixed(2)} m³
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lettura.reale ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lettura.reale ? 'SI' : 'NO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lettura.dataComunicazione ? lettura.dataComunicazione.toLocaleDateString('it-IT') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => startEdit(lettura)}
                      className="hover:text-gray-900 mr-4 cursor-pointer p-2 rounded hover:bg-gray-50"
                      style={{color: '#3b82f6'}}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteLettura(lettura.id)}
                      className="text-red-600 hover:text-red-900 cursor-pointer p-2 rounded hover:bg-red-50"
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
            Mostrando <span className="font-medium">{Math.min(startIndex + 1, filteredAndSortedLetture.length)}</span> - <span className="font-medium">{Math.min(endIndex, filteredAndSortedLetture.length)}</span> di <span className="font-medium">{filteredAndSortedLetture.length}</span> risultati
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 cursor-pointer"
            >
              ≪
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 cursor-pointer"
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
                    className={`px-3 py-1 text-sm rounded cursor-pointer ${
                      currentPage === pageNum
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={currentPage === pageNum ? {backgroundColor: '#3b82f6'} : {}}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 cursor-pointer"
            >
              Succ →
            </button>
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 cursor-pointer"
            >
              ≫
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500">
        Totale letture: {letture.length}
        {letture.filter(l => l.reale).length > 0 && (
          <span className="ml-3">| Reali: {letture.filter(l => l.reale).length}</span>
        )}
        {letture.filter(l => !l.reale).length > 0 && (
          <span className="ml-3">| Stimate: {letture.filter(l => !l.reale).length}</span>
        )}
        {filteredAndSortedLetture.length !== letture.length && (
          <span className="ml-3" style={{color: '#3b82f6'}}>
            | Risultati mostrati: {filteredAndSortedLetture.length}
          </span>
        )}
      </div>
    </div>
  );
}
