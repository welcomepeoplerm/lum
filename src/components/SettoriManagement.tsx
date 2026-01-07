'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Settore } from '@/types';
import { Plus, Edit2, Trash2, Save, X, Download, Printer, Building } from 'lucide-react';
import * as XLSX from 'xlsx';

const SETTORI_PREDEFINITI = [
  'Elettricità',
  'Edilizia', 
  'Piscina',
  'Giardino',
  'Pulizie',
  'Falegnameria'
];

export default function SettoriManagement() {
  const [settori, setSettori] = useState<Settore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: ''
  });
  const { user } = useAuth();

  const loadSettori = async () => {
    try {
      setLoading(true);
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
      alert('Errore nel caricamento dei settori');
    } finally {
      setLoading(false);
    }
  };

  const seedSettori = async () => {
    if (!user?.id) return;
    
    try {
      for (const nome of SETTORI_PREDEFINITI) {
        // Controlla se il settore esiste già
        const esistente = settori.find(s => s.nome.toLowerCase() === nome.toLowerCase());
        if (!esistente) {
          await addDoc(collection(db, 'settori'), {
            nome,
            createdAt: new Date(),
            userId: user.id
          });
        }
      }
      await loadSettori();
    } catch (error) {
      console.error('Errore nell\'inizializzazione dei settori:', error);
      alert('Errore nell\'inizializzazione dei settori');
    }
  };

  useEffect(() => {
    loadSettori();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.nome.trim()) return;

    try {
      if (editingId) {
        // Modifica esistente
        const settoreRef = doc(db, 'settori', editingId);
        await updateDoc(settoreRef, {
          nome: formData.nome.trim()
        });
      } else {
        // Nuovo settore
        await addDoc(collection(db, 'settori'), {
          nome: formData.nome.trim(),
          createdAt: new Date(),
          userId: user.id
        });
      }
      
      setFormData({ nome: '' });
      setShowForm(false);
      setEditingId(null);
      await loadSettori();
    } catch (error) {
      console.error('Errore nel salvare il settore:', error);
      alert('Errore nel salvare il settore');
    }
  };

  const handleEdit = (settore: Settore) => {
    setFormData({
      nome: settore.nome
    });
    setEditingId(settore.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo settore?')) return;

    try {
      await deleteDoc(doc(db, 'settori', id));
      await loadSettori();
    } catch (error) {
      console.error('Errore nell\'eliminazione del settore:', error);
      alert('Errore nell\'eliminazione del settore');
    }
  };

  const resetForm = () => {
    setFormData({ nome: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const exportToExcel = () => {
    if (settori.length === 0) {
      alert('Nessun dato da esportare');
      return;
    }

    const dataForExport = settori.map((settore, index) => ({
      'N.': index + 1,
      'Nome Settore': settore.nome,
      'Data Creazione': settore.createdAt.toLocaleDateString('it-IT')
    }));

    // Aggiungi statistiche
    const stats = [
      { 'N.': '', 'Nome Settore': '', 'Data Creazione': '' },
      { 'N.': 'STATISTICHE', 'Nome Settore': '', 'Data Creazione': '' },
      { 'N.': 'Totale settori:', 'Nome Settore': settori.length.toString(), 'Data Creazione': '' }
    ];

    const finalData = [...dataForExport, ...stats];

    const ws = XLSX.utils.json_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    
    // Imposta la larghezza delle colonne
    ws['!cols'] = [
      { wch: 5 },  // N.
      { wch: 25 }, // Nome Settore
      { wch: 15 }  // Data Creazione
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Settori');
    
    const fileName = `settori_fornitori_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const printTable = () => {
    if (settori.length === 0) {
      alert('Nessun dato da stampare');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Settori Fornitori - ${new Date().toLocaleDateString('it-IT')}</title>
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
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px 8px; 
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
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 Settori Fornitori</h1>
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
                <th style="width: 8%;">N.</th>
                <th style="width: 70%;">Nome Settore</th>
                <th style="width: 22%;">Data Creazione</th>
              </tr>
            </thead>
            <tbody>
              ${settori.map((settore, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${settore.nome}</strong></td>
                  <td>${settore.createdAt.toLocaleDateString('it-IT')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="stats">
            <h3>📊 Riepilogo</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">${settori.length}</div>
                <div class="stat-label">Settori totali</div>
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
        <div className="text-lg">Caricamento settori...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Settori</h1>
          <p className="text-gray-600">Gestisci i settori dei fornitori</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {settori.length === 0 && (
            <button
              onClick={seedSettori}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
            >
              Inizializza Settori
            </button>
          )}
          
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
            Nuovo Settore
          </button>
        </div>
      </div>

      {/* Tabella Settori */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome Settore
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Creazione
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settori.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Building className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">Nessun settore trovato</p>
                      <p className="text-sm text-gray-400">Clicca "Inizializza Settori" per aggiungere i settori predefiniti</p>
                    </div>
                  </td>
                </tr>
              ) : (
                settori.map((settore) => (
                  <tr key={settore.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {settore.nome}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {settore.createdAt.toLocaleDateString('it-IT')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(settore)}
                          className="inline-flex items-center p-2 text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(settore.id)}
                          className="inline-flex items-center p-2 text-red-600 hover:text-red-900"
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingId ? 'Modifica Settore' : 'Nuovo Settore'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Settore *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                  placeholder="Es. Elettricità"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
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