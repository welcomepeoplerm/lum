# Istruzioni per Creare una Nuova Funzionalità CRUD

Questo documento descrive lo standard architetturale, stilistico e organizzativo da seguire per creare nuove funzionalità nel progetto LYFE, basandosi sul modello della pagina **FornitoriManagement**.

---

## 📋 Indice
1. [Struttura del Componente](#struttura-del-componente)
2. [Gestione dello Stato](#gestione-dello-stato)
3. [Integrazione Firebase](#integrazione-firebase)
4. [Layout e UI](#layout-e-ui)
5. [Filtri e Ricerca](#filtri-e-ricerca)
6. [Form Modale](#form-modale)
7. [Esportazione e Stampa](#esportazione-e-stampa)
8. [Stili e Colori](#stili-e-colori)
9. [Icone Lucide React](#icone-lucide-react)
10. [Integrazione Dashboard](#integrazione-dashboard)

---

## 1. Struttura del Componente

### Import Standard
```typescript
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { TuoTipo, AltriTipi } from '@/types';
import { Plus, Edit2, Trash2, Save, X, Download, Printer, IconaPrincipale, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';
```

### Struttura del Componente
```typescript
export default function TuaGestione() {
  // Stati principali
  const [items, setItems] = useState<TuoTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Stati per filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [filter1, setFilter1] = useState('');
  const [filter2, setFilter2] = useState<'all' | 'option1' | 'option2'>('all');
  
  // Form data
  const [formData, setFormData] = useState({
    campo1: '',
    campo2: '',
    campoObbligatorio: '',
    // ... altri campi
  });
  
  const { user } = useAuth();
  
  // Funzioni load, CRUD, filtri, export, print
  // ...
  
  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Filtri */}
      {/* Tabella */}
      {/* Form Modale */}
    </div>
  );
}
```

---

## 2. Gestione dello Stato

### Stati Obbligatori
- `items`: array degli elementi caricati da Firebase
- `loading`: stato di caricamento
- `showForm`: visibilità del form modale
- `editingId`: ID dell'elemento in modifica (null per nuovo)
- `showFilters`: visibilità del pannello filtri
- `searchTerm`: termine di ricerca globale
- `formData`: oggetto con i campi del form

### Pattern UseEffect
```typescript
useEffect(() => {
  loadDatiDipendenti(); // es. settori, unità, ecc.
  loadItems();
}, []);
```

---

## 3. Integrazione Firebase

### Funzione Load
```typescript
const loadItems = async () => {
  try {
    setLoading(true);
    const q = query(collection(db, 'collezione'), orderBy('campo', 'asc'));
    const querySnapshot = await getDocs(q);
    const itemsData: TuoTipo[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      itemsData.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as TuoTipo);
    });
    
    setItems(itemsData);
  } catch (error) {
    console.error('Errore nel caricamento:', error);
    alert('Errore nel caricamento dei dati');
  } finally {
    setLoading(false);
  }
};
```

### Funzione Submit (Create/Update)
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user?.id) return;

  // Validazione campi obbligatori
  if (!formData.campo1.trim() || !formData.campo2) {
    alert('Compila tutti i campi obbligatori (*)');
    return;
  }

  try {
    const itemData: any = {
      campo1: formData.campo1.trim(),
      campo2: formData.campo2,
      userId: user.id
    };

    // Aggiungi solo i campi opzionali se hanno un valore
    if (formData.campoOpzionale?.trim()) {
      itemData.campoOpzionale = formData.campoOpzionale.trim();
    }

    if (editingId) {
      // Modifica esistente
      await updateDoc(doc(db, 'collezione', editingId), itemData);
    } else {
      // Nuovo elemento
      await addDoc(collection(db, 'collezione'), {
        ...itemData,
        createdAt: new Date()
      });
    }
    
    resetForm();
    await loadItems();
  } catch (error) {
    console.error('Errore nel salvare:', error);
    alert('Errore nel salvare i dati');
  }
};
```

### Funzione Delete
```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Sei sicuro di voler eliminare questo elemento?')) return;

  try {
    await deleteDoc(doc(db, 'collezione', id));
    await loadItems();
  } catch (error) {
    console.error('Errore nell\'eliminazione:', error);
    alert('Errore nell\'eliminazione');
  }
};
```

### Reset Form
```typescript
const resetForm = () => {
  setFormData({
    campo1: '',
    campo2: '',
    // ... reset tutti i campi
  });
  setShowForm(false);
  setEditingId(null);
};
```

---

## 4. Layout e UI

### Header Standard
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Gestione Nome</h1>
    <p className="text-gray-600">Descrizione breve della funzionalità</p>
  </div>

  <div className="flex flex-col sm:flex-row gap-2">
    {/* Pulsante Filtri */}
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
    
    {/* Pulsante Excel */}
    <button
      onClick={exportToExcel}
      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
      title="Esporta in Excel"
    >
      <Download className="h-4 w-4 mr-1" />
      Excel
    </button>
    
    {/* Pulsante Stampa */}
    <button
      onClick={printTable}
      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
      title="Stampa tabella"
    >
      <Printer className="h-4 w-4 mr-1" />
      Stampa
    </button>
    
    {/* Pulsante Nuovo */}
    <button
      onClick={() => setShowForm(true)}
      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm hover:opacity-90 transition-opacity cursor-pointer w-full sm:w-auto"
      style={{backgroundColor: '#8d9c71'}}
    >
      <Plus className="h-4 w-4 mr-2" />
      Nuovo Elemento
    </button>
  </div>
</div>
```

---

## 5. Filtri e Ricerca

### Pannello Filtri Collassabile
```tsx
{showFilters && (
  <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Ricerca Globale */}
      <div className="lg:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Search className="inline h-4 w-4 mr-1" />
          Ricerca
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cerca per campo1, campo2..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Filtro 1 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome Filtro
        </label>
        <select
          value={filter1}
          onChange={(e) => setFilter1(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Tutti</option>
          {/* Opzioni dinamiche */}
        </select>
      </div>

      {/* Filtro 2 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stato
        </label>
        <select
          value={filter2}
          onChange={(e) => setFilter2(e.target.value as 'all' | 'option1' | 'option2')}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">Tutti</option>
          <option value="option1">Opzione 1</option>
          <option value="option2">Opzione 2</option>
        </select>
      </div>
    </div>

    {/* Info Risultati */}
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          {filteredItems.length !== items.length && (
            <span className="text-indigo-600 font-medium">
              {filteredItems.length} di {items.length} elementi mostrati
            </span>
          )}
          {filteredItems.length === items.length && (
            <span>{items.length} elementi totali</span>
          )}
        </div>
        {(searchTerm || filter1 || filter2 !== 'all') && (
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
            Filtri attivi
          </span>
        )}
      </div>
    </div>
  </div>
)}
```

### Logica Filtri
```typescript
const filteredItems = items.filter((item) => {
  const matchesSearch = 
    item.campo1.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.campo2.toLowerCase().includes(searchTerm.toLowerCase());
  
  const matchesFilter1 = !filter1 || item.relatedId === filter1;
  
  const matchesFilter2 = 
    filter2 === 'all' || 
    (filter2 === 'option1' && item.stato) ||
    (filter2 === 'option2' && !item.stato);

  return matchesSearch && matchesFilter1 && matchesFilter2;
});
```

---

## 6. Form Modale

### Struttura Form
```tsx
{showForm && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white my-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">
          {editingId ? 'Modifica Elemento' : 'Nuovo Elemento'}
        </h3>
        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Campo Obbligatorio */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Campo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.campo}
              onChange={(e) => setFormData({ ...formData, campo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
              placeholder="Inserisci valore..."
            />
          </div>

          {/* Campo Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selezione <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.selectId}
              onChange={(e) => setFormData({ ...formData, selectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">Seleziona...</option>
              {/* Opzioni dinamiche */}
            </select>
          </div>

          {/* Campo Email */}
          <div>
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

          {/* Textarea */}
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

          {/* Checkbox */}
          <div className="md:col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.attivo}
                onChange={(e) => setFormData({ ...formData, attivo: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Elemento attivo</span>
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
```

---

## 7. Esportazione e Stampa

### Export Excel
```typescript
const exportToExcel = () => {
  if (filteredItems.length === 0) {
    alert('Nessun dato da esportare');
    return;
  }

  const dataForExport = filteredItems.map((item, index) => ({
    'N.': index + 1,
    'Campo 1': item.campo1,
    'Campo 2': item.campo2,
    // ... altri campi
    'Data Creazione': item.createdAt.toLocaleDateString('it-IT')
  }));

  // Aggiungi statistiche
  const stats = [
    { 'N.': '', 'Campo 1': '', /* ... */ },
    { 'N.': 'STATISTICHE', 'Campo 1': '', /* ... */ },
    { 'N.': 'Totale elementi:', 'Campo 1': filteredItems.length.toString(), /* ... */ }
  ];

  const finalData = [...dataForExport, ...stats];
  const ws = XLSX.utils.json_to_sheet(finalData);
  const wb = XLSX.utils.book_new();
  
  // Imposta larghezza colonne
  ws['!cols'] = [
    { wch: 5 },  // N.
    { wch: 30 }, // Campo 1
    // ... altre colonne
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Nome Sheet');
  const fileName = `nome_file_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
```

### Print Table
```typescript
const printTable = () => {
  if (filteredItems.length === 0) {
    alert('Nessun dato da stampare');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Nome Report - ${new Date().toLocaleDateString('it-IT')}</title>
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
          @media print {
            body { margin: 0; }
            table { font-size: 9px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Nome Report</h1>
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
              <th>N.</th>
              <th>Campo 1</th>
              <!-- altre colonne -->
            </tr>
          </thead>
          <tbody>
            ${filteredItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.campo1}</td>
                <!-- altri campi -->
              </tr>
            `).join('')}
          </tbody>
        </table>
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
```

---

## 8. Stili e Colori

### Colore Primario
- **Verde Principale**: `#8d9c71`
- Usato per: pulsanti principali, header attivi, bordi evidenziati

### Classi Tailwind Standard
- **Pulsanti Azione**: `bg-green-100 text-green-700 hover:bg-green-200` (Excel)
- **Pulsanti Azione**: `bg-blue-100 text-blue-700 hover:bg-blue-200` (Stampa)
- **Pulsanti Filtri**: `bg-gray-100 text-gray-700 hover:bg-gray-200`
- **Pulsante Primario**: `style={{backgroundColor: '#8d9c71'}}` con `text-white`
- **Pannello Filtri**: `bg-gray-50 rounded-lg border`
- **Badge Attivo**: `bg-green-100 text-green-800`
- **Badge Inattivo**: `bg-red-100 text-red-800`

### Focus States
Tutti i campi input devono avere:
```
focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
```

---

## 9. Icone Lucide React

### Icone Standard da Usare
- **Plus**: Nuovo elemento
- **Edit2**: Modifica
- **Trash2**: Elimina
- **Save**: Salva
- **X**: Chiudi/Annulla
- **Download**: Esporta
- **Printer**: Stampa
- **Search**: Ricerca
- **Filter**: Filtri
- **ChevronDown/ChevronUp**: Toggle
- **Building/Users/Calendar/etc**: Icona principale del modulo

---

## 10. Integrazione Dashboard

### 1. Aggiungere il tipo in `src/types/index.ts`
```typescript
export interface TuoTipo {
  id: string;
  campo1: string;
  campo2: string;
  attivo: boolean;
  createdAt: Date;
  userId: string;
}
```

### 2. Creare il componente in `src/components/TuaGestione.tsx`

### 3. Aggiornare Dashboard.tsx

**Import:**
```typescript
import TuaGestione from '@/components/TuaGestione';
```

**Aggiungere tab nello stato:**
```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'todos' | ... | 'tuonuovotab'>('overview');
```

**Aggiungere nel menu navigation (se necessario):**
```typescript
{
  name: 'Nome Funzione',
  key: 'tuonuovotab',
  icon: IconaScelta,
  roles: ['admin'] // o ['admin', 'user']
}
```

**Aggiungere nel render:**
```typescript
{activeTab === 'tuonuovotab' && user?.role === 'admin' && <TuaGestione />}
```

**Aggiornare il titolo nel top bar:**
```typescript
{activeTab === 'tuonuovotab' && 'Nome Tuo Tab'}
```

---

## 📝 Checklist Pre-Implementazione

Prima di iniziare una nuova funzionalità, verifica:

- [ ] Nome della collezione Firebase definito
- [ ] Tipo TypeScript creato in `src/types/index.ts`
- [ ] Campi obbligatori identificati (contrassegnati con `*`)
- [ ] Campi opzionali identificati
- [ ] Relazioni con altre collezioni (dropdown) definite
- [ ] Icona Lucide scelta
- [ ] Nome del componente deciso (PascalCase)
- [ ] Posizione nel menu Dashboard definita
- [ ] Permessi utente definiti (admin/user)

---

## 🎯 Standard di Qualità

### Validazioni
- Validare sempre i campi obbligatori lato client
- Mostrare messaggi di errore chiari in italiano
- Email: usare regex di validazione
- Numeri: limitare lunghezza dove appropriato (es. P.IVA 11 caratteri)

### Performance
- Usare `loading` state per feedback visivo
- Gestire errori con try/catch
- Usare `useEffect` con array dipendenze appropriato

### UX
- Confermare sempre eliminazioni con `confirm()`
- Reset form dopo operazioni CRUD
- Ricaricare dati dopo modifiche
- Mostrare stato "Filtri attivi" quando applicati
- Feedback visivo su hover dei pulsanti

### Accessibilità
- Usare `title` attribute sui pulsanti
- Label appropriate per tutti i campi
- Placeholder descrittivi
- Colori con contrasto sufficiente

---

## 📚 Riferimenti

- **Componente di riferimento**: `src/components/FornitoriManagement.tsx`
- **Pattern UI**: Stesso stile di TodoList.tsx e SettoriManagement.tsx
- **Colore tema**: `#8d9c71`
- **Libreria icone**: Lucide React
- **Libreria export**: XLSX
- **Database**: Firebase Firestore

---

**Ultimo aggiornamento**: 08/01/2026
**Versione**: 1.0
