
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Palmtree, 
  Menu, 
  X,
  FileText,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  History,
  Lock,
  BarChart3,
  FileUp
} from 'lucide-react';

import { Collaborator, VacationRecord, Holiday, User, UserRole, AuditLog } from './types';
import { INITIAL_COLLABORATORS, INITIAL_RECORDS, INITIAL_HOLIDAYS } from './constants';

import Dashboard from './pages/Dashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import CollaboratorsPage from './pages/CollaboratorsPage';
import VacationsPage from './pages/VacationsPage';
import HolidaysPage from './pages/HolidaysPage';
import IndividualReport from './pages/IndividualReport';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ImportPage from './pages/ImportPage';

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => Promise<void>;
  logout: () => void;
  addLog: (action: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vacation_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('vacation_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    const saved = localStorage.getItem('vacation_collaborators');
    return saved ? JSON.parse(saved) : INITIAL_COLLABORATORS;
  });

  const [records, setRecords] = useState<VacationRecord[]>(() => {
    const saved = localStorage.getItem('vacation_records');
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('vacation_holidays');
    return saved ? JSON.parse(saved) : INITIAL_HOLIDAYS;
  });

  useEffect(() => {
    localStorage.setItem('vacation_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('vacation_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('vacation_collaborators', JSON.stringify(collaborators));
  }, [collaborators]);

  useEffect(() => {
    localStorage.setItem('vacation_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('vacation_holidays', JSON.stringify(holidays));
  }, [holidays]);

  const addLog = (action: string) => {
    if (!user) return;
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      action,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 1000)); 
  };

  const login = async (role: UserRole) => {
    const mockUser: User = {
      id: role === UserRole.ADMIN ? "ms-admin-9988" : "ms-user-4455",
      name: role === UserRole.ADMIN ? "Administrador de Operações" : "Colaborador Operacional",
      email: role === UserRole.ADMIN ? "admin.operacoes@fgv.br" : "colaborador@fgv.br",
      unit: "FGV - Diretoria de Operações",
      role: role
    };
    setUser(mockUser);
    
    const initialLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: mockUser.id,
      userName: mockUser.name,
      action: `Realizou login via Microsoft 365 (Perfil: ${role})`,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [initialLog, ...prev]);
  };

  const logout = () => {
    addLog("Realizou logout do sistema");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, addLog, isAuthenticated: !!user }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/*" element={
            user ? (
              <div className="flex min-h-screen bg-slate-50">
                <Sidebar />
                <main className="flex-1 flex flex-col md:ml-64">
                  <Header />
                  <div className="p-4 md:p-8">
                    <Routes>
                      <Route path="/" element={<Dashboard collaborators={collaborators} records={records} holidays={holidays} />} />
                      <Route path="/analytics" element={<AnalyticsDashboard collaborators={collaborators} records={records} />} />
                      <Route path="/collaborators" element={<CollaboratorsPage collaborators={collaborators} setCollaborators={setCollaborators} />} />
                      <Route path="/vacations" element={
                        <VacationsPage 
                          records={records} 
                          setRecords={setRecords} 
                          collaborators={collaborators} 
                          holidays={holidays} 
                        />
                      } />
                      <Route path="/holidays" element={<HolidaysPage holidays={holidays} setHolidays={setHolidays} />} />
                      <Route path="/report" element={<IndividualReport collaborators={collaborators} records={records} />} />
                      <Route path="/import" element={
                        <ImportPage 
                          collaborators={collaborators} 
                          setCollaborators={setCollaborators} 
                          records={records} 
                          setRecords={setRecords} 
                        />
                      } />
                      <Route path="/profile" element={<ProfilePage logs={logs} />} />
                    </Routes>
                  </div>
                </main>
              </div>
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

const Header: React.FC = () => {
  const { user } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-slate-900 md:hidden" size={20} />
        <h1 className="text-lg font-bold text-slate-800 truncate max-w-[200px] sm:max-w-none">
          Diretoria de Operações
        </h1>
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-900 leading-none">{user?.name}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{user?.role}</p>
        </div>
        <Link to="/profile" className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-bold hover:bg-slate-200 transition-all overflow-hidden shadow-sm">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="User" /> : user?.name.charAt(0)}
        </Link>
      </div>
    </header>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Visão Geral', icon: LayoutDashboard, path: '/' },
    { label: 'Dashboard', icon: BarChart3, path: '/analytics' },
    { label: 'Colaboradores', icon: Users, path: '/collaborators' },
    { label: 'Gestão de Férias', icon: Palmtree, path: '/vacations' },
    { label: 'Resumo Individual', icon: FileText, path: '/report' },
    { label: 'Feriados', icon: Calendar, path: '/holidays' },
    { label: 'Importar Dados', icon: FileUp, path: '/import' },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="mb-10 px-2 flex flex-col gap-4">
            {/* Logo Atualizada FGV DO */}
            <div className="bg-white p-3 rounded-2xl shadow-lg mb-2">
              <img 
                src="https://raw.githubusercontent.com/filipe-fgv/logos/main/fgv-do-logo.png" 
                alt="FGV DO" 
                className="h-10 w-auto object-contain mx-auto"
                onError={(e) => {
                  e.currentTarget.src = "https://logodownload.org/wp-content/uploads/2014/10/fgv-logo-1.png";
                }}
              />
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/10 p-1.5 rounded-lg">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight block leading-none">Operações</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Controle de Férias</span>
              </div>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                    ${isActive 
                      ? 'bg-white text-slate-900 shadow-lg translate-x-1' 
                      : 'hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800 space-y-1">
            <div className="px-4 py-3 mb-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={12} className="text-blue-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sessão Segura</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">Diretoria de Operações</p>
            </div>
            
            <Link 
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <UserIcon size={18} />
              <span>Meu Perfil</span>
            </Link>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-900/20 text-red-400 transition-colors"
            >
              <LogOut size={18} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default App;
