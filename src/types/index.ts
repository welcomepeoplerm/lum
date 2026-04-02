export interface Acquisto {
  id: string;
  descrizioneBreve: string;
  testo: string;
  oggettoSpesa: string;
  fornitoreId: string; // FK Fornitore
  imponibile: number;
  aliquotaIVA: number; // percentuale (es. 22)
  importoTotale: number;
  numeroDocumento: string;
  dataDocumento: Date;
  dataScadenza: Date;
  statoPagamento: 'Pagato' | 'Da Pagare' | 'In Scadenza' | 'Contestato';
  metodoPagamento: 'Bonifico' | 'Carta di Credito' | 'RID' | 'Contanti';
  categoriaSpesaId: string; // FK Settore
  note?: string;
  createdAt: Date;
  userId: string;
}
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface Todo {
  id: string;
  lavorodaeseguire: string;
  datainserimento: Date;
  dataesecuzione: Date | null;
  Note: string;
  Eseguito: boolean;
  unita?: string; // Relazione con collezione Unita (opzionale)
  userId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'user';
}

export interface Unita {
  id: string;
  'nomeunità': string;
  'descrizioneunita': string;
  createdAt?: Date;
}

export interface Ricarica {
  id: string;
  dataRicarica: Date;
  litriRicarica: number;
  importoRicaricato: number;
  indicatoreRicarica: number;
  indicatoreRicaricato: number;
  diffRicaricata: number; // Calcolato: indicatoreRicaricato - indicatoreRicarica
  pagato: boolean;
  dataPagamento?: Date | null;
  createdAt: Date;
  userId: string;
}

export interface Scadenza {
  id: string;
  titolo: string;
  descrizione?: string;
  categoria: 'tributi' | 'bollette' | 'manutenzione' | 'documenti';
  dataScadenza: Date;
  importo?: number;
  ricorrente: boolean;
  frequenza?: 'mensile' | 'trimestrale' | 'semestrale' | 'annuale';
  priorita: 'bassa' | 'media' | 'alta' | 'critica';
  completata: boolean;
  dataCompletamento?: Date | null;
  note?: string;
  createdAt: Date;
  userId: string;
  emails: string[]; // Nuovo campo: array di email associate
}

export interface Settore {
  id: string;
  nome: string;
  createdAt: Date;
  userId: string;
}

export interface Fornitore {
  id: string;
  ragioneSociale: string;
  settoreId: string; // ID del settore dalla collezione settori
  referente: string;
  telefono?: string;
  mobile?: string;
  email: string;
  sedeLegale?: string;
  codiceFiscale?: string;
  partitaIva?: string;
  note?: string;
  attivo: boolean;
  createdAt: Date;
  userId: string;
}

export interface Contatto {
  id: string;
  nominativo: string;
  telefono?: string;
  mobile?: string;
  indirizzo?: string;
  competenza?: string;
  createdAt: Date;
  userId: string;
}

export interface Manutenzione {
  id: string;
  descrizioneBreve: string;
  oggetto: string;
  fornitoreId: string; // FK Fornitore
  imponibile: number;
  aliquotaIVA: number; // percentuale (es. 22)
  importoTotale: number;
  numeroDocumento: string;
  dataInizio: Date;
  dataFine: Date;
  statoPagamento: 'Pagato' | 'Da Pagare' | 'In Scadenza' | 'Contestato';
  metodoPagamento: 'Bonifico' | 'Carta di Credito' | 'RID' | 'Contanti';
  categoriaSpesaId: string; // FK Settore
  note?: string;
  scadenzaId?: string; // FK Scadenza collegata
  createdAt: Date;
  userId: string;
}

export interface LetturaAcqua {
  id: string;
  dataLettura: Date;
  letturaContatore: string;
  reale: boolean; // default true
  dataComunicazione: Date | null;
  m3LetturaPrecedente: number; // Differenza tra lettura corrente e precedente
  createdAt: Date;
  userId: string;
}

export interface Utenza {
  id: string;
  portale: string;
  categoria: string;
  utente: string;
  password: string; // stored AES-GCM encrypted
  email: string;
  codiceSicurezza: string; // stored AES-GCM encrypted
  link: string;
  pin: string; // stored AES-GCM encrypted
  puk: string; // stored AES-GCM encrypted
  note?: string;
  createdAt: Date;
  userId: string;
}