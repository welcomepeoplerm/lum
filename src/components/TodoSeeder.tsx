'use client';

import { useState } from 'react';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Database, Plus } from 'lucide-react';

export default function TodoSeeder() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const todoSampleData = [
    {
      lavorodaeseguire: "Controllo impianto elettrico appartamento 1",
      Note: "Verificare interruttore bagno principale",
      Eseguito: false
    },
    {
      lavorodaeseguire: "Pulizia approfondita sala comune",
      Note: "Includere pavimenti, finestre e sanitari",
      Eseguito: true
    },
    {
      lavorodaeseguire: "Manutenzione giardino e potatura siepi",
      Note: "Controllare sistema irrigazione",
      Eseguito: false
    },
    {
      lavorodaeseguire: "Verifica caldaia appartamento 2",
      Note: "Controllo pressione e pulizia filtri",
      Eseguito: false
    },
    {
      lavorodaeseguire: "Riparazione rubinetto cucina appartamento 3",
      Note: "Sostituire guarnizioni se necessario",
      Eseguito: true
    }
  ];

  const insertTodoSamples = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const now = new Date();
      
      todoSampleData.forEach((todoData, index) => {
        const docRef = doc(collection(db, 'todos'));
        const insertDate = new Date(now.getTime() - (index * 24 * 60 * 60 * 1000)); // Distribuiti negli ultimi giorni
        
        batch.set(docRef, {
          lavorodaeseguire: todoData.lavorodaeseguire,
          datainserimento: insertDate,
          dataesecuzione: todoData.Eseguito ? new Date(insertDate.getTime() + (6 * 60 * 60 * 1000)) : null, // 6 ore dopo se completato
          Note: todoData.Note,
          Eseguito: todoData.Eseguito,
          userId: user.id
        });
      });
      
      await batch.commit();
      setSuccess(true);
      console.log('✅ Collezione todos creata con dati di esempio!');
    } catch (error) {
      console.error('❌ Errore nella creazione della collezione:', error);
      alert('Errore nella creazione dei dati di esempio');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <h3 className="text-green-800 font-medium">✅ Collezione Todos Creata!</h3>
        <p className="text-green-600 text-sm mt-1">
          {todoSampleData.length} record di esempio inseriti con tutti i campi richiesti
        </p>
        <div className="mt-2 text-xs text-green-600">
          <strong>Campi creati:</strong> lavorodaeseguire, datainserimento, dataesecuzione, Note, Eseguito
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <div className="flex items-center mb-3">
        <Database className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-blue-800 font-medium">Crea Collezione Todos</h3>
      </div>
      
      <p className="text-blue-600 text-sm mb-4">
        Crea la collezione "todos" su Firebase con la struttura corretta e {todoSampleData.length} dati di esempio
      </p>
      
      <div className="bg-white p-3 rounded border text-xs mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Struttura Collezione:</h4>
        <ul className="space-y-1 text-gray-600">
          <li><strong>lavorodaeseguire:</strong> string - Descrizione del lavoro</li>
          <li><strong>datainserimento:</strong> timestamp - Data creazione automatica</li>
          <li><strong>dataesecuzione:</strong> timestamp - Data completamento (null se non eseguito)</li>
          <li><strong>Note:</strong> string - Note aggiuntive opzionali</li>
          <li><strong>Eseguito:</strong> boolean - Stato (true/false per dropdown Si/No)</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 gap-1 mb-4 text-xs">
        <div className="font-medium text-blue-800">Dati di esempio che verranno inseriti:</div>
        {todoSampleData.map((todo, index) => (
          <div key={index} className="bg-white p-2 rounded border">
            <div className="font-medium">{todo.lavorodaeseguire}</div>
            <div className="text-gray-500">{todo.Note}</div>
            <div className={`text-xs ${todo.Eseguito ? 'text-green-600' : 'text-orange-600'}`}>
              Stato: {todo.Eseguito ? 'Completato' : 'Da eseguire'}
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={insertTodoSamples}
        disabled={loading || !user}
        className="flex items-center px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{backgroundColor: '#8d9c71'}}
      >
        <Plus className="h-4 w-4 mr-2" />
        {loading ? 'Creazione in corso...' : 'Crea Collezione e Dati'}
      </button>
      
      {!user && (
        <p className="text-red-600 text-xs mt-2">Devi essere loggato per creare la collezione</p>
      )}
    </div>
  );
}