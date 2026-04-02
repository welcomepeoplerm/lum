'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import {
  Avatar,
  Badge,
  Body1,
  Body1Strong,
  Button,
  Caption1,
  Card,
  Divider,
  FluentProvider,
  Spinner,
  Subtitle1,
  Title3,
  makeStyles,
  tokens,
  webLightTheme,
} from '@fluentui/react-components';
import {
  AppsListRegular,
  CalendarLtrRegular,
  ChevronDownRegular,
  ChevronRightRegular,
  DismissRegular,
  DocumentRegular,
  HomeRegular,
  LockClosedRegular,
  MailRegular,
  NavigationRegular,
  PeopleRegular,
  PersonCircleRegular,
  PhoneRegular,
  SignOutRegular,
} from '@fluentui/react-icons';
import { Flame, Droplet, Truck, Euro, List, Wrench, KeyRound } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { APP_VERSION } from '@/lib/version';
import type { Scadenza, Todo } from '@/types';
import TodoList from '@/components/TodoList';
import UserManagement from '@/components/UserManagement';
import RicaricaManagement from '@/components/RicaricaManagement';
import LettureAcquaManagement from '@/components/LettureAcquaManagement';
import ScadenzarioManager from '@/components/ScadenzarioManager';
import SettoriManagement from '@/components/SettoriManagement';
import FornitoriManagement from '@/components/FornitoriManagement';
import DocumentManagement from '@/components/DocumentManagement';
import AcquistiManagement from '@/components/AcquistiManagement';
import ManutenzioneManagement from '@/components/ManutenzioneManagement';
import EmailManagement from '@/components/EmailManagement';
import ContattiManagement from '@/components/ContattiManagement';
import UtenzeManagement from '@/components/UtenzeManagement';
import ChangePassword from '@/components/ChangePassword';
import SessionTimeoutWarning from '@/components/SessionTimeoutWarning';

type ActiveTab =
  | 'overview'
  | 'todos'
  | 'users'
  | 'ricariche'
  | 'lettureAcqua'
  | 'scadenzario'
  | 'fornitori'
  | 'settori'
  | 'documenti'
  | 'manutenzione'
  | 'acquisti'
  | 'email'
  | 'contatti'
  | 'utenze';

type NavParentKey = 'attivitaemanutenzione' | 'fornitori';

type NavItem = {
  name: string;
  key: ActiveTab | NavParentKey;
  icon: ReactElement;
  adminOnly: boolean;
  hasSubmenu?: boolean;
  submenu?: Array<{ name: string; key: ActiveTab }>;
};

const useStyles = makeStyles({
  appShell: {
    minHeight: '100vh',
    display: 'flex',
    backgroundColor: '#f3f6fb',
    color: '#1f2937',
  },
  sidebar: {
    width: '292px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 50,
  },
  mobileSidebar: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    transitionDuration: '180ms',
    transitionTimingFunction: 'ease',
    transitionProperty: 'transform',
    boxShadow: tokens.shadow64,
  },
  desktopSidebar: {
    '@media (max-width: 991px)': {
      display: 'none',
    },
  },
  mobileVisible: {
    transform: 'translateX(0)',
  },
  mobileHidden: {
    transform: 'translateX(-100%)',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase500,
  },
  navArea: {
    padding: '14px 12px 8px 12px',
    overflowY: 'auto',
    flex: 1,
  },
  navGroupTitle: {
    display: 'block',
    padding: '8px 10px 6px 10px',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  navButton: {
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: '6px',
    borderRadius: tokens.borderRadiusLarge,
    fontWeight: tokens.fontWeightMedium,
  },
  navButtonActive: {
    backgroundColor: '#2f5fdd',
    color: tokens.colorNeutralForegroundOnBrand,
  },
  submenuWrap: {
    margin: '0 0 8px 20px',
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingLeft: '8px',
  },
  submenuButton: {
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: '4px',
    borderRadius: tokens.borderRadiusMedium,
  },
  sidebarFooter: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '12px',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  content: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    height: '64px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  mobileMenuButton: {
    '@media (min-width: 992px)': {
      display: 'none',
    },
  },
  pageBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  pageHeaderCard: {
    marginBottom: '16px',
    borderRadius: tokens.borderRadiusXLarge,
    backgroundImage: 'linear-gradient(125deg, #ffffff 0%, #f4f7ff 100%)',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  statsGrid: {
    display: 'grid',
    gap: '14px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    marginBottom: '20px',
  },
  statCard: {
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  statCardBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px 20px 16px',
  },
  kpiIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  kpiNumber: {
    fontSize: '28px',
    fontWeight: 700 as const,
    lineHeight: 1.1,
    color: '#1a1f36',
  },
  kpiLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500 as const,
    letterSpacing: '0.02em',
  },
  kpiSub: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '1px',
  },
  kpiFooter: {
    padding: '8px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'background-color 0.15s',
  },
  kpiFooterLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500 as const,
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  iconBadge: {
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusCircular,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf0ff',
  },
  chartGrid: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: '2fr 1fr',
    '@media (max-width: 1199px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartCard: {
    borderRadius: tokens.borderRadiusXLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4,
    backgroundColor: '#ffffff',
    padding: '16px',
  },
  donutWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '220px',
  },
  donutLegend: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '8px',
  },
  legendDotDone: {
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: '#2f5fdd',
    display: 'inline-block',
    marginRight: '6px',
  },
  legendDotTodo: {
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: '#f59e0b',
    display: 'inline-block',
    marginRight: '6px',
  },
  barsWrap: {
    padding: '8px 0 4px 0',
    minHeight: '260px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
  },
  yearCol: {
    flex: 1,
    minWidth: '54px',
    textAlign: 'center',
  },
  yearBar: {
    width: '100%',
    borderTopLeftRadius: tokens.borderRadiusMedium,
    borderTopRightRadius: tokens.borderRadiusMedium,
    backgroundColor: '#2f5fdd',
    color: '#ffffff',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    borderRadius: tokens.borderRadiusXLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4,
  },
  mobileOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    zIndex: 40,
    '@media (min-width: 992px)': {
      display: 'none',
    },
  },
});

export default function Dashboard() {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [ricariche, setRicariche] = useState<any[]>([]);
  const [ricaricheLoading, setRicaricheLoading] = useState(true);
  const [lettureAcqua, setLettureAcqua] = useState<any[]>([]);
  const [lettureAcquaLoading, setLettureAcquaLoading] = useState(true);
  const [scadenze, setScadenze] = useState<Scadenza[]>([]);
  const [scadenzeLoading, setScadenzeLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [fornitori, setFornitori] = useState<any[]>([]);
  const [fornitoriLoading, setFornitoriLoading] = useState(true);
  const [acquisti, setAcquisti] = useState<any[]>([]);
  const [acquistiLoading, setAcquistiLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scadenzarioFilter, setScadenzarioFilter] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [fornitoriSubmenuOpen, setFornitoriSubmenuOpen] = useState(false);
  const [attivitaSubmenuOpen, setAttivitaSubmenuOpen] = useState(false);
  const { user, logout, showSessionWarning, sessionWarningTimeLeft, extendSession } = useAuth();

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
          datainserimento: data.datainserimento
            ? data.datainserimento.toDate()
            : data.dataInserimento
              ? data.dataInserimento.toDate()
              : new Date(),
          Eseguito: data.Eseguito !== undefined ? data.Eseguito : data.fatto || false,
          unita: data.unita || '',
          userId: data.userId || '',
          dataesecuzione: data.dataesecuzione ? data.dataesecuzione.toDate() : null,
          Note: data.Note || data.note || '',
        });
      });

      setTodos(todosData);
    } catch (error) {
      console.error('Errore nel caricamento dei todos:', error);
    } finally {
      setTodosLoading(false);
    }
  };

  const loadRicariche = async () => {
    try {
      setRicaricheLoading(true);
      const querySnapshot = await getDocs(collection(db, 'ricariche'));
      const ricaricheData: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ricaricheData.push({
          id: doc.id,
          importoRicaricato: data.importoRicaricato || 0,
          dataRicarica: data.dataRicarica ? data.dataRicarica.toDate() : new Date(),
          ...data,
        });
      });

      setRicariche(ricaricheData);
    } catch (error) {
      console.error('Errore nel caricamento delle ricariche:', error);
    } finally {
      setRicaricheLoading(false);
    }
  };

  const loadScadenze = async () => {
    try {
      setScadenzeLoading(true);
      const q = query(collection(db, 'scadenze'), orderBy('dataScadenza', 'asc'));
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
          userId: data.userId || user?.id || '',
          emails: data.emails || [],
        });
      });

      setScadenze(scadenzeData);
    } catch (error) {
      console.error('Errore nel caricamento delle scadenze:', error);
    } finally {
      setScadenzeLoading(false);
    }
  };

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
          ...data,
        });
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadLettureAcqua = async () => {
    try {
      setLettureAcquaLoading(true);
      const querySnapshot = await getDocs(collection(db, 'lettureAcqua'));
      const lettureData: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        lettureData.push({
          id: doc.id,
          dataLettura: data.dataLettura ? data.dataLettura.toDate() : new Date(),
          letturaContatore: data.letturaContatore,
          reale: data.reale,
          dataComunicazione: data.dataComunicazione ? data.dataComunicazione.toDate() : null,
          m3LetturaPrecedente: data.m3LetturaPrecedente || 0,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          ...data,
        });
      });

      setLettureAcqua(lettureData);
    } catch (error) {
      console.error('Errore nel caricamento delle letture acqua:', error);
    } finally {
      setLettureAcquaLoading(false);
    }
  };

  const loadFornitori = async () => {
    try {
      setFornitoriLoading(true);
      const querySnapshot = await getDocs(collection(db, 'fornitori'));
      const fornitoriData: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fornitoriData.push({
          id: doc.id,
          ragioneSociale: data.ragioneSociale,
          settoreId: data.settoreId,
          attivo: data.attivo,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          ...data,
        });
      });

      setFornitori(fornitoriData);
    } catch (error) {
      console.error('Errore nel caricamento dei fornitori:', error);
    } finally {
      setFornitoriLoading(false);
    }
  };

  const loadAcquisti = async () => {
    try {
      setAcquistiLoading(true);
      const querySnapshot = await getDocs(collection(db, 'acquisti'));
      const acquistiData: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        acquistiData.push({
          id: doc.id,
          importoTotale: data.importoTotale || 0,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          ...data,
        });
      });

      setAcquisti(acquistiData);
    } catch (error) {
      console.error('Errore nel caricamento degli acquisti:', error);
    } finally {
      setAcquistiLoading(false);
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

  const navigateToScadenzario = (filter: string) => {
    setScadenzarioFilter(filter);
    setActiveTab('scadenzario');
  };

  useEffect(() => {
    loadTodos();
    loadRicariche();
    loadLettureAcqua();
    loadScadenze();
    loadUsers();
    loadFornitori();
    loadAcquisti();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const navigation: NavItem[] = [
    { name: 'Dashboard', key: 'overview', icon: <HomeRegular />, adminOnly: false },
    {
      name: 'Attivita e manutenzione',
      key: 'attivitaemanutenzione',
      icon: <AppsListRegular />,
      adminOnly: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Attivita interne', key: 'todos' },
        { name: 'Manutenzione', key: 'manutenzione' },
        { name: 'Acquisti', key: 'acquisti' },
      ],
    },
    { name: 'Ricariche GAS', key: 'ricariche', icon: <Flame size={18} />, adminOnly: false },
    { name: 'Letture Acqua', key: 'lettureAcqua', icon: <Droplet size={18} />, adminOnly: false },
    { name: 'Scadenzario', key: 'scadenzario', icon: <CalendarLtrRegular />, adminOnly: false },
    { name: 'Documenti', key: 'documenti', icon: <DocumentRegular />, adminOnly: false },
    {
      name: 'Fornitori',
      key: 'fornitori',
      icon: <Truck size={18} />,
      adminOnly: true,
      hasSubmenu: true,
      submenu: [
        { name: 'Gestione', key: 'fornitori' },
        { name: 'Settori', key: 'settori' },
      ],
    },
    { name: 'Contatti', key: 'contatti', icon: <PhoneRegular />, adminOnly: true },
    { name: 'Utenze Manager', key: 'utenze', icon: <KeyRound size={18} />, adminOnly: true },
    { name: 'Gestione Utenti', key: 'users', icon: <PeopleRegular />, adminOnly: true },
    { name: 'Email', key: 'email', icon: <MailRegular />, adminOnly: true },
  ];

  const filteredNavigation = navigation.filter((item) => !item.adminOnly || user?.role === 'admin');

  const sectionTitle = useMemo(() => {
    if (activeTab === 'overview') return 'Dashboard';
    if (['todos', 'manutenzione', 'acquisti'].includes(activeTab)) return 'Attivita e manutenzione';
    if (activeTab === 'ricariche') return 'Ricariche GAS';
    if (activeTab === 'lettureAcqua') return 'Letture Acqua';
    if (activeTab === 'scadenzario') return 'Scadenzario';
    if (activeTab === 'documenti') return 'Gestione documentale';
    if (activeTab === 'fornitori') return 'Gestione fornitori';
    if (activeTab === 'settori') return 'Settori fornitori';
    if (activeTab === 'contatti') return 'Gestione contatti';
    if (activeTab === 'users') return 'Gestione utenti';
    if (activeTab === 'utenze') return 'Utenze Manager';
    return 'Gestione email';
  }, [activeTab]);

  const completedTodos = todos.filter((t) => t.Eseguito === true).length;
  const pendingTodos = todos.filter((t) => t.Eseguito === false).length;
  const scadute = scadenze.filter((s) => !s.completata && isScadenzaScaduta(s.dataScadenza)).length;
  const imminenti = scadenze.filter(
    (s) => !s.completata && isScadenzaImminente(s.dataScadenza) && !isScadenzaScaduta(s.dataScadenza),
  ).length;
  const totaleRicariche = ricariche.reduce((sum, r) => sum + (parseFloat(r.importoRicaricato) || 0), 0);
  const totaleAcquisti = acquisti.reduce((sum, a) => sum + (parseFloat(a.importoTotale) || 0), 0);

  const ricarichePerAnno = useMemo(() => {
    return ricariche.reduce((acc, ricarica) => {
      let anno: number;
      try {
        if (ricarica.dataRicarica && typeof ricarica.dataRicarica.getFullYear === 'function') {
          anno = ricarica.dataRicarica.getFullYear();
        } else if (ricarica.dataRicarica?.toDate) {
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
  }, [ricariche]);

  const anni = useMemo(() => Object.keys(ricarichePerAnno).map(Number).sort(), [ricarichePerAnno]);
  const maxRicaricheAnno = useMemo(
    () => Math.max(...(Object.values(ricarichePerAnno) as Array<{ count: number; totale: number }>).map((d) => d.count), 1),
    [ricarichePerAnno],
  );
  const currentYear = new Date().getFullYear();
  const anniGrafico = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  const maxTotaleGrafico = useMemo(
    () => Math.max(...anniGrafico.map((y) => ricarichePerAnno[y]?.totale ?? 0), 1),
    [ricarichePerAnno],
  );

  const renderMainContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <div className={styles.pageHeaderCard}>
            <Title3>Lyfe Umbria Manager</Title3>
            <Body1 style={{ marginTop: '4px' }}>Benvenuto, {user?.name}. Pannello operativo con vista sintetica.</Body1>
            <Caption1 style={{ marginTop: '6px', color: tokens.colorNeutralForeground3 }}>
              Naviga dal menu laterale per accedere alle sezioni di gestione.
            </Caption1>
          </div>

          <div className={styles.statsGrid}>
            {/* Scadenze */}
            <div className={styles.statCard}>
              <div className={styles.statCardBody}>
                <div className={styles.kpiIcon} style={{ backgroundColor: '#fff2ee' }}>
                  <CalendarLtrRegular fontSize={26} style={{ color: '#f05a28' }} />
                </div>
                <div className={styles.kpiText}>
                  <span className={styles.kpiNumber}>{scadenzeLoading ? '…' : scadute + imminenti}</span>
                  <span className={styles.kpiLabel}>Scadenze aperte</span>
                  <span className={styles.kpiSub}>Scadute: {scadute} · Imminenti: {imminenti}</span>
                </div>
              </div>
              <button className={styles.kpiFooter} style={{ borderTop: '1px solid #f0f0f0' }} onClick={() => setActiveTab('scadenzario')}>
                <span className={styles.kpiFooterLabel}>Visualizza dettagli</span>
                <ChevronRightRegular fontSize={14} style={{ color: '#9ca3af' }} />
              </button>
            </div>

            {/* Attivita interne */}
            <div className={styles.statCard}>
              <div className={styles.statCardBody}>
                <div className={styles.kpiIcon} style={{ backgroundColor: '#eaf4ff' }}>
                  <List size={22} color="#0F6CBD" />
                </div>
                <div className={styles.kpiText}>
                  <span className={styles.kpiNumber}>{todosLoading ? '…' : todos.length}</span>
                  <span className={styles.kpiLabel}>Attivita interne</span>
                  <span className={styles.kpiSub}>Eseguite: {completedTodos} · Da fare: {pendingTodos}</span>
                </div>
              </div>
              <button className={styles.kpiFooter} style={{ borderTop: '1px solid #f0f0f0' }} onClick={() => setActiveTab('todos')}>
                <span className={styles.kpiFooterLabel}>Visualizza dettagli</span>
                <ChevronRightRegular fontSize={14} style={{ color: '#9ca3af' }} />
              </button>
            </div>

            {/* Ricariche GAS */}
            <div className={styles.statCard}>
              <div className={styles.statCardBody}>
                <div className={styles.kpiIcon} style={{ backgroundColor: '#fef9ee' }}>
                  <Flame size={22} color="#f59e0b" />
                </div>
                <div className={styles.kpiText}>
                  <span className={styles.kpiNumber}>{ricaricheLoading ? '…' : ricariche.length}</span>
                  <span className={styles.kpiLabel}>Ricariche GAS</span>
                  <span className={styles.kpiSub}>Speso: {totaleRicariche.toFixed(0)} EUR</span>
                </div>
              </div>
              <button className={styles.kpiFooter} style={{ borderTop: '1px solid #f0f0f0' }} onClick={() => setActiveTab('ricariche')}>
                <span className={styles.kpiFooterLabel}>Visualizza dettagli</span>
                <ChevronRightRegular fontSize={14} style={{ color: '#9ca3af' }} />
              </button>
            </div>

            {/* Utenti */}
            <div className={styles.statCard}>
              <div className={styles.statCardBody}>
                <div className={styles.kpiIcon} style={{ backgroundColor: '#f3eeff' }}>
                  <PeopleRegular fontSize={26} style={{ color: '#7c3aed' }} />
                </div>
                <div className={styles.kpiText}>
                  <span className={styles.kpiNumber}>{usersLoading ? '…' : users.length}</span>
                  <span className={styles.kpiLabel}>Utenti sistema</span>
                  <span className={styles.kpiSub}>Admin: {users.filter((u) => u.role === 'admin').length}</span>
                </div>
              </div>
              <button className={styles.kpiFooter} style={{ borderTop: '1px solid #f0f0f0' }} onClick={() => setActiveTab('users')}>
                <span className={styles.kpiFooterLabel}>Visualizza dettagli</span>
                <ChevronRightRegular fontSize={14} style={{ color: '#9ca3af' }} />
              </button>
            </div>

            {/* Fornitori */}
            <div className={styles.statCard}>
              <div className={styles.statCardBody}>
                <div className={styles.kpiIcon} style={{ backgroundColor: '#ecfdf5' }}>
                  <Truck size={22} color="#059669" />
                </div>
                <div className={styles.kpiText}>
                  <span className={styles.kpiNumber}>{fornitoriLoading ? '…' : fornitori.length}</span>
                  <span className={styles.kpiLabel}>Fornitori</span>
                  <span className={styles.kpiSub}>Attivi: {fornitori.filter((f) => f.attivo).length}</span>
                </div>
              </div>
              <button className={styles.kpiFooter} style={{ borderTop: '1px solid #f0f0f0' }}>
                <span className={styles.kpiFooterLabel}>Visualizza dettagli</span>
                <ChevronRightRegular fontSize={14} style={{ color: '#9ca3af' }} />
              </button>
            </div>

            {/* Acquisti */}
            <div className={styles.statCard}>
              <div className={styles.statCardBody}>
                <div className={styles.kpiIcon} style={{ backgroundColor: '#e0f7fa' }}>
                  <Euro size={22} color="#0891b2" />
                </div>
                <div className={styles.kpiText}>
                  <span className={styles.kpiNumber}>{acquistiLoading ? '…' : acquisti.length}</span>
                  <span className={styles.kpiLabel}>Acquisti</span>
                  <span className={styles.kpiSub}>Spesa: {totaleAcquisti.toFixed(0)} EUR</span>
                </div>
              </div>
              <button className={styles.kpiFooter} style={{ borderTop: '1px solid #f0f0f0' }} onClick={() => setActiveTab('acquisti')}>
                <span className={styles.kpiFooterLabel}>Visualizza dettagli</span>
                <ChevronRightRegular fontSize={14} style={{ color: '#9ca3af' }} />
              </button>
            </div>
          </div>

          <div className={styles.chartGrid}>
            <div className={styles.chartCard}>
              <Subtitle1>Statistiche attivita interne</Subtitle1>
              <Divider style={{ margin: '10px 0 14px 0' }} />
              {todosLoading ? (
                <Spinner label="Caricamento statistiche" />
              ) : (
                <>
                  <div className={styles.donutWrap}>
                    <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                      <svg style={{ width: '160px', height: '160px', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                        {todos.length > 0 ? (
                          <>
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke="#2f5fdd"
                              strokeWidth="12"
                              strokeDasharray={`${(completedTodos / todos.length) * 251.2} 251.2`}
                              strokeDashoffset="0"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke="#f59e0b"
                              strokeWidth="12"
                              strokeDasharray={`${(pendingTodos / todos.length) * 251.2} 251.2`}
                              strokeDashoffset={`-${(completedTodos / todos.length) * 251.2}`}
                            />
                          </>
                        ) : (
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#d1d5db" strokeWidth="12" />
                        )}
                      </svg>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Body1Strong>{todos.length}</Body1Strong>
                        <Caption1>Totale</Caption1>
                      </div>
                    </div>
                  </div>
                  <div className={styles.donutLegend}>
                    <Caption1>
                      <span className={styles.legendDotDone} />
                      Eseguite ({completedTodos})
                    </Caption1>
                    <Caption1>
                      <span className={styles.legendDotTodo} />
                      Da fare ({pendingTodos})
                    </Caption1>
                  </div>
                </>
              )}
            </div>

            <div className={styles.chartCard}>
              <Subtitle1>Ricariche GAS per anno</Subtitle1>
              <Divider style={{ margin: '10px 0 14px 0' }} />
              {ricaricheLoading ? (
                <Spinner label="Caricamento annuale" />
              ) : (
                <>
                  {(() => {
                    const chartH = 150;
                    const barW = 46;
                    const barGap = 18;
                    const leftPad = 50;
                    const rightPad = 8;
                    const topPad = 18;
                    const bottomPad = 36;
                    const totalW = leftPad + anniGrafico.length * (barW + barGap) - barGap + rightPad;
                    const totalH = chartH + topPad + bottomPad;
                    const yTicks = 4;
                    return (
                      <svg width="100%" viewBox={`0 0 ${totalW} ${totalH}`} style={{ overflow: 'visible', display: 'block' }}>
                        {/* Grid lines + y-axis labels */}
                        {Array.from({ length: yTicks + 1 }, (_, i) => {
                          const y = topPad + chartH - (i / yTicks) * chartH;
                          const val = (maxTotaleGrafico / yTicks) * i;
                          return (
                            <g key={i}>
                              <line x1={leftPad} y1={y} x2={totalW - rightPad} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                              <text x={leftPad - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
                                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val).toString()}€
                              </text>
                            </g>
                          );
                        })}
                        {/* Y-axis line */}
                        <line x1={leftPad} y1={topPad} x2={leftPad} y2={topPad + chartH} stroke="#d1d5db" strokeWidth="1" />
                        {/* Baseline */}
                        <line x1={leftPad} y1={topPad + chartH} x2={totalW - rightPad} y2={topPad + chartH} stroke="#d1d5db" strokeWidth="1.5" />
                        {/* Bars */}
                        {anniGrafico.map((anno, i) => {
                          const data = ricarichePerAnno[anno];
                          const totale = data?.totale ?? 0;
                          const count = data?.count ?? 0;
                          const barH = (totale / maxTotaleGrafico) * chartH;
                          const x = leftPad + i * (barW + barGap);
                          const isCurrentYear = anno === currentYear;
                          const barColor = isCurrentYear ? '#f59e0b' : '#2f5fdd';
                          const barY = topPad + chartH - Math.max(barH, totale > 0 ? 2 : 0);
                          return (
                            <g key={anno}>
                              <rect
                                x={x}
                                y={barY}
                                width={barW}
                                height={Math.max(barH, totale > 0 ? 2 : 0)}
                                rx="4"
                                fill={barColor}
                                opacity={totale === 0 ? 0.18 : 1}
                              />
                              {/* Placeholder bar for years with no data */}
                              {totale === 0 && (
                                <rect x={x} y={topPad + chartH - 4} width={barW} height={4} rx="2" fill={barColor} opacity="0.18" />
                              )}
                              {/* Count label inside bar */}
                              {count > 0 && barH > 22 && (
                                <text x={x + barW / 2} y={barY + Math.min(barH / 2 + 5, barH - 4)} textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="600">
                                  {count}
                                </text>
                              )}
                              {/* EUR label above bar */}
                              {totale > 0 && (
                                <text x={x + barW / 2} y={barY - 5} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="500">
                                  {Math.round(totale)}€
                                </text>
                              )}
                              {/* Year label */}
                              <text x={x + barW / 2} y={topPad + chartH + 16} textAnchor="middle" fontSize="11" fill={isCurrentYear ? '#f59e0b' : '#374151'} fontWeight={isCurrentYear ? '700' : '400'}>
                                {anno}
                              </text>
                              {isCurrentYear && (
                                <text x={x + barW / 2} y={topPad + chartH + 29} textAnchor="middle" fontSize="8" fill="#f59e0b">
                                  corrente
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                  <Divider style={{ margin: '10px 0' }} />
                  <Caption1>
                    Totale: {totaleRicariche.toFixed(2)} EUR | Anni con dati: {anni.length}
                  </Caption1>
                </>
              )}
            </div>
          </div>

          <div style={{ marginTop: '12px', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '8px', height: '20px', borderRadius: '4px', backgroundColor: '#0F6CBD', flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1f36', letterSpacing: '0.01em' }}>Indicatori operativi</span>
            </div>
            {/* Indicators grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1px', backgroundColor: '#f0f0f0' }}>
              {/* Letture acqua */}
              <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderLeft: '4px solid #0891b2', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#e0f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Droplet size={22} color="#0891b2" />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1f36', lineHeight: 1.1 }}>
                    {lettureAcquaLoading ? '…' : lettureAcqua.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginTop: '2px' }}>Letture acqua</div>
                </div>
              </div>
              {/* Fornitori attivi */}
              <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderLeft: '4px solid #059669', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={22} color="#059669" />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1f36', lineHeight: 1.1 }}>
                    {fornitoriLoading ? '…' : fornitori.filter((f) => f.attivo).length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginTop: '2px' }}>Fornitori attivi</div>
                </div>
              </div>
              {/* Scadenze imminenti */}
              <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarLtrRegular fontSize={24} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1f36', lineHeight: 1.1 }}>
                    {scadenzeLoading ? '…' : imminenti}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginTop: '2px' }}>Scadenze imminenti</div>
                </div>
              </div>
              {/* Scadenze scadute */}
              <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarLtrRegular fontSize={24} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1f36', lineHeight: 1.1 }}>
                    {scadenzeLoading ? '…' : scadute}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginTop: '2px' }}>Scadenze scadute</div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'todos') return <TodoList />;
    if (activeTab === 'manutenzione') return <ManutenzioneManagement />;
    if (activeTab === 'acquisti') return <AcquistiManagement />;
    if (activeTab === 'ricariche') return <RicaricaManagement />;
    if (activeTab === 'lettureAcqua') return <LettureAcquaManagement />;
    if (activeTab === 'scadenzario') {
      return <ScadenzarioManager initialFilter={scadenzarioFilter} onFilterChange={() => setScadenzarioFilter(null)} />;
    }
    if (activeTab === 'documenti') return <DocumentManagement />;
    if (activeTab === 'settori' && user?.role === 'admin') return <SettoriManagement />;
    if (activeTab === 'fornitori' && user?.role === 'admin') return <FornitoriManagement />;
    if (activeTab === 'contatti' && user?.role === 'admin') return <ContattiManagement />;
    if (activeTab === 'utenze' && user?.role === 'admin') return <UtenzeManagement />;
    if (activeTab === 'users' && user?.role === 'admin') return <UserManagement />;
    if (activeTab === 'email' && user?.role === 'admin') return <EmailManagement />;

    return null;
  };

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.appShell}>
        {sidebarOpen && <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} />}

        <aside
          className={`${styles.sidebar} ${styles.mobileSidebar} ${
            sidebarOpen ? styles.mobileVisible : styles.mobileHidden
          }`}
        >
          <div className={styles.sidebarHeader}>
            <div className={styles.brand}>
              <img src="/logo.png" alt="Logo LyfeUmbria" width={36} height={36} />
              <div>
                <div className={styles.brandTitle}>LyfeUmbria</div>
                <Caption1>Manager v{APP_VERSION}</Caption1>
              </div>
            </div>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              className={styles.mobileMenuButton}
              onClick={() => setSidebarOpen(false)}
            />
          </div>

          <div className={styles.navArea}>
            <Caption1 className={styles.navGroupTitle}>Menu</Caption1>
            {filteredNavigation.map((item) => {
              const isAttivitaActive = item.key === 'attivitaemanutenzione' && ['todos', 'manutenzione', 'acquisti'].includes(activeTab);
              const isFornitoriActive = item.key === 'fornitori' && ['fornitori', 'settori'].includes(activeTab);
              const isItemActive = activeTab === item.key || isAttivitaActive || isFornitoriActive;

              if (item.hasSubmenu) {
                const submenuOpen = item.key === 'attivitaemanutenzione' ? attivitaSubmenuOpen : fornitoriSubmenuOpen;
                return (
                  <div key={item.key}>
                    <Button
                      appearance="subtle"
                      className={styles.navButton}
                      style={isItemActive ? { backgroundColor: '#2f5fdd', color: '#ffffff' } : {}}
                      icon={item.icon}
                      onClick={() => {
                        if (item.key === 'attivitaemanutenzione') setAttivitaSubmenuOpen((prev) => !prev);
                        if (item.key === 'fornitori') setFornitoriSubmenuOpen((prev) => !prev);
                      }}
                    >
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
                      {submenuOpen ? <ChevronDownRegular /> : <ChevronRightRegular />}
                    </Button>
                    {submenuOpen && (
                      <div className={styles.submenuWrap}>
                        {item.submenu?.map((subItem) => (
                          <Button
                            key={subItem.key}
                            appearance={activeTab === subItem.key ? 'primary' : 'subtle'}
                            className={styles.submenuButton}
                            onClick={() => {
                              setActiveTab(subItem.key);
                              setSidebarOpen(false);
                            }}
                          >
                            {subItem.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Button
                  key={item.key}
                  appearance={activeTab === item.key ? 'primary' : 'subtle'}
                  className={styles.navButton}
                  icon={item.icon}
                  onClick={() => {
                    setActiveTab(item.key as ActiveTab);
                    setSidebarOpen(false);
                  }}
                >
                  {item.name}
                </Button>
              );
            })}

            <Divider style={{ margin: '12px 0' }} />
            <Button
              appearance="outline"
              className={styles.navButton}
              icon={<LockClosedRegular />}
              onClick={() => setShowChangePassword(true)}
            >
              Cambia password
            </Button>
          </div>

          <div className={styles.sidebarFooter}>
            <div className={styles.userRow}>
              <Avatar name={user?.name} color="brand" icon={<PersonCircleRegular />} />
              <div>
                <Body1Strong>{user?.name}</Body1Strong>
                <Caption1 style={{ textTransform: 'capitalize' }}>{user?.role}</Caption1>
              </div>
            </div>
            <Button appearance="subtle" icon={<SignOutRegular />} className={styles.navButton} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </aside>

        <aside className={`${styles.sidebar} ${styles.desktopSidebar}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.brand}>
              <img src="/logo.png" alt="Logo LyfeUmbria" width={36} height={36} />
              <div>
                <div className={styles.brandTitle}>LyfeUmbria</div>
                <Caption1>Manager v{APP_VERSION}</Caption1>
              </div>
            </div>
          </div>

          <div className={styles.navArea}>
            <Caption1 className={styles.navGroupTitle}>Menu</Caption1>
            {filteredNavigation.map((item) => {
              const isAttivitaActive = item.key === 'attivitaemanutenzione' && ['todos', 'manutenzione', 'acquisti'].includes(activeTab);
              const isFornitoriActive = item.key === 'fornitori' && ['fornitori', 'settori'].includes(activeTab);
              const isItemActive = activeTab === item.key || isAttivitaActive || isFornitoriActive;

              if (item.hasSubmenu) {
                const submenuOpen = item.key === 'attivitaemanutenzione' ? attivitaSubmenuOpen : fornitoriSubmenuOpen;
                return (
                  <div key={item.key}>
                    <Button
                      appearance="subtle"
                      className={styles.navButton}
                      style={isItemActive ? { backgroundColor: '#2f5fdd', color: '#ffffff' } : {}}
                      icon={item.icon}
                      onClick={() => {
                        if (item.key === 'attivitaemanutenzione') setAttivitaSubmenuOpen((prev) => !prev);
                        if (item.key === 'fornitori') setFornitoriSubmenuOpen((prev) => !prev);
                      }}
                    >
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
                      {submenuOpen ? <ChevronDownRegular /> : <ChevronRightRegular />}
                    </Button>
                    {submenuOpen && (
                      <div className={styles.submenuWrap}>
                        {item.submenu?.map((subItem) => (
                          <Button
                            key={subItem.key}
                            appearance={activeTab === subItem.key ? 'primary' : 'subtle'}
                            className={styles.submenuButton}
                            onClick={() => setActiveTab(subItem.key)}
                          >
                            {subItem.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Button
                  key={item.key}
                  appearance={activeTab === item.key ? 'primary' : 'subtle'}
                  className={styles.navButton}
                  icon={item.icon}
                  onClick={() => setActiveTab(item.key as ActiveTab)}
                >
                  {item.name}
                </Button>
              );
            })}

            <Divider style={{ margin: '12px 0' }} />
            <Button
              appearance="outline"
              className={styles.navButton}
              icon={<LockClosedRegular />}
              onClick={() => setShowChangePassword(true)}
            >
              Cambia password
            </Button>
          </div>

          <div className={styles.sidebarFooter}>
            <div className={styles.userRow}>
              <Avatar name={user?.name} color="brand" icon={<PersonCircleRegular />} />
              <div>
                <Body1Strong>{user?.name}</Body1Strong>
                <Caption1 style={{ textTransform: 'capitalize' }}>{user?.role}</Caption1>
              </div>
            </div>
            <Button appearance="subtle" icon={<SignOutRegular />} className={styles.navButton} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </aside>

        <div className={styles.content}>
          <header className={styles.topBar}>
            <div className={styles.topBarLeft}>
              <Button
                appearance="subtle"
                icon={<NavigationRegular />}
                className={styles.mobileMenuButton}
                onClick={() => setSidebarOpen(true)}
              />
              <div>
                <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Operational panel</Caption1>
                <Body1Strong>{sectionTitle}</Body1Strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge appearance="outline" color="informative" icon={<HomeRegular />}>
                Online
              </Badge>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                {new Date().toLocaleDateString('it-IT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Caption1>
            </div>
          </header>

          <main className={styles.pageBody}>{renderMainContent()}</main>
        </div>

        {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}

        {showSessionWarning && (
          <SessionTimeoutWarning
            warningTimeLeft={sessionWarningTimeLeft}
            onExtendSession={extendSession}
            onLogout={logout}
          />
        )}
      </div>
    </FluentProvider>
  );
}