'use client';

import { useState } from 'react';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Database, Plus } from 'lucide-react';

export default function UnitaSeeder() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const unitaData = [
    { nome: "Appartamento 1", descrizione: "Aura" },
    { nome: "Appartamento 2", descrizione: "Aqua" },
    { nome: "Appartamento 3", descrizione: "Arya" },
    { nome: "Appartamento 4", descrizione: "Lynfa" },
    { nome: "Appartamento 5", descrizione: "Anyma" },
    { nome: "SalaComune", descrizione: "SalaComune" },
    { nome: "LocaleTecnico", descrizione: "LocaleTecnico" },
    { nome: "Portico", descrizione: "Portico" },
    { nome: "Giardno", descrizione: "Giardino" }
  ];

  const insertUnita = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      unitaData.forEach((unita) => {
        const docRef = doc(collection(db, 'Unita'));
        batch.set(docRef, {
          'nomeunità': unita.nome,
          'descrizioneunita': unita.descrizione,
          createdAt: new Date()
        });
      });
      
      await batch.commit();
      setSuccess(true);
      console.log('✅ Tutte le unità inserite con successo!');
    } catch (error) {
      console.error('❌ Errore nell\'inserimento:', error);
      alert('Errore nell\'inserimento dei dati');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <h3 className="text-green-800 font-medium">✅ Unità inserite con successo!</h3>
        <p className="text-green-600 text-sm mt-1">
          {unitaData.length} unità sono state create nella collezione "Unita"
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <div className="flex items-center mb-3">
        <Database className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-blue-800 font-medium">Inserisci Dati Unità</h3>
      </div>
      
      <p className="text-blue-600 text-sm mb-4">
        Inserirà {unitaData.length} unità nella collezione "Unita" di Firestore
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-xs">
        {unitaData.map((unita, index) => (
          <div key={index} className="bg-white p-2 rounded border">
            <strong>{unita.nome}</strong> - {unita.descrizione}
          </div>
        ))}
      </div>
      
      <button
        onClick={insertUnita}
        disabled={loading}
        className="flex items-center px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{backgroundColor: '#8d9c71'}}
      >
        <Plus className="h-4 w-4 mr-2" />
        {loading ? 'Inserimento in corso...' : 'Inserisci Tutte le Unità'}
      </button>
    </div>
  );
}