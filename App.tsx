
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
  FileUp,
  Settings,
  ShieldAlert,
  ShieldX,
  Calculator,
  Eye,
  LogOut as LogoutIcon,
  ChevronRight
} from 'lucide-react';

import { Collaborator, VacationRecord, Holiday, User, UserRole, AuditLog, RegisteredUser } from './types';
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

const ROOT_ADMIN_EMAIL = 'bianca.bomfim@fgv.br';
const DEFAULT_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 520 160'%3E%3Cpath d='M10 20 L100 20 L70 65 L-20 65 Z' fill='%23004b8d'/%3E%3Cpath d='M45 75 L135 75 L105 120 L15 120 Z' fill='%23009fe3'/%3E%3Ctext x='150' y='75' font-family='Arial Black, sans-serif' font-weight='900' font-size='82' letter-spacing='-4' fill='%23004b8d'%3EFGV%3C/text%3E%3Ctext x='355' y='75' font-family='Arial Black, sans-serif' font-weight='900' font-size='82' letter-spacing='-4' fill='%23009fe3'%3EDO%3C/text%3E%3C/svg%3E";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{success: boolean; message?: string}>;
  logout: () => void;
  addLog: (action: string) => void;
  isAuthenticated: boolean;
  logo: string;
  updateLogo: (newLogo: string) => void;
  resetLogo: () => void;
  registeredUsers: RegisteredUser[];
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

  const [logo, setLogo] = useState<string>(() => {
    return localStorage.getItem('app_custom_logo') || DEFAULT_LOGO;
  });

  const [registeredUsers] = useState<RegisteredUser[]>(() => {
    const saved = localStorage.getItem('app_registered_users');
    let list = saved ? JSON.parse(saved) : [];
    if (!list.find((u: any) => u.email === ROOT_ADMIN_EMAIL)) {
      list.push({ email: ROOT_ADMIN_EMAIL, role: UserRole.ADMIN, addedAt: new Date().toISOString() });
    }
    return list;
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

  useEffect(() => localStorage.setItem('vacation_user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('vacation_logs', JSON.stringify(logs)), [logs]);
  useEffect(() => localStorage.setItem('vacation_collaborators', JSON.stringify(collaborators)), [collaborators]);
  useEffect(() => localStorage.setItem('vacation_records', JSON.stringify(records)), [records]);
  useEffect(() => localStorage.setItem('vacation_holidays', JSON.stringify(holidays)), [holidays]);

  const updateLogo = (newLogo: string) => {
    if (user?.role !== UserRole.ADMIN) return;
    setLogo(newLogo);
    localStorage.setItem('app_custom_logo', newLogo);
    addLog("Atualizou a identidade visual do sistema");
  };

  const resetLogo = () => {
    if (user?.role !== UserRole.ADMIN) return;
    setLogo(DEFAULT_LOGO);
    localStorage.removeItem('app_custom_logo');
    addLog("Restaurou o branding institucional padrão");
  };

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

  const login = async (email: string, password: string) => {
    const lowerEmail = email.toLowerCase().trim();
    const role = lowerEmail === ROOT_ADMIN_EMAIL ? UserRole.ADMIN : UserRole.VIEWER;
    const loggedUser: User = {
      id: "usr-" + Math.random().toString(36).substr(2, 6),
      name: lowerEmail.split('@')[0].replace('.', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      email: lowerEmail,
      unit: "Diretoria de Operações",
      role: role
    };
    setUser(loggedUser);
    addLog(`Acesso realizado (${role})`);
    return { success: true };
  };

  const logout = () => {
    addLog("Logout efetuado");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, addLog, isAuthenticated: !!user, 
      logo, updateLogo, resetLogo, registeredUsers
    }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/*" element={
            user ? (
              <div className="flex min-h-screen bg-[#0D1117]">
                <Sidebar />
                <main className="flex-1 flex flex-col md:ml-64">
                  <div className="p-6 md:p-10">
                    <Routes>
                      <Route path="/" element={<Dashboard collaborators={collaborators} records={records} holidays={holidays} />} />
                      <Route path="/analytics" element={<AnalyticsDashboard collaborators={collaborators} records={records} />} />
                      <Route path="/collaborators" element={<CollaboratorsPage collaborators={collaborators} setCollaborators={setCollaborators} />} />
                      <Route path="/vacations" element={<VacationsPage records={records} setRecords={setRecords} collaborators={collaborators} holidays={holidays} />} />
                      <Route path="/holidays" element={<HolidaysPage holidays={holidays} setHolidays={setHolidays} />} />
                      <Route path="/report" element={<IndividualReport collaborators={collaborators} records={records} />} />
                      <Route path="/import" element={user.role === UserRole.ADMIN ? <ImportPage collaborators={collaborators} setCollaborators={setCollaborators} records={records} setRecords={setRecords} /> : <Navigate to="/" />} />
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

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout, logo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Colaboradores', icon: Users, path: '/collaborators' },
    { label: 'Férias', icon: Palmtree, path: '/vacations' },
    { label: 'Análises', icon: BarChart3, path: '/analytics' },
    { label: 'Feriados', icon: Calendar, path: '/holidays' },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-6 right-6 z-50 bg-[#1F6FEB] text-white p-3 rounded-xl shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#161B22] border-r border-[#30363D] transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-black"></div>
              </div>
              <span className="font-bold text-lg tracking-tight">Controle de Férias</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all
                    ${isActive 
                      ? 'bg-[#1F6FEB]/10 text-[#1F6FEB] font-bold' 
                      : 'text-[#8B949E] hover:text-white hover:bg-[#30363D]'}
                  `}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-8 pb-2 px-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#484F58]">Sistema</span>
            </div>

            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all
                ${location.pathname === '/profile' 
                  ? 'bg-[#1F6FEB]/10 text-[#1F6FEB] font-bold' 
                  : 'text-[#8B949E] hover:text-white hover:bg-[#30363D]'}
              `}
            >
              <Settings size={18} />
              Configurações
            </Link>
          </nav>

          {/* Profile Card */}
          <div className="p-4 border-t border-[#30363D]">
            <div className="flex items-center justify-between group p-3 rounded-2xl hover:bg-[#30363D]/50 transition-all">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-[#30363D] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-sm">{user?.name.charAt(0)}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white truncate">{user?.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-[#8B949E] font-medium uppercase tracking-wider">M365 Conectado</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-[#484F58] hover:text-rose-500 transition-colors"
              >
                <LogoutIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default App;
