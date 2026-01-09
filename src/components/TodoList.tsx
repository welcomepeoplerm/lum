'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Todo, Unita } from '@/types';
import { Plus, Trash2, Check, X, Calendar, List, Edit, Filter, Search, ArrowUpDown, ChevronDown, ChevronUp, Download, Printer } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';

interface TodoFormData {
  lavorodaeseguire: string;
  Note: string;
  unita?: string;
  Eseguito?: boolean;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [unita, setUnita] = useState<Unita[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Stati per filtri e ordinamento
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterEseguito, setFilterEseguito] = useState('');
  const [filterUnita, setFilterUnita] = useState('');
  const [sortField, setSortField] = useState<string>('datainserimento');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const { user } = useAuth();
  
  // Funzione per ottenere i colori del badge per ogni unità
  const getUnitaBadgeStyle = (nomeUnita: string) => {
    if (nomeUnita === 'Anyma') {
      return { backgroundColor: '#f3e8ff', color: '#6b21a8', borderColor: '#a855f7' };
    }
    if (nomeUnita === 'Lynfa') {
      return { backgroundColor: '#ecfccb', color: '#365314', borderColor: '#65a30d' };
    }
    if (nomeUnita === 'Arya') {
      return { backgroundColor: '#cffafe', color: '#155e75', borderColor: '#06b6d4' };
    }
    if (nomeUnita === 'Aura') {
      return { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#f59e0b' };
    }
    if (nomeUnita === 'Aqua') {
      return { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#3b82f6' };
    }
    
    return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' };
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TodoFormData>();

  // Funzioni per filtri e ordinamento
  const filteredAndSortedTodos = todos
    .filter(todo => {
      // Filtro testo (lavoro da eseguire)
      if (searchText && !todo.lavorodaeseguire.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      // Filtro stato eseguito
      if (filterEseguito === 'si' && !todo.Eseguito) return false;
      if (filterEseguito === 'no' && todo.Eseguito) return false;
      // Filtro unità
      if (filterUnita && todo.unita !== filterUnita) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'lavorodaeseguire':
          aValue = a.lavorodaeseguire.toLowerCase();
          bValue = b.lavorodaeseguire.toLowerCase();
          break;
        case 'datainserimento':
          aValue = a.datainserimento.getTime();
          bValue = b.datainserimento.getTime();
          break;
        case 'dataesecuzione':
          aValue = a.dataesecuzione ? a.dataesecuzione.getTime() : 0;
          bValue = b.dataesecuzione ? b.dataesecuzione.getTime() : 0;
          break;
        case 'Eseguito':
          aValue = a.Eseguito ? 1 : 0;
          bValue = b.Eseguito ? 1 : 0;
          break;
        case 'unita':
          const unitaA = unita.find(u => u.id === a.unita);
          const unitaB = unita.find(u => u.id === b.unita);
          aValue = unitaA ? unitaA['nomeunità'].toLowerCase() : '';
          bValue = unitaB ? unitaB['nomeunità'].toLowerCase() : '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Calcoli per la paginazione sui dati filtrati
  const totalPages = Math.ceil(filteredAndSortedTodos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTodos = filteredAndSortedTodos.slice(startIndex, endIndex);

  // Funzione per resettare filtri
  const clearFilters = () => {
    setSearchText('');
    setFilterEseguito('');
    setFilterUnita('');
    setSortField('datainserimento');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  // Funzione per esportare in Excel
  const exportToExcel = () => {
    try {
      // Prepara i dati per l'export
      const exportData = filteredAndSortedTodos.map((todo, index) => {
        const unitaItem = unita.find(u => u.id === todo.unita);
        
        // Gestione intelligente della visualizzazione unità per Excel
        let unitaDisplay = 'Nessuna unità';
        if (unitaItem) {
          const nome = unitaItem['nomeunità'] || '';
          const descrizione = unitaItem['descrizioneunita'] || '';
          unitaDisplay = nome === descrizione ? nome : `${descrizione} (${nome})`;
        }
        
        return {
          'N.': index + 1,
          'Eseguito': todo.Eseguito ? 'Sì' : 'No',
          'Lavoro da Eseguire': todo.lavorodaeseguire || '',
          'Unità': unitaDisplay,
          'Note': todo.Note || '',
          'Data Inserimento': todo.datainserimento.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          'Data Esecuzione': todo.dataesecuzione ? todo.dataesecuzione.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Non ancora eseguito'
        };
      });

      // Crea il workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Imposta la larghezza delle colonne
      const columnWidths = [
        { wch: 5 },   // N.
        { wch: 10 },  // Eseguito
        { wch: 40 },  // Lavoro da Eseguire
        { wch: 25 },  // Unità
        { wch: 30 },  // Note
        { wch: 20 },  // Data Inserimento
        { wch: 20 }   // Data Esecuzione
      ];
      worksheet['!cols'] = columnWidths;

      // Aggiunge il worksheet al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attività e manutenzione');

      // Genera il nome del file con data corrente
      const now = new Date();
      const fileName = `Attivita_manutenzione_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`; 

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
      // Prepara il contenuto per la stampa
      let printContent = `
        <html>
          <head>
            <title>Attività e manutenzione - ${new Date().toLocaleDateString('it-IT')}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; color: #46433c; margin-bottom: 30px; }
              .info { text-align: center; margin-bottom: 20px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .eseguito-si { background-color: #f0f9f0; color: #166534; }
              .eseguito-no { background-color: #fef2f2; color: #991b1b; }
              .unit-badge { 
                display: inline-block; 
                padding: 2px 8px; 
                border-radius: 12px; 
                font-size: 11px; 
                font-weight: bold;
                border: 1px solid #ccc;
              }
              .unit-anyma { background-color: #f3e8ff; color: #6b21a8; border-color: #a855f7; }
              .unit-lynfa { background-color: #ecfccb; color: #365314; border-color: #65a30d; }
              .unit-arya { background-color: #cffafe; color: #155e75; border-color: #06b6d4; }
              .unit-aura { background-color: #fef3c7; color: #92400e; border-color: #f59e0b; }
              .unit-aqua { background-color: #dbeafe; color: #1e40af; border-color: #3b82f6; }
              .note-cell { max-width: 200px; word-wrap: break-word; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>📋 Attività e manutenzione</h1>
            <div class="info">
              Stampato il: ${new Date().toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} | Totale elementi: ${filteredAndSortedTodos.length}
            </div>
            <table>
              <thead>
                <tr>
                  <th>N.</th>
                  <th>Eseguito</th>
                  <th>Lavoro da Eseguire</th>
                  <th>Unità</th>
                  <th>Note</th>
                  <th>Data Inserimento</th>
                  <th>Data Esecuzione</th>
                </tr>
              </thead>
              <tbody>
      `;

      filteredAndSortedTodos.forEach((todo, index) => {
        const unitaItem = unita.find(u => u.id === todo.unita);
        const unitClass = unitaItem ? `unit-${unitaItem['descrizioneunita']?.toLowerCase()}` : '';
        
        // Gestione intelligente della visualizzazione unità per stampa
        let unitaContent = 'Nessuna unità';
        if (unitaItem) {
          const nome = unitaItem['nomeunità'] || '';
          const descrizione = unitaItem['descrizioneunita'] || '';
          
          if (nome === descrizione) {
            unitaContent = `<span class="unit-badge ${unitClass}">${descrizione}</span>`;
          } else {
            unitaContent = `
              <span class="unit-badge ${unitClass}">${descrizione}</span><br>
              <small>${nome}</small>
            `;
          }
        }
        
        printContent += `
          <tr>
            <td>${index + 1}</td>
            <td class="${todo.Eseguito ? 'eseguito-si' : 'eseguito-no'}">${todo.Eseguito ? 'Sì' : 'No'}</td>
            <td>${todo.lavorodaeseguire || ''}</td>
            <td>${unitaContent}</td>
            <td class="note-cell">${todo.Note || ''}</td>
            <td>${todo.datainserimento.toLocaleDateString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</td>
            <td>${todo.dataesecuzione ? todo.dataesecuzione.toLocaleDateString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Non ancora eseguito'}</td>
          </tr>
        `;
      });

      printContent += `
              </tbody>
            </table>
            <div class="info">
              <small>
                Completati: ${filteredAndSortedTodos.filter(t => t.Eseguito).length} | 
                Da completare: ${filteredAndSortedTodos.filter(t => !t.Eseguito).length}
              </small>
            </div>
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

  // Funzione per gestire l'ordinamento da click su colonna
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Se è già la colonna attiva, cambia direzione
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se è una nuova colonna, imposta come attiva con direzione discendente
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Componente per intestazione colonna ordinabile
  const SortableHeader = ({ field, children, className = '' }: { field: string; children: React.ReactNode; className?: string }) => {
    const isActive = sortField === field;
    return (
      <th 
        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
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
      loadTodos();
      loadUnita();
    }
  }, [user]);

  // Reset alla prima pagina quando i dati filtrati cambiano
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredAndSortedTodos.length, totalPages, currentPage]);

  const loadUnita = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'Unita'));
      const unitaData: Unita[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        unitaData.push({
          id: doc.id,
          'nomeunità': data['nomeunità'] || '',
          'descrizioneunita': data['descrizioneunita'] || '',
          createdAt: data.createdAt ? data.createdAt.toDate() : undefined
        });
      });
      
      // Ordinamento alfabetico per nome unità
      unitaData.sort((a, b) => {
        const nameA = (a['nomeunità'] || '').toLowerCase();
        const nameB = (b['nomeunità'] || '').toLowerCase();
        return nameA.localeCompare(nameB, 'it');
      });
      
      setUnita(unitaData);
    } catch (error) {
      console.error('Errore nel caricamento delle unità:', error);
    }
  };

  const loadTodos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Loading todos for user:', user.id);
      
      // Query semplificata senza ordinamento per evitare errori di indice
      // Modificato per mostrare i todo di tutti gli utenti
      const q = query(
        collection(db, 'todos')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot size:', querySnapshot.size);
      const todosData: Todo[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Todo document:', doc.id, data);
        todosData.push({
          id: doc.id,
          // Nuovi campi
          lavorodaeseguire: data.lavorodaeseguire || data.attivita || '',
          datainserimento: data.datainserimento ? data.datainserimento.toDate() : (data.dataInserimento ? data.dataInserimento.toDate() : new Date()),
          dataesecuzione: data.dataesecuzione ? data.dataesecuzione.toDate() : null,
          Note: data.Note || '',
          Eseguito: data.Eseguito !== undefined ? data.Eseguito : (data.fatto || false),
          unita: data.unita || '', // Campo unità
          userId: data.userId
        });
      });
      
      // Ordinamento lato client per evitare errori di indice Firebase
      todosData.sort((a, b) => b.datainserimento.getTime() - a.datainserimento.getTime());
      
      console.log('Loaded todos:', todosData);
      setTodos(todosData);
    } catch (error) {
      console.error('Errore nel caricamento dei todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (data: TodoFormData) => {
    if (!user) return;
    
    console.log('Attempting to add todo with data:', data);
    console.log('User:', user);
    
    try {
      const newTodoData = {
        lavorodaeseguire: data.lavorodaeseguire,
        datainserimento: new Date(),
        dataesecuzione: null,
        Note: data.Note || '',
        Eseguito: false,
        unita: data.unita || '', // Campo unità opzionale
        userId: user.id
      };
      
      console.log('Adding todo to Firestore:', newTodoData);
      
      const docRef = await addDoc(collection(db, 'todos'), newTodoData);
      console.log('Todo added successfully with ID:', docRef.id);
      
      reset();
      setShowAddForm(false);
      loadTodos();
    } catch (error) {
      console.error('Errore durante aggiunta del todo:', error);
    }
  };

  const updateTodo = async (data: TodoFormData) => {
    if (!user || !editingTodo) return;
    
    console.log('Attempting to update todo with data:', data);
    console.log('Editing todo:', editingTodo);
    
    try {
      const updateData: any = {
        lavorodaeseguire: data.lavorodaeseguire,
        Note: data.Note || '',
        unita: data.unita || ''
      };
      
      // Gestisci il campo Eseguito e dataesecuzione
      if (data.Eseguito !== undefined) {
        const isCompleted = data.Eseguito === true || String(data.Eseguito) === 'true';
        updateData.Eseguito = isCompleted;
        
        // Se viene completato, imposta data esecuzione
        if (isCompleted && !editingTodo.dataesecuzione) {
          updateData.dataesecuzione = new Date();
        }
        // Se viene decompletato, rimuovi data esecuzione
        if (!isCompleted && editingTodo.dataesecuzione) {
          updateData.dataesecuzione = null;
        }
      }
      
      console.log('Updating todo in Firestore:', updateData);
      
      await updateDoc(doc(db, 'todos', editingTodo.id), updateData);
      console.log('Todo updated successfully');
      
      reset();
      setEditingTodo(null);
      loadTodos();
    } catch (error) {
      console.error('Errore durante aggiornamento del todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setShowAddForm(false);
    reset({
      lavorodaeseguire: todo.lavorodaeseguire,
      Note: todo.Note,
      unita: todo.unita || '',
      Eseguito: todo.Eseguito
    });
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    reset();
  };

  const toggleTodo = async (todoId: string, eseguito: boolean) => {
    try {
      await updateDoc(doc(db, 'todos', todoId), { 
        Eseguito: eseguito,
        dataesecuzione: eseguito ? new Date() : null
      });
      loadTodos();
    } catch (error) {
      console.error('Errore durante aggiornamento del todo:', error);
    }
  };

  const deleteTodo = async (todoId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo elemento?')) return;
    
    try {
      await deleteDoc(doc(db, 'todos', todoId));
      loadTodos();
    } catch (error) {
      console.error('Errore durante eliminazione del todo:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#8d9c71'}}></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center">
          <List className="h-6 w-6 mr-2" style={{color: '#8d9c71'}} />
          <h2 className="text-xl font-semibold text-gray-900">Attività e manutenzione</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => {
              setShowFilters(!showFilters);
              // Chiudi il form di inserimento/modifica quando si aprono i filtri
              if (!showFilters) {
                setShowAddForm(false);
                setEditingTodo(null);
                reset();
              }
            }}
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
              loadTodos();
              // Chiudi il form di inserimento/modifica quando si ricarica la lista
              setShowAddForm(false);
              setEditingTodo(null);
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
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center px-4 py-2 text-white rounded-md transition-colors cursor-pointer w-full sm:w-auto"
            style={{backgroundColor: '#8d9c71'}}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#7a8a60'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#8d9c71'}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuova Attività
          </button>
        </div>
      </div>

      {/* Pannello Filtri Collassabile */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Ricerca per Lavoro */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search className="inline h-4 w-4 mr-1" />
                Ricerca Lavoro
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Cerca nel lavoro da eseguire..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Filtro Stato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato
              </label>
              <select
                value={filterEseguito}
                onChange={(e) => setFilterEseguito(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tutti</option>
                <option value="no">Da eseguire</option>
                <option value="si">Completati</option>
              </select>
            </div>
            
            {/* Filtro Unità */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unità
              </label>
              <select
                value={filterUnita}
                onChange={(e) => setFilterUnita(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tutte le unità</option>
                {unita.map((unitaItem) => (
                  <option key={unitaItem.id} value={unitaItem.id}>
                    {unitaItem['nomeunità']}
                  </option>
                ))}
              </select>
            </div>
            
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            
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
                {filteredAndSortedTodos.length !== todos.length && (
                  <span className="text-indigo-600 font-medium">
                    {filteredAndSortedTodos.length} di {todos.length} lavori mostrati
                  </span>
                )}
                {filteredAndSortedTodos.length === todos.length && (
                  <span>
                    {todos.length} lavori totali
                  </span>
                )}
              </div>
              {(searchText || filterEseguito || filterUnita) && (
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                  Filtri attivi
                </span>
              )}
            </div>
          </div>
          
        </div>
      )}

      {(showAddForm || editingTodo) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingTodo ? 'Modifica Lavoro' : 'Nuova Attività'}
          </h3>
          <form 
            onSubmit={(e) => {
              console.log('Form submit triggered');
              console.log('Editing todo:', editingTodo);
              console.log('Form data will be processed by handleSubmit');
              return handleSubmit(editingTodo ? updateTodo : addTodo)(e);
            }} 
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lavoro da Eseguire *
                </label>
                <input
                  {...register('lavorodaeseguire', { 
                    required: 'Il campo "Lavoro da Eseguire" è obbligatorio',
                    minLength: {
                      value: 3,
                      message: 'Il lavoro deve essere di almeno 3 caratteri'
                    }
                  })}
                  type="text"
                  placeholder="Inserisci il lavoro da eseguire..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.lavorodaeseguire && (
                  <p className="mt-1 text-sm text-red-600">{errors.lavorodaeseguire.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unità (Opzionale)
                </label>
                <select
                  {...register('unita')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Seleziona un'unità...</option>
                  {unita.map((unitaItem) => {
                    // Se nome e descrizione sono uguali, mostra solo uno
                    const nome = unitaItem['nomeunità'] || '';
                    const descrizione = unitaItem['descrizioneunita'] || '';
                    const displayText = nome === descrizione ? nome : `${nome} - ${descrizione}`;
                    
                    return (
                      <option key={unitaItem.id} value={unitaItem.id}>
                        {displayText}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              {editingTodo && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Inserimento
                    </label>
                    <input
                      type="text"
                      value={editingTodo.datainserimento.toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Esecuzione
                    </label>
                    <input
                      type="text"
                      value={editingTodo.dataesecuzione ? editingTodo.dataesecuzione.toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Non ancora eseguito'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stato Completamento
                    </label>
                    <select
                      {...register('Eseguito')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="false">No - Da eseguire</option>
                      <option value="true">Sì - Completato</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Quando imposti "Completato", verrà registrata automaticamente la data di esecuzione
                    </p>
                  </div>
                </>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  {...register('Note')}
                  placeholder="Note aggiuntive, dettagli, istruzioni specifiche..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {!editingTodo && (
                  <p className="mt-1 text-xs text-gray-500">
                    Campi automatici: Data Inserimento (adesso), Data Esecuzione (quando completato), Eseguito (No di default)
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  if (editingTodo) {
                    cancelEdit();
                  } else {
                    setShowAddForm(false);
                    reset();
                  }
                }}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
              >
                <X className="h-4 w-4 mr-2" />
                Annulla
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 cursor-pointer"
                style={{backgroundColor: '#8d9c71'}}
              >
                <Check className="h-4 w-4 mr-2" />
                {editingTodo ? 'Aggiorna Lavoro' : 'Salva Lavoro'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {currentTodos.length === 0 ? (
          <div className="text-center py-12">
            {filteredAndSortedTodos.length === 0 && todos.length > 0 ? (
              <div className="text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">Nessun risultato trovato</p>
                <p className="text-sm mt-1">Prova a modificare i filtri di ricerca</p>
              </div>
            ) : (
              <p className="text-gray-500 text-lg">Nessun lavoro presente</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader field="Eseguito">
                    Eseguito
                  </SortableHeader>
                  <SortableHeader field="lavorodaeseguire">
                    <span className="hidden sm:inline">Lavoro da Eseguire</span>
                    <span className="sm:hidden">Lavoro</span>
                  </SortableHeader>
                  <SortableHeader field="unita">
                    Unità
                  </SortableHeader>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTodos.map((todo) => (
                  <tr key={todo.id} className={todo.Eseguito ? 'bg-green-50' : 'bg-white'}>
                    <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                      <select
                        value={todo.Eseguito ? 'si' : 'no'}
                        onChange={(e) => toggleTodo(todo.id, e.target.value === 'si')}
                        className={`text-sm border rounded px-3 py-1 min-w-16 ${
                          todo.Eseguito 
                            ? 'bg-green-100 border-green-300 text-green-800' 
                            : 'bg-gray-100 border-gray-300'
                        }`}
                      >
                        <option value="no">No</option>
                        <option value="si">Si</option>
                      </select>
                    </td>
                    <td className="px-2 sm:px-4 py-4">
                      <div className={`font-medium max-w-xs ${todo.Eseguito ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                        {todo.lavorodaeseguire || 'Nessun lavoro specificato'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {todo.unita ? (
                          (() => {
                            const unitaItem = unita.find(u => u.id === todo.unita);
                            if (unitaItem) {
                              const nome = unitaItem['nomeunità'] || '';
                              const descrizione = unitaItem['descrizioneunita'] || '';
                              const isSame = nome === descrizione;
                              
                              return (
                                <div className="flex flex-col gap-1">
                                  <span 
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                                    style={getUnitaBadgeStyle(descrizione)}
                                  >
                                    {descrizione}
                                  </span>
                                  {!isSame && (
                                    <div className="text-gray-400 text-xs">
                                      {nome}
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <span 
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                                  style={{ backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' }}
                                >
                                  Unità non trovata
                                </span>
                              );
                            }
                          })()
                        ) : (
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                            style={{ backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}
                          >
                            Nessuna unità
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-4 text-sm text-gray-600">
                      <div className="max-w-xs overflow-hidden">
                        <div className="truncate" title={todo.Note}>
                          {todo.Note || <span className="text-gray-400">Nessuna nota</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-end items-end sm:items-center">
                        <button
                          onClick={() => startEdit(todo)}
                          className="hover:text-blue-900 cursor-pointer p-1 rounded hover:bg-blue-50 w-8 h-8 flex items-center justify-center"
                          style={{color: '#3b82f6'}}
                          title="Modifica lavoro"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer p-1 rounded hover:bg-red-50 w-8 h-8 flex items-center justify-center"
                          title="Elimina lavoro"
                        >
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
      </div>
      
      {/* Controlli di Paginazione */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{Math.min(startIndex + 1, filteredAndSortedTodos.length)}</span> - <span className="font-medium">{Math.min(endIndex, filteredAndSortedTodos.length)}</span> di <span className="font-medium">{filteredAndSortedTodos.length}</span> risultati
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
        Totale lavori: {todos.length} | Completati: {todos.filter(t => t.Eseguito).length}
        {filteredAndSortedTodos.length !== todos.length && (
          <span className="ml-3 text-indigo-600">
            | Risultati mostrati: {filteredAndSortedTodos.length}
          </span>
        )}
      </div>
    </div>
  );
}