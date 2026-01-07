'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Todo, Scadenza } from '@/types';
import TodoList from '@/components/TodoList';
import UserManagement from '@/components/UserManagement';
import RicaricaManagement from '@/components/RicaricaManagement';
import ScadenzarioManager from '@/components/ScadenzarioManager';
import SettoriManagement from '@/components/SettoriManagement';
import DocumentManagement from '@/components/DocumentManagement';
import ChangePassword from '@/components/ChangePassword';
import { 
  LayoutDashboard, 
  Users, 
  List, 
  LogOut, 
  Menu,
  X,
  Home,
  Droplets,
  Calendar,
  Lock,
  Building,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'todos' | 'users' | 'ricariche' | 'scadenzario' | 'fornitori' | 'settori' | 'documenti'>('overview');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [ricariche, setRicariche] = useState<any[]>([]);
  const [ricaricheLoading, setRicaricheLoading] = useState(true);
  const [scadenze, setScadenze] = useState<Scadenza[]>([]);
  const [scadenzeLoading, setScadenzeLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scadenzarioFilter, setScadenzarioFilter] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [fornitoriSubmenuOpen, setFornitoriSubmenuOpen] = useState(false);
  const { user, logout } = useAuth();

  // Carica i todos per il conteggio nella dashboard
  const loadTodos = async () => {
    try {
      setTodosLoading(true);
      const querySnapshot = await getDocs(collection(db, 'todos'));
      const todosData: Todo[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        todosData.push({
          id: doc.id,
          lavorodaeseguire: data.lavorodaeseguire || data.attivita || '',
          datainserimento: data.datainserimento ? data.datainserimento.toDate() : (data.dataInserimento ? data.dataInserimento.toDate() : new Date()),
          Eseguito: data.Eseguito !== undefined ? data.Eseguito : (data.fatto || false), // Use correct field name and boolean
          unita: data.unita || '',
          userId: data.userId || '',
          dataesecuzione: data.dataesecuzione ? data.dataesecuzione.toDate() : null,
          Note: data.Note || data.note || ''
        });
      });
      
      setTodos(todosData);
    } catch (error) {
      console.error('Errore nel caricamento dei todos:', error);
    } finally {
      setTodosLoading(false);
    }
  };

  // Carica le ricariche per il conteggio nella dashboard
  const loadRicariche = async () => {
    try {
      setRicaricheLoading(true);
      const querySnapshot = await getDocs(collection(db, 'ricariche'));
      const ricaricheData: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ricaricheData.push({
          id: doc.id,
          importoRicaricato: data.importoRicaricato || 0, // Use correct field name
          dataRicarica: data.dataRicarica ? data.dataRicarica.toDate() : new Date(),
          ...data
        });
      });
      
      setRicariche(ricaricheData);
    } catch (error) {
      console.error('Errore nel caricamento delle ricariche:', error);
    } finally {
      setRicaricheLoading(false);
    }
  };

  // Carica le scadenze per il conteggio nella dashboard
  const loadScadenze = async () => {
    try {
      setScadenzeLoading(true);
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
          userId: data.userId || user?.id || ''
        });
      });
      
      setScadenze(scadenzeData);
    } catch (error) {
      console.error('Errore nel caricamento delle scadenze:', error);
    } finally {
      setScadenzeLoading(false);
    }
  };

  // Carica gli utenti per il conteggio nella dashboard
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          ...data
        });
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Funzioni helper per le scadenze
  const isScadenzaImminente = (dataScadenza: Date) => {
    const oggi = new Date();
    const diffDays = Math.ceil((dataScadenza.getTime() - oggi.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isScadenzaScaduta = (dataScadenza: Date) => {
    const oggi = new Date();
    return dataScadenza < oggi;
  };

  // Funzione per navigare allo scadenzario con filtro
  const navigateToScadenzario = (filter: string) => {
    setScadenzarioFilter(filter);
    setActiveTab('scadenzario');
  };

  useEffect(() => {
    loadTodos();
    loadRicariche();
    loadScadenze();
    loadUsers();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const navigation = [
    { 
      name: 'Dashboard', 
      key: 'overview' as const, 
      icon: LayoutDashboard,
      adminOnly: false
    },
    { 
      name: 'To-Do List', 
      key: 'todos' as const, 
      icon: List,
      adminOnly: false
    },
    { 
      name: 'Ricariche GAS', 
      key: 'ricariche' as const, 
      icon: Droplets,
      adminOnly: false
    },
    { 
      name: 'Scadenzario', 
      key: 'scadenzario' as const, 
      icon: Calendar,
      adminOnly: false
    },
    { 
      name: 'Documenti', 
      key: 'documenti' as const, 
      icon: FileText,
      adminOnly: false
    },
    { 
      name: 'Fornitori', 
      key: 'fornitori' as const, 
      icon: Building,
      adminOnly: true,
      hasSubmenu: true,
      submenu: [
        { name: 'Gestione', key: 'fornitori' as const },
        { name: 'Settori', key: 'settori' as const }
      ]
    },
    { 
      name: 'Gestione Utenti', 
      key: 'users' as const, 
      icon: Users,
      adminOnly: true
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200" style={{backgroundColor: '#8d9c71'}}>
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-10 h-10"
              style={{color: '#ffffff'}}
            >
              <path d="M2 21h20" />
              <path d="M5 21V10l7-5l4 2.857" />
              <path d="M12 5v16" />
              <path d="M16 21V12.5l4 2V21" />
              <path d="M8 21v-3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3" />
              <path d="M18 16h.01" strokeWidth="2"/>
              <path d="M16 6h2v3l-1.5 1" />
            </svg>
            <h1 className="ml-2 text-xl font-semibold" style={{color: '#ffffff'}}>LUM</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6" style={{color: '#ffffff'}} />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {filteredNavigation.map((item) => (
            <div key={item.key}>
              {item.hasSubmenu ? (
                // Menu con submenu
                <>
                  <button
                    onClick={() => setFornitoriSubmenuOpen(!fornitoriSubmenuOpen)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      (activeTab === 'fornitori' || activeTab === 'settori')
                        ? 'text-white' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={(activeTab === 'fornitori' || activeTab === 'settori') ? {backgroundColor: '#8d9c71'} : {}}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    {fornitoriSubmenuOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {fornitoriSubmenuOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu?.map((subItem) => (
                        <button
                          key={subItem.key}
                          onClick={() => {
                            setActiveTab(subItem.key);
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                            activeTab === subItem.key
                              ? 'bg-gray-200 text-gray-900'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {subItem.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Menu normale
                <button
                  onClick={() => {
                    setActiveTab(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === item.key
                      ? 'text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={activeTab === item.key ? {backgroundColor: '#8d9c71'} : {}}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              )}
            </div>
          ))}
          
          {/* Pulsante Cambia Password sopra alla sezione Admin */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer hover:bg-gray-50"
              style={{color: '#8d9c71', border: '2px solid #8d9c71'}}
            >
              <Lock className="mr-3 h-5 w-5" />
              Cambia Password
            </button>
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#8d9c71'}}>
              <span className="text-white text-sm font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shadow-sm border-b border-gray-200" style={{backgroundColor: '#8d9c71'}}>
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden cursor-pointer"
            >
              <Menu className="h-6 w-6" style={{color: '#ffffff'}} />
            </button>
            
            <h2 className="text-xl font-semibold capitalize" style={{color: '#ffffff'}}>
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'todos' && 'To-Do List'}
              {activeTab === 'ricariche' && 'Ricariche GAS'}              {activeTab === 'scadenzario' && 'Scadenzario'}              {activeTab === 'documenti' && 'Gestione Documentale'}
              {activeTab === 'fornitori' && 'Gestione Fornitori'}
              {activeTab === 'settori' && 'Settori Fornitori'}
              {activeTab === 'users' && 'Gestione Utenti'}
            </h2>
            
            <div className="text-sm" style={{color: '#ffffff'}}>
              {new Date().toLocaleDateString('it-IT', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Lyfe Umbria Manager: Benvenuto, {user?.name}!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Sistema di gestione per il casale turistico. Utilizza il menu laterale per navigare tra le diverse sezioni.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg" style={{backgroundColor: '#fff8f0'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-8 w-8" style={{color: '#ea580c'}} />
                          <div className="ml-3">
                            <h4 className="text-lg font-medium" style={{color: '#46433c'}}>Scadenzario</h4>
                            <p className="text-sm" style={{color: '#ea580c'}}>Gestione scadenze e promemoria</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {scadenzeLoading ? (
                            <div className="text-sm text-gray-500">Caricamento...</div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between space-x-4">
                                <div className="text-center">
                                  <button
                                    onClick={() => navigateToScadenzario('scadute')}
                                    className="block hover:opacity-80 transition-opacity cursor-pointer"
                                  >
                                    <div className="text-sm font-medium" style={{color: '#dc2626'}}>Scadute</div>
                                    <div className="text-2xl font-bold" style={{color: '#dc2626'}}>
                                      {scadenze.filter(s => !s.completata && isScadenzaScaduta(s.dataScadenza)).length}
                                    </div>
                                  </button>
                                </div>
                                <div className="text-center">
                                  <button
                                    onClick={() => navigateToScadenzario('imminenti')}
                                    className="block hover:opacity-80 transition-opacity cursor-pointer"
                                  >
                                    <div className="text-sm font-medium" style={{color: '#ea580c'}}>Imminenti</div>
                                    <div className="text-2xl font-bold" style={{color: '#ea580c'}}>
                                      {scadenze.filter(s => !s.completata && isScadenzaImminente(s.dataScadenza)).length}
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{backgroundColor: '#f0f2ec'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <List className="h-8 w-8" style={{color: '#8d9c71'}} />
                          <div className="ml-3">
                            <h4 className="text-lg font-medium" style={{color: '#46433c'}}>To-Do List</h4>
                            <p className="text-sm" style={{color: '#8d9c71'}}>Gestisci le attività del casale</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {todosLoading ? (
                            <div className="text-sm text-gray-500">Caricamento...</div>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-sm" style={{color: '#46433c'}}>
                                <span className="font-medium">Eseguite:</span> {todos.filter(t => t.Eseguito === true).length}
                              </div>
                              <div className="text-sm" style={{color: '#46433c'}}>
                                <span className="font-medium">Non eseguite:</span> {todos.filter(t => t.Eseguito === false).length}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{backgroundColor: '#fdf6f0'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Droplets className="h-8 w-8" style={{color: '#d17f3d'}} />
                          <div className="ml-3">
                            <h4 className="text-lg font-medium" style={{color: '#46433c'}}>Ricariche GAS</h4>
                            <p className="text-sm" style={{color: '#d17f3d'}}>Gestisci le ricariche GAS</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {ricaricheLoading ? (
                            <div className="text-sm text-gray-500">Caricamento...</div>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-sm" style={{color: '#46433c'}}>
                                <span className="font-medium">Totale:</span> {ricariche.length}
                              </div>
                              <div className="text-sm" style={{color: '#46433c'}}>
                                <span className="font-medium">Speso:</span> €{ricariche.reduce((sum, r) => sum + (parseFloat(r.importoRicaricato) || 0), 0).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg" style={{backgroundColor: '#f2f1f0'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-8 w-8" style={{color: '#46433c'}} />
                          <div className="ml-3">
                            <h4 className="text-lg font-medium" style={{color: '#46433c'}}>Gestione Utenti</h4>
                            <p className="text-sm" style={{color: '#8d9c71'}}>Visualizza gli utenti del sistema</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {usersLoading ? (
                            <div className="text-sm text-gray-500">Caricamento...</div>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-sm" style={{color: '#46433c'}}>
                                <span className="font-medium">Totale:</span> {users.length}
                              </div>
                              <div className="text-sm" style={{color: '#46433c'}}>
                                <span className="font-medium">Admin:</span> {users.filter(u => u.role === 'admin').length}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card grafico To-Do List */}
                  <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <List className="h-6 w-6" style={{color: '#8d9c71'}} />
                          <h3 className="ml-2 text-lg leading-6 font-medium text-gray-900">Statistiche To-Do List</h3>
                        </div>
                        <div className="text-sm text-gray-500">
                          Totale: {todos.length} attività
                        </div>
                      </div>
                      
                      {todosLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="text-sm text-gray-500">Caricamento statistiche...</div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Grafico a torta */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-700">Grafico attività</h4>
                            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg p-4">
                              <div className="relative w-32 h-32">
                                {/* Grafico a torta SVG */}
                                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                                  {todos.length > 0 && (
                                    <>
                                      {/* Sezione completate */}
                                      <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="transparent"
                                        stroke="#8d9c71"
                                        strokeWidth="12"
                                        strokeDasharray={`${((todos.filter(t => t.Eseguito === true).length / todos.length) * 251.2)} 251.2`}
                                        strokeDashoffset="0"
                                        className="transition-all duration-500"
                                      />
                                      {/* Sezione da fare */}
                                      <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="transparent"
                                        stroke="#d17f3d"
                                        strokeWidth="12"
                                        strokeDasharray={`${((todos.filter(t => t.Eseguito === false).length / todos.length) * 251.2)} 251.2`}
                                        strokeDashoffset={`-${((todos.filter(t => t.Eseguito === true).length / todos.length) * 251.2)}`}
                                        className="transition-all duration-500"
                                      />
                                    </>
                                  )}
                                  {todos.length === 0 && (
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      fill="transparent"
                                      stroke="#e5e7eb"
                                      strokeWidth="12"
                                    />
                                  )}
                                </svg>
                                
                                {/* Testo al centro */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <div className="text-lg font-bold" style={{color: '#46433c'}}>
                                    {todos.length}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Totale
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Legenda */}
                            <div className="flex justify-center space-x-6 mt-4">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: '#8d9c71'}}></div>
                                <span className="text-xs text-gray-600">
                                  Eseguite ({todos.filter(t => t.Eseguito === true).length})
                                </span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: '#d17f3d'}}></div>
                                <span className="text-xs text-gray-600">
                                  Da fare ({todos.filter(t => t.Eseguito === false).length})
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Statistiche percentuali */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-700">Riepilogo percentuali</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-4 rounded-lg" style={{backgroundColor: '#f0f2ec'}}>
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: '#8d9c71'}}></div>
                                  <span className="text-sm font-medium" style={{color: '#46433c'}}>Completate</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold" style={{color: '#8d9c71'}}>
                                    {todos.length > 0 ? Math.round((todos.filter(t => t.Eseguito === true).length / todos.length) * 100) : 0}%
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {todos.filter(t => t.Eseguito === true).length} di {todos.length}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between p-4 rounded-lg" style={{backgroundColor: '#fdf6f0'}}>
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: '#d17f3d'}}></div>
                                  <span className="text-sm font-medium" style={{color: '#46433c'}}>In sospeso</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold" style={{color: '#d17f3d'}}>
                                    {todos.length > 0 ? Math.round((todos.filter(t => t.Eseguito === false).length / todos.length) * 100) : 0}%
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {todos.filter(t => t.Eseguito === false).length} di {todos.length}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Card grafico Ricariche GAS per anno */}
                  <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <Droplets className="h-6 w-6" style={{color: '#d17f3d'}} />
                          <h3 className="ml-2 text-lg leading-6 font-medium text-gray-900">Ricariche GAS per Anno</h3>
                        </div>
                        <div className="text-sm text-gray-500">
                          Analisi temporale
                        </div>
                      </div>
                      
                      {ricaricheLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="text-sm text-gray-500">Caricamento dati annuali...</div>
                        </div>
                      ) : (
                        (() => {
                          // Raggruppa ricariche per anno
                          const ricarichePerAnno = ricariche.reduce((acc, ricarica) => {
                            let anno;
                            try {
                              // Gestisci diversi formati di data
                              if (ricarica.dataRicarica && typeof ricarica.dataRicarica.getFullYear === 'function') {
                                anno = ricarica.dataRicarica.getFullYear();
                              } else if (ricarica.dataRicarica && ricarica.dataRicarica.toDate) {
                                // Se è un Timestamp di Firestore
                                anno = ricarica.dataRicarica.toDate().getFullYear();
                              } else {
                                anno = new Date().getFullYear();
                              }
                            } catch (error) {
                              console.error('Errore nel parsing della data:', error);
                              anno = new Date().getFullYear();
                            }
                            
                            if (!acc[anno]) {
                              acc[anno] = { count: 0, totale: 0 };
                            }
                            acc[anno].count += 1;
                            acc[anno].totale += parseFloat(ricarica.importoRicaricato) || 0;
                            return acc;
                          }, {} as Record<number, { count: number; totale: number }>);
                          
                          const anni = Object.keys(ricarichePerAnno).map(Number).sort();
                          const maxRicariche = Math.max(...Object.values(ricarichePerAnno).map((data: any) => data.count), 1);
                          
                          return (
                            <div className="space-y-6">
                              {anni.length > 0 ? (
                                <div className="bg-gray-50 rounded-lg p-6">
                                  <h4 className="text-sm font-medium text-gray-700 mb-4">Ricariche per anno</h4>
                                  <div className="flex items-end justify-center space-x-4 h-48">
                                    {anni.map(anno => {
                                      const data = ricarichePerAnno[anno];
                                      const altezzaBarra = (data.count / maxRicariche) * 160;
                                      return (
                                        <div key={anno} className="flex flex-col items-center space-y-3 flex-1 max-w-24">
                                          {/* Importo totale sopra la barra */}
                                          <div className="text-center mb-2">
                                            <div className="text-xs font-bold" style={{color: '#d17f3d'}}>
                                              €{data.totale.toFixed(0)}
                                            </div>
                                          </div>
                                          
                                          {/* Barra */}
                                          <div 
                                            className="w-full rounded-t-lg transition-all duration-500 shadow-sm relative"
                                            style={{
                                              backgroundColor: '#d17f3d',
                                              height: `${Math.max(altezzaBarra, 12)}px`,
                                            }}
                                          >
                                            {/* Numero ricariche sulla barra */}
                                            <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
                                              <div className="text-xs font-bold text-white">
                                                {data.count}
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Anno */}
                                          <div className="text-center">
                                            <div className="text-sm font-medium text-gray-700">
                                              {anno}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  Nessuna ricarica registrata
                                </div>
                              )}
                              
                              {/* Riepilogo totali */}
                              {anni.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                                    <div className="text-center">
                                      <div className="text-sm text-orange-600 font-medium">Totale generale</div>
                                      <div className="text-2xl font-bold" style={{color: '#d17f3d'}}>
                                        €{(Object.values(ricarichePerAnno) as any[]).reduce((sum, data: any) => sum + data.totale, 0).toFixed(2)}
                                      </div>
                                      <div className="text-xs text-orange-500">
                                        {(Object.values(ricarichePerAnno) as any[]).reduce((sum, data: any) => sum + data.count, 0)} ricariche totali
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                    <div className="text-center">
                                      <div className="text-sm text-green-600 font-medium">Anno più attivo</div>
                                      <div className="text-2xl font-bold" style={{color: '#8d9c71'}}>
                                        {anni.reduce((maxAnno, anno) => 
                                          ricarichePerAnno[anno].count > ricarichePerAnno[maxAnno].count ? anno : maxAnno
                                        )}
                                      </div>
                                      <div className="text-xs text-green-500">
                                        {ricarichePerAnno[anni.reduce((maxAnno, anno) => 
                                          ricarichePerAnno[anno].count > ricarichePerAnno[maxAnno].count ? anno : maxAnno
                                        )].count} ricariche
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                                    <div className="text-center">
                                      <div className="text-sm text-gray-600 font-medium">Media annuale</div>
                                      <div className="text-2xl font-bold" style={{color: '#46433c'}}>
                                        €{anni.length > 0 ? ((Object.values(ricarichePerAnno) as any[]).reduce((sum, data: any) => sum + data.totale, 0) / anni.length).toFixed(0) : '0'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        per anno
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'todos' && <TodoList />}
          {activeTab === 'ricariche' && <RicaricaManagement />}
          {activeTab === 'scadenzario' && <ScadenzarioManager initialFilter={scadenzarioFilter} onFilterChange={() => setScadenzarioFilter(null)} />}
          {activeTab === 'documenti' && <DocumentManagement />}
          {activeTab === 'settori' && user?.role === 'admin' && <SettoriManagement />}
          {activeTab === 'fornitori' && user?.role === 'admin' && (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Gestione Fornitori</h2>
              <p className="text-gray-600">Funzionalità in arrivo...</p>
            </div>
          )}
          {activeTab === 'users' && user?.role === 'admin' && <UserManagement />}
        </main>
      </div>
      
      {/* Modal Cambio Password */}
      {showChangePassword && (
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}