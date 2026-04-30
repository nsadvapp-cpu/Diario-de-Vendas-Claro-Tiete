/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Save, 
  Printer, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  FileText, 
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowLeft,
  LayoutDashboard,
  ClipboardList,
  Target,
  Coins,
  Clock,
  ShoppingBag,
  Bell,
  Search,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type UserRole = 'VENDEDOR' | 'SENIOR' | 'GERENTE';
type UserStatus = 'PENDENTE' | 'APROVADO';
type Turno = '09:40-18:00' | '13:40-22:00';

interface User {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  email: string;
  senha?: string;
  role: UserRole;
  status: UserStatus;
  turno: Turno;
  createdAt: string;
}

interface SaleEntry {
  [productId: string]: number;
}

interface DailyRecord {
  userId: string;
  date: string;
  sales: SaleEntry;
  lastUpdated: string;
}

// --- Constants ---
const CLARO_RED = '#E3000F';

const SECTIONS = [
  {
    id: 'gross',
    name: 'Seção GROSS',
    color: 'bg-blue-100 text-blue-900 border-blue-200',
    products: [
      'Pós (Titular)', 'Migra Pós', 'Dependente', 'Migra Dep', 'Banda Larga', 
      'Dep BL', 'Controle (Single)', 'Controle (Mplay)', 'Migra Controle', 
      'PME (02 para cada)', 'Claro Flex'
    ]
  },
  {
    id: 'mplay',
    name: 'Seção M-PLAY',
    color: 'bg-green-100 text-green-900 border-green-200',
    products: ['Entrada Conta', 'Entrada Controle', 'Entrada Fibra', 'Entrada TV']
  },
  {
    id: 'residenciais',
    name: 'Seção RESIDENCIAIS',
    color: 'bg-orange-100 text-orange-900 border-orange-200',
    products: ['Claro Fibra', 'Vendas Solar (1 cada)', 'Mesh', 'Claro Soundbox', 'Claro Box', 'Claro Fibra PME']
  },
  {
    id: 'servicos',
    name: 'Seção SERVIÇOS',
    color: 'bg-purple-100 text-purple-900 border-purple-200',
    products: [
      'Aparelhos', 'Seguro', 'Seguro Avulso', 'Película', 
      'Acessório Baixo Valor (até R$ 399,00)', 
      'Acessório Alto Valor (acima de R$ 399,00)', 
      'Claro Troca FY'
    ]
  },
  {
    id: 'portabilidades',
    name: 'Seção PORTABILIDADES',
    color: 'bg-yellow-100 text-yellow-900 border-yellow-200',
    products: ['Conta Vivo', 'Controle Vivo', 'Conta Tim', 'Controle Tim']
  }
];

const INITIAL_MANAGER: User = {
  id: 'manager-1',
  nome: 'Rudney Araujo de Oliveira',
  cpf: '328.079.088-37',
  matricula: 'ADMIN01',
  email: 'gerente@claro.com.br',
  senha: 'admin',
  role: 'GERENTE',
  status: 'APROVADO',
  turno: '09:40-18:00',
  createdAt: new Date().toISOString()
};

// --- Mock DB Keys ---
const DB_USERS = 'tiete_users';
const DB_SALES_PREFIX = 'vendas_';
const DB_PRICES_PREFIX = 'tiete_prices_';
const DB_GOALS_PREFIX = 'tiete_goals_';
const DB_INSTALLS_PREFIX = 'tiete_installs_';

// --- Dashboard Component ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'auth' | 'main'>('auth');
  const [tab, setTab] = useState<'planilha' | 'desempenho' | 'admin' | 'dashboard' | 'capa'>('planilha');
  const [users, setUsers] = useState<User[]>([]);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);

  // Load initial data
  useEffect(() => {
    const storedUsers = localStorage.getItem(DB_USERS);
    let currentUsers: User[] = [];
    
    if (!storedUsers) {
      currentUsers = [INITIAL_MANAGER];
      localStorage.setItem(DB_USERS, JSON.stringify(currentUsers));
    } else {
      currentUsers = JSON.parse(storedUsers);
      // Logic to update the manager if it's still using the old default values
      const managerIndex = currentUsers.findIndex(u => u.id === 'manager-1');
      if (managerIndex !== -1 && (currentUsers[managerIndex].nome === 'Gerente Tietê Plaza' || currentUsers[managerIndex].cpf === '000.000.000-00')) {
        currentUsers[managerIndex].nome = INITIAL_MANAGER.nome;
        currentUsers[managerIndex].cpf = INITIAL_MANAGER.cpf;
        localStorage.setItem(DB_USERS, JSON.stringify(currentUsers));
      }
    }
    setUsers(currentUsers);

    const session = sessionStorage.getItem('tiete_session');
    if (session) {
      let user = JSON.parse(session);
      // Update session user if it's the manager
      if (user.id === 'manager-1' && (user.nome === 'Gerente Tietê Plaza' || user.cpf === '000.000.000-00')) {
        user.nome = INITIAL_MANAGER.nome;
        user.cpf = INITIAL_MANAGER.cpf;
        sessionStorage.setItem('tiete_session', JSON.stringify(user));
      }
      setCurrentUser(user);
      setView('main');
      
      // Default tabs based on role
      if (user.role === 'GERENTE') setTab('admin');
      else if (user.role === 'SENIOR') setTab('dashboard');
      else setTab('planilha');
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('tiete_session');
    setCurrentUser(null);
    setView('auth');
  };

  // Auto-logout if user is deleted from DB
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const userExists = users.find(u => u.id === currentUser.id);
      if (!userExists) {
        handleLogout();
      }
    }
  }, [users, currentUser]);

  const syncUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem(DB_USERS, JSON.stringify(newUsers));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AnimatePresence mode="wait">
        {view === 'auth' ? (
          <AuthScreen 
            onLogin={(user) => {
              setCurrentUser(user);
              sessionStorage.setItem('tiete_session', JSON.stringify(user));
              setView('main');
              if (user.role === 'GERENTE') setTab('admin');
              else if (user.role === 'SENIOR') setTab('dashboard');
              else setTab('planilha');
            }}
            users={users}
            onRegister={syncUsers}
          />
        ) : (
          <MainScreen 
            user={currentUser!} 
            onLogout={handleLogout}
            tab={tab}
            setTab={setTab}
            users={users}
            setUsers={syncUsers}
            todayDate={todayDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Auth Screen ---
function AuthScreen({ onLogin, users, onRegister }: { onLogin: (u: User) => void, users: User[], onRegister: (u: User[]) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    matricula: '',
    email: '',
    senha: '',
    turno: '09:40-18:00' as Turno
  });
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === formData.email && u.senha === formData.senha);
    if (!user) {
      setError('E-mail ou senha incorretos.');
      return;
    }
    if (user.status === 'PENDENTE') {
      setError('Sua conta ainda está pendente de aprovação pelo gerente.');
      return;
    }
    onLogin(user);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.email === formData.email)) {
      setError('Este e-mail corporativo já está cadastrado.');
      return;
    }
    
    const newUser: User = {
      id: `u-${Date.now()}`,
      ...formData,
      role: 'VENDEDOR',
      status: 'PENDENTE',
      createdAt: new Date().toISOString()
    };

    onRegister([...users, newUser]);
    setMode('login');
    setError('✅ Cadastro solicitado! Aguarde a aprovação do gerente.');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex min-h-screen flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-[#E3000F] p-8 text-white text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
            <span className="text-[#E3000F] font-black text-2xl">C</span>
          </div>
          <h1 className="text-2xl font-bold">Tietê Plaza</h1>
          <p className="opacity-80">Diário de Vendas</p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => { setMode('login'); setError(''); }}
              className={cn(
                "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
                mode === 'login' ? "border-[#E3000F] text-[#E3000F]" : "border-transparent text-slate-400"
              )}
            >
              Entrar
            </button>
            <button 
              onClick={() => { setMode('register'); setError(''); }}
              className={cn(
                "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
                mode === 'register' ? "border-[#E3000F] text-[#E3000F]" : "border-transparent text-slate-400"
              )}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {error && (
              <div className={cn(
                "p-3 rounded-lg text-xs font-medium",
                error.startsWith('✅') ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              )}>
                {error}
              </div>
            )}

            {mode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Seu nome"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:border-[#E3000F] transition-all"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">CPF</label>
                    <input 
                      required
                      type="text" 
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:border-[#E3000F] transition-all"
                      value={formData.cpf}
                      onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Matrícula</label>
                    <input 
                      required
                      type="text" 
                      placeholder="CL0000"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:border-[#E3000F] transition-all"
                      value={formData.matricula}
                      onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Turno</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:border-[#E3000F] transition-all"
                    value={formData.turno}
                    onChange={e => setFormData({ ...formData, turno: e.target.value as Turno })}
                  >
                    <option value="09:40-18:00">Turno 1: 09h40 – 18h00</option>
                    <option value="13:40-22:00">Turno 2: 13h40 – 22h00</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">E-mail Corporativo</label>
              <input 
                required
                type="email" 
                placeholder="exemplo@claro.com.br"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:border-[#E3000F] transition-all"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Senha</label>
              <input 
                required
                type="password" 
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:border-[#E3000F] transition-all"
                value={formData.senha}
                onChange={e => setFormData({ ...formData, senha: e.target.value })}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-[#E3000F] text-white py-4 rounded-xl font-bold mt-4 shadow-lg shadow-[#E3000F]/20 hover:bg-[#c2000d] transition-all active:scale-[0.98]"
            >
              {mode === 'login' ? 'Acessar Painel' : 'Solicitar Cadastro'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Screen ---
function MainScreen({ 
  user, 
  onLogout, 
  tab, 
  setTab,
  users,
  setUsers,
  todayDate
}: { 
  user: User, 
  onLogout: () => void, 
  tab: any, 
  setTab: any,
  users: User[],
  setUsers: (u: User[]) => void,
  todayDate: string
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E3000F] rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xl">C</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-tight truncate">{user.nome}</h2>
            <div className="flex flex-col">
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase leading-tight">
                {user.role === 'GERENTE' ? 'Gerente Loja' : `${user.role} • ${user.turno}`}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-tight">
                {user.role === 'GERENTE' ? `CPF: ${user.cpf}` : `Matrícula: ${user.matricula} • CPF: ${user.cpf}`}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-[#E3000F] transition-colors shrink-0"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 print:p-0">
        <AnimatePresence mode="wait">
          {tab === 'planilha' && (
            <PlanilhaSection userId={user.id} date={todayDate} userName={user.nome} userTurno={user.turno} />
          )}
          {tab === 'desempenho' && (
            <DesempenhoSection user={user} />
          )}
          {tab === 'dashboard' && (
            <SharedDashboard viewingUser={user} allUsers={users} todayDate={todayDate} />
          )}
          {tab === 'capa' && (
            <CapaDeLoteSection userId={user.id} />
          )}
          {tab === 'admin' && (
            <AdminPanel users={users} setUsers={setUsers} todayDate={todayDate} />
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Menu */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around py-3 px-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-40 print:hidden">
        {user.role === 'VENDEDOR' && (
          <>
            <NavButton 
              active={tab === 'planilha'} 
              onClick={() => setTab('planilha')} 
              icon={<ClipboardList size={22} />} 
              label="Diário"
            />
            <NavButton 
              active={tab === 'desempenho'} 
              onClick={() => setTab('desempenho')} 
              icon={<BarChart3 size={22} />} 
              label="Meu Perfil"
            />
            <NavButton 
              active={tab === 'capa'} 
              onClick={() => setTab('capa')} 
              icon={<ShoppingBag size={22} />} 
              label="Capa de Lote"
            />
          </>
        )}
        
        {user.role === 'SENIOR' && (
          <NavButton 
            active={tab === 'dashboard'} 
            onClick={() => setTab('dashboard')} 
            icon={<LayoutDashboard size={22} />} 
            label="Resultados"
          />
        )}

        {user.role === 'GERENTE' && (
          <>
            <NavButton 
              active={tab === 'admin'} 
              onClick={() => setTab('admin')} 
              icon={<Settings size={22} />} 
              label="Gestão"
            />
            <NavButton 
              active={tab === 'dashboard'} 
              onClick={() => setTab('dashboard')} 
              icon={<LayoutDashboard size={22} />} 
              label="Resultados"
            />
          </>
        )}
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-[#E3000F] scale-110" : "text-slate-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

// --- Planilha Section (Vendedor) ---
function PlanilhaSection({ userId, date, userName, userTurno, readOnly = false }: { userId: string, date: string, userName: string, userTurno: string, readOnly?: boolean }) {
  const [sales, setSales] = useState<SaleEntry>({});
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const key = `${DB_SALES_PREFIX}${userId}_${date}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setSales(JSON.parse(stored).sales);
    }
  }, [userId, date]);

  const handleSave = () => {
    if (readOnly) return;
    const key = `${DB_SALES_PREFIX}${userId}_${date}`;
    const record: DailyRecord = {
      userId,
      date,
      sales,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(record));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (error) {
      console.error("Erro ao imprimir:", error);
      alert("Para realizar a impressão, abra o aplicativo em uma nova aba usando o botão no canto superior direito do navegador.");
    }
  };

  const updateProduct = (id: string, val: number) => {
    setSales(prev => ({ ...prev, [id]: Math.max(0, val) }));
  };

  const calculateSectionTotal = (products: string[]) => {
    return products.reduce((acc: number, p) => acc + ((sales[p] as number) || 0), 0);
  };

  const grandTotal = Object.values(sales).reduce((acc: number, v: any) => acc + (v as number), 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center justify-between px-1 print:hidden">
        <h3 className="font-bold text-lg">Lançamento de Vendas</h3>
        <span className="text-xs font-semibold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">{new Date(date).toLocaleDateString('pt-BR')}</span>
      </div>

      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce print:hidden">
          <CheckCircle2 size={18} />
          <span className="font-bold text-sm">Dados salvos e sincronizados!</span>
        </div>
      )}

      {/* Printable Area - Hidden normally, visible in print */}
      <div className="hidden print:block font-sans p-8">
        <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-slate-200">
          <div>
            <h1 className="text-3xl font-black text-[#E3000F]">DIÁRIO DE VENDAS</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Tietê Plaza • Claro</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{userName}</p>
            <p className="text-slate-500 text-sm">Data: {new Date(date).toLocaleDateString('pt-BR')} • {userTurno}</p>
          </div>
        </div>
        
        {SECTIONS.map(section => (
          <div key={section.id} className="mb-6">
            <h2 className={cn("text-xs font-black uppercase tracking-widest mb-2 p-2 rounded", section.color)}>{section.name}</h2>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 px-4">
              {section.products.map(p => (
                <div key={p} className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-xs text-slate-600">{p}</span>
                  <span className="text-xs font-black">{sales[p] || 0}</span>
                </div>
              ))}
              <div className="col-span-2 flex justify-end pt-2">
                <span className="text-xs font-black bg-slate-100 px-4 py-1 rounded">SUBTOTAL: {calculateSectionTotal(section.products)}</span>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-12 flex justify-between items-center p-6 bg-[#E3000F] text-white rounded-3xl">
          <span className="text-sm font-black uppercase tracking-widest">TOTAL GERAL DE VENDAS</span>
          <span className="text-4xl font-black">{grandTotal}</span>
        </div>
      </div>

      {/* Screen Form */}
      <div className="space-y-4 print:hidden">
        {SECTIONS.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <div className={cn("px-4 py-2 text-xs font-black uppercase tracking-wider flex justify-between items-center", section.color)}>
              {section.name}
              <span>Total: {calculateSectionTotal(section.products)}</span>
            </div>
            <div className="p-1">
              {section.products.map(p => (
                <div key={p} className="flex items-center justify-between px-3 py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-medium text-slate-600">{p}</span>
                  <div className="flex items-center gap-3">
                    {!readOnly && (
                      <button 
                        onClick={() => updateProduct(p, (sales[p] || 0) - 1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        -
                      </button>
                    )}
                    <input 
                      type="number" 
                      className="w-10 text-center font-bold text-sm bg-transparent pointer-events-none"
                      value={sales[p] || 0}
                      readOnly
                    />
                    {!readOnly && (
                      <button 
                        onClick={() => updateProduct(p, (sales[p] || 0) + 1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 text-[#E3000F] flex items-center justify-center hover:bg-slate-200 transition-colors font-bold"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      {!readOnly && (
        <div className="mt-8 grid grid-cols-2 gap-4 pb-8 print:hidden">
          <button 
            onClick={handleSave}
            className="flex flex-col items-center justify-center gap-2 bg-[#E3000F] text-white p-4 rounded-3xl shadow-xl shadow-[#E3000F]/20 active:scale-95 transition-all"
          >
            <Save size={24} />
            <span className="font-black uppercase text-[10px] tracking-widest">Salvar e Sincronizar</span>
          </button>
          <button 
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-2 bg-white text-slate-900 border-2 border-slate-200 p-4 rounded-3xl active:scale-95 transition-all"
          >
            <Printer size={24} />
            <span className="font-black uppercase text-[10px] tracking-widest">Imprimir PDF</span>
          </button>
        </div>
      )}

      {/* Floating Total Footer */}
      <div className="fixed bottom-20 left-4 right-4 bg-white/80 backdrop-blur-md px-6 py-4 rounded-full border border-white/40 shadow-2xl flex items-center justify-between z-20 print:hidden pointer-events-none">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Acumulado</span>
        <div className="flex items-center gap-2 bg-[#E3000F] text-white px-5 py-1 rounded-full">
          <TrendingUp size={16} />
          <span className="text-xl font-black">{grandTotal}</span>
        </div>
      </div>
    </motion.div>
  );
}

// --- Desempenho Section (Vendedor) ---
function DesempenhoSection({ user }: { user: User }) {
  const [history, setHistory] = useState<DailyRecord[]>([]);

  useEffect(() => {
    const keys = Object.keys(localStorage);
    const userHistory = keys
      .filter(k => k.startsWith(`${DB_SALES_PREFIX}${user.id}`))
      .map(k => JSON.parse(localStorage.getItem(k)!))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setHistory(userHistory.slice(0, 30));
  }, [user.id]);

  const totalMonthly = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return history
      .filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, r) => {
        Object.entries(r.sales).forEach(([id, val]) => {
          acc[id] = ((acc[id] as number) || 0) + (val as number);
        });
        return acc;
      }, {} as SaleEntry);
  }, [history]);

  const chartData = useMemo(() => {
    return [...history].reverse().map(r => ({
      name: new Date(r.date).getDate(),
      total: Object.values(r.sales).reduce((a: number, b: any) => a + (b as number), 0)
    }));
  }, [history]);

  const bestDay = useMemo(() => {
    if (history.length === 0) return null;
    return history.reduce((prev, current) => {
      const prevTotal = Object.values(prev.sales).reduce((a: number, b: any) => a + (b as number), 0);
      const currentTotal = Object.values(current.sales).reduce((a: number, b: any) => a + (b as number), 0);
      return (currentTotal > prevTotal) ? current : prev;
    });
  }, [history]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Award className="text-[#E3000F]" />
        <h3 className="font-bold text-lg">Meu Desempenho</h3>
      </div>

      {/* Monthly Summary Card */}
      <div className="grid grid-cols-1">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-[#E3000F] mb-3">
            <TrendingUp size={24} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Vendas no Mês</span>
          <span className="text-4xl font-black text-[#E3000F]">{Object.values(totalMonthly).reduce((a: number, b: any) => a + (b as number), 0)}</span>
          <span className="text-xs text-slate-400 font-bold mt-1">Acumulado {new Date().toLocaleString('pt-BR', { month: 'long' })}</span>
        </div>
      </div>

      {/* Detalhamento Mensal por Produto */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <ClipboardList size={16} className="text-slate-400" />
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Produção Mensal Detalhada</h4>
        </div>
        <div className="p-4 space-y-6">
          {SECTIONS.map(section => (
            <div key={section.id} className="space-y-3">
              <h5 className={cn("text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded inline-block", section.color)}>
                {section.name}
              </h5>
              <div className="grid grid-cols-1 gap-1">
                {section.products.map(p => {
                  const qty = (totalMonthly[p] as number) || 0;
                  return (
                    <div key={p} className={cn(
                      "flex justify-between items-center px-3 py-2 rounded-xl transition-colors",
                      qty > 0 ? "bg-red-50/50 border border-red-100/50" : "bg-slate-50/50 border border-transparent"
                    )}>
                      <span className={cn("text-xs font-medium", qty > 0 ? "text-slate-900" : "text-slate-400")}>{p}</span>
                      <span className={cn("text-sm font-black", qty > 0 ? "text-[#E3000F]" : "text-slate-300")}>{qty}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Evolução do Mês</h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold">
                        {payload[0].value} Vendas
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="total" radius={[4, 4, 4, 4]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.total === Math.max(...chartData.map(d => d.total)) ? '#E3000F' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Last 30 Days Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-50">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Últimos Lançamentos</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {history.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((record, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{new Date(record.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-xs font-black text-right">{Object.values(record.sales).reduce((a: number, b: any) => a + (b as number), 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs italic">Nenhum registro encontrado.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- Shared Dashboard (Senior & Gerente) ---
function SharedDashboard({ viewingUser, allUsers, todayDate }: { viewingUser: User, allUsers: User[], todayDate: string }) {
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [dailySales, setDailySales] = useState<Record<string, SaleEntry>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const data: Record<string, SaleEntry> = {};
    allUsers.forEach(u => {
      const key = `${DB_SALES_PREFIX}${u.id}_${selectedDate}`;
      const record = localStorage.getItem(key);
      if (record) data[u.id] = JSON.parse(record).sales;
    });
    setDailySales(data);
  }, [allUsers, selectedDate]);

  const consolidated = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.values(dailySales).forEach(userEntry => {
      Object.entries(userEntry).forEach(([prodId, val]) => {
        totals[prodId] = (totals[prodId] || 0) + val;
      });
    });
    return totals;
  }, [dailySales]);

  const ranking = useMemo(() => {
    return allUsers
      .filter(u => u.role === 'VENDEDOR')
      .map(u => ({
        ...u,
        total: Object.values(dailySales[u.id] || {}).reduce((a: number, b: any) => a + (b as number), 0)
      }))
      .sort((a, b) => (b.total as number) - (a.total as number));
  }, [allUsers, dailySales]);

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  if (selectedUser) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase"
        >
          <ArrowLeft size={16} /> Voltar para Dashboard
        </button>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl">{selectedUser.nome}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                {selectedUser.role === 'GERENTE' ? 'Gerente Loja' : `${selectedUser.turno} • ${selectedUser.matricula}`}
              </p>
            </div>
          </div>
          
          <PlanilhaSection userId={selectedUser.id} date={todayDate} userName={selectedUser.nome} userTurno={selectedUser.turno} readOnly={true} />
        </div>
      </div>
    );
  }

  if (showReport) {
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto print:static print:inset-auto">
        <div className="sticky top-0 p-4 border-b bg-white/80 backdrop-blur-md flex justify-between items-center print:hidden">
          <button 
            onClick={() => setShowReport(false)}
            className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className="px-6 py-2 bg-[#E3000F] text-white font-black text-xs uppercase rounded-full shadow-lg"
            >
              Imprimir Relatório
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto py-8">
          <DailyReportManager 
            date={selectedDate} 
            allUsers={allUsers} 
            dailySales={dailySales} 
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-[#E3000F] p-8 -mx-4 -mt-4 text-white rounded-b-[40px] shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black mb-1">Resultados de Loja</h3>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{new Date(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
          </div>
          <div className="flex gap-2">
            {(viewingUser.role === 'GERENTE' || viewingUser.role === 'SENIOR') && (
              <button 
                onClick={() => setShowReport(true)}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-colors print:hidden flex items-center gap-2"
                title="Abrir Relatório de Impressão"
              >
                <Printer size={20} />
                <span className="text-[10px] font-black uppercase">Relatório</span>
              </button>
            )}
            {(viewingUser.role === 'SENIOR' || viewingUser.role === 'GERENTE') && (
              <button 
                onClick={handlePrint}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-colors print:hidden"
                title="Imprimir Resultados Rápidos"
              >
                <FileText size={20} />
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4">
            <h4 className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1 text-white">Vendas Totais</h4>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black">{Object.values(consolidated).reduce((a: number, b: any) => a + (b as number), 0)}</span>
              <TrendingUp size={20} className="mb-2" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4">
            <h4 className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1 text-white">Data de Consulta</h4>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-white text-sm font-bold focus:ring-0 p-0 w-full"
            />
          </div>
        </div>
      </div>

      {viewingUser.role === 'GERENTE' && selectedDate === todayDate && (
        <div className="bg-gradient-to-br from-amber-400 to-orange-600 p-6 rounded-[32px] text-white shadow-xl shadow-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Award size={24} />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">Destaque do Mês</h4>
              <p className="font-black text-lg">Melhor Vendedor</p>
            </div>
          </div>
          {ranking.length > 0 ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black">{ranking[0].nome}</p>
                <p className="text-xs font-bold opacity-80 uppercase tracking-wider">{ranking[0].total} TOTAL DE VENDAS</p>
              </div>
              <div className="text-5xl font-black opacity-30">#1</div>
            </div>
          ) : (
             <p className="text-sm opacity-80">Aguardando dados...</p>
          )}
        </div>
      )}

      {/* Printable Area - Results History Daily */}
      <div className="hidden print:block font-sans">
        <div className="flex justify-between items-center mb-8 border-b-4 border-[#E3000F] pb-4">
          <div>
            <h1 className="text-4xl font-black text-[#E3000F]">RELATÓRIO DE RESULTADOS</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest">Tietê Plaza • Fechamento de Unidade</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{new Date(selectedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p className="text-slate-400 text-xs font-bold uppercase">Emitido por: {viewingUser.nome}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-100 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total de Vendas</p>
            <p className="text-4xl font-black">{Object.values(consolidated).reduce((a: number, b: any) => a + (b as number), 0)}</p>
          </div>
          <div className="bg-slate-100 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Vendedores Ativos</p>
            <p className="text-4xl font-black">{ranking.filter(u => (u.total as number) > 0).length}</p>
          </div>
          <div className="bg-slate-100 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Melhor Vendedor</p>
            <p className="text-xl font-black uppercase">{ranking[0]?.nome || '-'}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h4 className="text-xs font-black bg-slate-900 text-white p-2 rounded uppercase tracking-widest mb-4">Produção Geral por Seção</h4>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              {SECTIONS.map(s => {
                const sectionSum = s.products.reduce((acc: number, p: string) => acc + ((consolidated[p] as number) || 0), 0);
                return (
                  <div key={s.id} className="border-b border-slate-200 pb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-sm uppercase">{s.name}</span>
                      <span className="text-lg font-black">{sectionSum}</span>
                    </div>
                    <div className="space-y-1">
                      {s.products.map(p => (
                        <div key={p} className="flex justify-between text-[10px] text-slate-600">
                          <span>{p}</span>
                          <span className="font-bold">{consolidated[p] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black bg-slate-900 text-white p-2 rounded uppercase tracking-widest mb-4">Ranking de Vendedores</h4>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-800 text-[10px] font-black uppercase">
                  <th className="py-2">Posição</th>
                  <th className="py-2">Colaborador</th>
                  <th className="py-2">Turno</th>
                  <th className="py-2 text-right">Produção Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranking.map((u, i) => (
                  <tr key={u.id}>
                    <td className="py-3 font-bold text-sm">{i + 1}º</td>
                    <td className="py-3 font-bold text-sm">{u.nome}</td>
                    <td className="py-3 text-xs uppercase text-slate-500">
                      {u.role === 'GERENTE' ? 'Gerente Loja' : u.turno}
                    </td>
                    <td className="py-3 font-black text-right">{u.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {viewingUser.role === 'GERENTE' ? 'Ranking do Dia' : 'Vendedores'}
        </h4>
      </div>
      <div className="space-y-3">
        {ranking.map((u, i) => (
          <button 
            key={u.id}
            onClick={() => setSelectedUser(u)}
            className="w-full bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 hover:border-[#E3000F] transition-all group"
          >
            <div className="flex items-center gap-4">
              {viewingUser.role === 'GERENTE' ? (
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs",
                  i === 0 ? "bg-yellow-100 text-yellow-600" : 
                  i === 1 ? "bg-slate-100 text-slate-400" : 
                  i === 2 ? "bg-orange-50 text-orange-400" : "bg-slate-50 text-slate-300"
                )}>
                  {i + 1}º
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                  <UserPlus size={16} />
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-bold group-hover:text-[#E3000F]">{u.nome}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {u.role === 'GERENTE' ? 'Gerente Loja' : u.turno}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-slate-900">{u.total}</span>
              <ChevronRight size={16} className="text-slate-200" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mt-8 space-y-8">
        <div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Consolidado por Seção</h4>
          <div className="space-y-4">
            {SECTIONS.map(s => {
              const sectionTotal = s.products.reduce((acc: number, p: string) => acc + ((consolidated[p] as number) || 0), 0);
              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-black">
                    <span className="uppercase text-slate-500">{s.name.replace('Seção ', '')}</span>
                    <span>{sectionTotal}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (sectionTotal / 50) * 100)}%` }}
                      className={cn("h-full rounded-full transition-all", s.id === 'gross' ? 'bg-blue-500' : s.id === 'mplay' ? 'bg-green-500' : s.id === 'residenciais' ? 'bg-orange-500' : s.id === 'servicos' ? 'bg-purple-500' : 'bg-yellow-500')} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-50">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Detalhamento por Item (Loja)</h4>
          <div className="space-y-6">
            {SECTIONS.map(section => (
              <div key={section.id} className="space-y-2">
                <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded inline-block", section.color)}>
                  {section.name}
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {section.products.map(p => {
                    const qty = consolidated[p] || 0;
                    return (
                      <div key={p} className="flex justify-between items-center px-2 py-1.5 border-b border-slate-50 last:border-0">
                        <span className="text-[11px] font-medium text-slate-600">{p}</span>
                        <span className={cn("text-xs font-black", qty > 0 ? "text-slate-900" : "text-slate-300")}>{qty}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Admin Panel (Gerente) ---
function AdminPanel({ users, setUsers, todayDate }: { users: User[], setUsers: (u: User[]) => void, todayDate: string }) {
  const [subTab, setSubTab] = useState<'usuarios' | 'historico' | 'senior'>('usuarios');
  const [newUserOpen, setNewUserOpen] = useState(false);

  const handleApprove = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: 'APROVADO' } : u));
  };

  const handleReject = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? O acesso será revogado imediatamente.')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleCreateSenior = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const senior: User = {
      id: `s-${Date.now()}`,
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      cpf: formData.get('cpf') as string,
      matricula: formData.get('matricula') as string,
      senha: formData.get('senha') as string,
      role: 'SENIOR',
      status: 'APROVADO',
      turno: formData.get('turno') as Turno,
      createdAt: new Date().toISOString()
    };
    setUsers([...users, senior]);
    setNewUserOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setSubTab('usuarios')}
          className={cn("px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all", subTab === 'usuarios' ? "bg-[#E3000F] text-white shadow-lg shadow-[#E3000F]/20" : "bg-white text-slate-400 border border-slate-100")}
        >
          Usuários
        </button>
        <button 
          onClick={() => setSubTab('historico')}
          className={cn("px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all", subTab === 'historico' ? "bg-[#E3000F] text-white shadow-lg shadow-[#E3000F]/20" : "bg-white text-slate-400 border border-slate-100")}
        >
          Histórico Mensal
        </button>
        <button 
          onClick={() => setSubTab('senior')}
          className={cn("px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all", subTab === 'senior' ? "bg-[#E3000F] text-white shadow-lg shadow-[#E3000F]/20" : "bg-white text-slate-400 border border-slate-100")}
        >
          Contas Sênior
        </button>
      </div>

      {subTab === 'usuarios' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pendentes de Aprovação</h4>
              <span className="bg-[#E3000F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{users.filter(u => u.status === 'PENDENTE').length}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {users.filter(u => u.status === 'PENDENTE').length > 0 ? (
                users.filter(u => u.status === 'PENDENTE').map(u => (
                  <div key={u.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{u.nome}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {u.role === 'GERENTE' ? 'Gerente Loja' : `${u.turno} • ${u.matricula}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReject(u.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <XCircle size={24} />
                      </button>
                      <button 
                        onClick={() => handleApprove(u.id)}
                        className="p-2 text-slate-300 hover:text-green-500 transition-colors"
                      >
                        <CheckCircle2 size={24} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs italic">Nenhuma solicitação pendente.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Usuários Ativos</h4>
            </div>
            <div className="divide-y divide-slate-50">
              {users.filter(u => u.status === 'APROVADO').map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px]",
                      u.role === 'GERENTE' ? "bg-slate-900 text-white" : u.role === 'SENIOR' ? "bg-[#E3000F] text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {u.role[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{u.nome}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {u.role === 'GERENTE' ? 'Gerente Loja' : `${u.role} • ${u.turno}`}
                      </p>
                    </div>
                  </div>
                  {u.role !== 'GERENTE' && (
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 text-slate-300 hover:text-[#E3000F] transition-colors"
                      title="Excluir Usuário"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'historico' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Relatório Consolidado Mensal</h4>
            <div className="flex items-center gap-4 bg-red-50 p-4 rounded-2xl mb-6">
              <Calendar className="text-[#E3000F]" />
              <div>
                <p className="text-xs font-black uppercase text-slate-400">Referência</p>
                <p className="text-sm font-black text-[#E3000F] uppercase">{new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="space-y-4">
              {(() => {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const monthlyTotals: Record<string, number> = {};
                
                // Varre localStorage para somar tudo do mês
                Object.keys(localStorage).forEach(key => {
                  if (key.startsWith(DB_SALES_PREFIX)) {
                    const parts = key.split('_');
                    const datePart = parts[parts.length - 1];
                    const date = new Date(datePart);
                    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                      const record = JSON.parse(localStorage.getItem(key)!);
                      Object.entries(record.sales).forEach(([prodId, val]) => {
                        monthlyTotals[prodId] = (monthlyTotals[prodId] || 0) + (val as number);
                      });
                    }
                  }
                });

                return SECTIONS.map(section => {
                  const sectionSum = section.products.reduce((acc, p) => acc + (monthlyTotals[p] || 0), 0);
                  return (
                    <div key={section.id} className="border-b border-slate-50 pb-4 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded", section.color)}>
                          {section.name}
                        </span>
                        <span className="text-sm font-black">{sectionSum}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 px-2">
                        {section.products.map(p => (
                          <div key={p} className="flex justify-between text-[10px] text-slate-500">
                            <span>{p}</span>
                            <span className="font-bold">{monthlyTotals[p] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {subTab === 'senior' && (
        <div className="space-y-4">
          <button 
            onClick={() => setNewUserOpen(true)}
            className="w-full bg-[#E3000F] text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#E3000F]/20"
          >
            <Plus size={20} /> Criar Vendedor Sênior
          </button>

          {newUserOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 left-0 h-2 bg-[#E3000F]"></div>
                <h3 className="text-xl font-black mb-6">Novo Vendedor Sênior</h3>
                <form onSubmit={handleCreateSenior} className="space-y-4">
                  <input required name="nome" placeholder="Nome Completo" className="w-full px-4 py-3 bg-slate-50 rounded-xl" />
                  <input required name="email" type="email" placeholder="E-mail Corporativo" className="w-full px-4 py-3 bg-slate-50 rounded-xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required name="cpf" placeholder="CPF" className="w-full px-4 py-3 bg-slate-50 rounded-xl" />
                    <input required name="matricula" placeholder="Matrícula" className="w-full px-4 py-3 bg-slate-50 rounded-xl" />
                  </div>
                  <input required name="senha" type="password" placeholder="Senha" className="w-full px-4 py-3 bg-slate-50 rounded-xl" />
                  <select name="turno" className="w-full px-4 py-3 bg-slate-50 rounded-xl">
                    <option value="09:40-18:00">Turno 1: 09h40 – 18h00</option>
                    <option value="13:40-22:00">Turno 2: 13h40 – 22h00</option>
                  </select>
                  <div className="flex gap-4 mt-6">
                    <button type="button" onClick={() => setNewUserOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                    <button type="submit" className="flex-1 bg-slate-900 text-white rounded-2xl font-bold">Criar Conta</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Sêniors Cadastrados</h4>
            </div>
            <div className="divide-y divide-slate-50">
              {users.filter(u => u.role === 'SENIOR').length > 0 ? (
                users.filter(u => u.role === 'SENIOR').map(u => (
                  <div key={u.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{u.nome}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.turno} • {u.matricula}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 text-slate-300 hover:text-[#E3000F] transition-colors"
                      title="Excluir Usuário"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs italic">Nenhum sênior cadastrado.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- Capa de Lote Section (Vendedor Exclusive) ---
function CapaDeLoteSection({ userId }: { userId: string }) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [goals, setGoals] = useState<{ revenue: number }>({ revenue: 0 });
  const [installs, setInstalls] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'financeiro' | 'tabela' | 'instalações'>('financeiro');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [metaFile, setMetaFile] = useState<string | null>(null);
  const [priceFile, setPriceFile] = useState<string | null>(null);

  useEffect(() => {
    // Load Prices
    const storedPrices = localStorage.getItem(`${DB_PRICES_PREFIX}${userId}`);
    if (storedPrices) setPrices(JSON.parse(storedPrices));
    
    // Load Goals
    const storedGoals = localStorage.getItem(`${DB_GOALS_PREFIX}${userId}`);
    if (storedGoals) setGoals(JSON.parse(storedGoals));

    // Load Installs
    const storedInstalls = localStorage.getItem(`${DB_INSTALLS_PREFIX}${userId}`);
    if (storedInstalls) setInstalls(JSON.parse(storedInstalls));

    // Load Sales History for calculations
    const keys = Object.keys(localStorage);
    const userHistory = keys
      .filter(k => k.startsWith(`${DB_SALES_PREFIX}${userId}`))
      .map(k => JSON.parse(localStorage.getItem(k)!));
    setHistory(userHistory);
  }, [userId]);

  const handleFileUpload = (type: 'meta' | 'price', file: File) => {
    if (type === 'meta') {
      setMetaFile(file.name);
      // Simulate reading and setting a goal
      setTimeout(() => {
        saveGoals({ revenue: 7500 }); // Mocked value from "file"
      }, 1000);
    } else {
      setPriceFile(file.name);
      // Simulate reading and setting some prices
      setTimeout(() => {
        const mockPrices = { ...prices };
        SECTIONS.forEach(s => s.products.forEach(p => {
          if (!mockPrices[p]) mockPrices[p] = Math.floor(Math.random() * 50) + 10;
        }));
        savePrices(mockPrices);
      }, 1000);
    }
  };

  const savePrices = (newPrices: Record<string, number>) => {
    setPrices(newPrices);
    localStorage.setItem(`${DB_PRICES_PREFIX}${userId}`, JSON.stringify(newPrices));
  };

  const saveGoals = (newGoals: { revenue: number }) => {
    setGoals(newGoals);
    localStorage.setItem(`${DB_GOALS_PREFIX}${userId}`, JSON.stringify(newGoals));
  };

  const saveInstalls = (newInstalls: any[]) => {
    setInstalls(newInstalls);
    localStorage.setItem(`${DB_INSTALLS_PREFIX}${userId}`, JSON.stringify(newInstalls));
  };

  const calculateRevenue = (sales: SaleEntry) => {
    return Object.entries(sales).reduce((acc, [prodId, qty]) => {
      return acc + ((prices[prodId] || 0) * (qty as number));
    }, 0);
  };

  const todayDate = new Date().toISOString().split('T')[0];
  const todayEntry = history.find(h => h.date === todayDate);
  const revenueToday = todayEntry ? calculateRevenue(todayEntry.sales) : 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = history
    .filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, r) => acc + calculateRevenue(r.sales), 0);

  const goalProgress = goals.revenue > 0 ? (monthlyRevenue / goals.revenue) * 100 : 0;

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      {/* Header Card */}
      <div className="bg-slate-900 p-8 -mx-4 -mt-4 text-white rounded-b-[40px] shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black mb-1">Capa de Lote</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Gestão de Receita e Comissões</p>
          </div>
          <button 
            onClick={handlePrint}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors print:hidden"
          >
            <Printer size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Coins size={14} className="text-yellow-400" />
              <h4 className="text-[10px] font-black opacity-60 uppercase tracking-widest text-white">Receita Hoje</h4>
            </div>
            <p className="text-2xl font-black">R$ {revenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-green-400" />
              <h4 className="text-[10px] font-black opacity-60 uppercase tracking-widest text-white">Acumulado Mês</h4>
            </div>
            <p className="text-2xl font-black">R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Goal Bar */}
        <div className="mt-6 space-y-2 relative z-10">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Meta de Receita</span>
            <span className="text-xs font-black">{goalProgress.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, goalProgress)}%` }}
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
            />
          </div>
          <div className="flex justify-between text-[9px] font-bold opacity-40 uppercase">
            <span>R$ 0,00</span>
            <span>R$ {goals.revenue.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Internal Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 print:hidden scrollbar-hide">
        {(['financeiro', 'tabela', 'instalações'] as const).map(t => (
          <button 
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === t ? "bg-[#E3000F] text-white shadow-lg shadow-[#E3000F]/20" : "bg-white text-slate-400 border border-slate-100"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'financeiro' && (
          <motion.div 
            key="financeiro"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-50 rounded-xl text-yellow-600">
                    <Target size={20} />
                  </div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Configurar Meta Mensal</h4>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    <Upload size={14} className="text-slate-500" />
                    <span className="text-[10px] font-black uppercase text-slate-500">Upload Meta</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".csv,.xlsx,.pdf,.txt"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('meta', e.target.files[0])}
                    />
                  </label>
                  {metaFile && <span className="text-[9px] font-bold text-green-500 uppercase">Sincronizado</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Receita Desejada (R$)</label>
                  <input 
                    type="number"
                    value={goals.revenue || ''}
                    onChange={(e) => saveGoals({ revenue: Number(e.target.value) })}
                    placeholder="Ex: 5000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E3000F]/20"
                  />
                </div>
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 mt-4">
                  <TrendingUp size={20} />
                </div>
              </div>
              {metaFile && (
                <p className="mt-3 text-[9px] font-medium text-slate-400 flex items-center gap-1 italic">
                   Arquivo: {metaFile}
                </p>
              )}
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Destaques da Produção</h4>
              <div className="space-y-3">
                {rankingProducts(history, prices).slice(0, 5).map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-300 w-4">{idx + 1}</span>
                      <span className="text-xs font-medium text-slate-600">{item.id}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">R$ {item.revenue.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tabela' && (
          <motion.div 
            key="tabela"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 mb-4 flex justify-between items-start">
              <div className="flex gap-4">
                <Search className="text-blue-500 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Configure o <strong>valor de comissão ou receita</strong> para cada item. Você pode digitar manualmente ou <strong>subir a planilha completa</strong>.
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-2">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-2xl transition-colors text-white shadow-lg shadow-blue-500/20">
                  <Upload size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Subir Planilha</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv,.xlsx,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('price', e.target.files[0])}
                  />
                </label>
                {priceFile && (
                  <span className="text-[8px] font-bold text-blue-400 uppercase truncate max-w-[100px]">
                    {priceFile}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {SECTIONS.map(section => (
                <div key={section.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
                  <div className={cn("px-5 py-3 text-[10px] font-black uppercase tracking-widest", section.color)}>
                    {section.name}
                  </div>
                  <div className="p-2 space-y-1">
                    {section.products.map(p => (
                      <div key={p} className="flex items-center justify-between px-3 py-2 border-b border-slate-50 last:border-0 grow">
                        <span className="text-[11px] font-medium text-slate-500 mr-2">{p}</span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">R$</span>
                          <input 
                            type="number"
                            value={prices[p] || ''}
                            onChange={(e) => savePrices({ ...prices, [p]: Number(e.target.value) })}
                            className="w-24 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-700 text-right focus:outline-none focus:ring-2 focus:ring-[#E3000F]/10"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'instalações' && (
          <motion.div 
            key="instalações"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setShowInstallModal(true)}
              className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
            >
              <Plus size={18} /> Novo Agendamento Residencial
            </button>

            <div className="space-y-4">
              {installs.length > 0 ? (
                installs
                  .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
                  .map(install => (
                  <div key={install.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex flex-col items-center justify-center text-orange-600 shrink-0">
                      <span className="text-[10px] font-black leading-none">{new Date(install.date).getDate()}</span>
                      <span className="text-[8px] font-black uppercase leading-none mt-0.5">{new Date(install.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="font-bold text-sm truncate">{install.customer}</h5>
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{install.time}</span>
                      </div>
                      <div className="flex gap-2 mb-2">
                        {install.cpf && <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">CPF: {install.cpf}</span>}
                        {install.contrato && <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">Contrato: {install.contrato}</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">{install.service}</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const remaining = installs.filter(i => i.id !== install.id);
                            saveInstalls(remaining);
                          }}
                          className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          Concluir / Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center bg-white rounded-[32px] border border-slate-100 border-dashed">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Clock size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum agendamento ativo</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Alert Example */}
      {installs.some(i => i.date === todayDate) && (
        <div className="fixed bottom-24 left-4 right-4 z-50 print:hidden pointer-events-none">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-orange-500 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-3 pointer-events-auto"
          >
            <Bell size={24} className="shrink-0 animate-ring" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Lembrete de Instalação</p>
              <p className="text-xs font-bold truncate">Você tem agendamentos residenciais para hoje!</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Agendamento */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 left-0 h-2 bg-orange-500"></div>
            <h3 className="text-xl font-black mb-6">Novo Agendamento</h3>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const newInstall = {
                id: Date.now().toString(),
                customer: f.get('customer'),
                service: f.get('service'),
                cpf: f.get('cpf'),
                contrato: f.get('contrato'),
                date: f.get('date'),
                time: f.get('time')
              };
              saveInstalls([...installs, newInstall]);
              setShowInstallModal(false);
            }}>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cliente</label>
                <input required name="customer" placeholder="Nome do cliente" className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">CPF</label>
                  <input name="cpf" placeholder="000.000.000-00" className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contrato</label>
                  <input name="contrato" placeholder="Nº Contrato" className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Serviço/Produto</label>
                <input required name="service" placeholder="Ex: Fibra 500MB" className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data</label>
                  <input required name="date" type="date" className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Horário</label>
                  <input required name="time" type="time" className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowInstallModal(false)} className="flex-1 py-4 font-bold text-slate-400 text-xs uppercase">Fechar</button>
                <button type="submit" className="flex-[2] bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-200">Salvar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Print View Capa de Lote */}
      <div className="hidden print:block font-sans text-slate-900">
        <div className="flex justify-between items-center mb-12 border-b-4 border-slate-900 pb-6">
          <div>
            <h1 className="text-4xl font-black uppercase">Capa de Lote - Vendas</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest mt-1">Relatório Individual de Performance Financeira</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-tighter">Sincronizado via Tietê Plaza App</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-50 p-6 rounded-3xl border-l-8 border-slate-900">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Histórico Mensal</p>
            <p className="text-4xl font-black">R$ {monthlyRevenue.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border-l-8 border-slate-400">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Meta Financeira</p>
            <p className="text-4xl font-black">R$ {goals.revenue.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border-l-8 border-[#E3000F]">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Aproveitamento</p>
            <p className="text-4xl font-black">{goalProgress.toFixed(1)}%</p>
          </div>
        </div>

        <div className="space-y-12">
          <div>
            <h4 className="text-xs font-black bg-slate-900 text-white py-2 px-4 rounded uppercase tracking-[0.2em] mb-6">Detalhamento Financeiro por Produto</h4>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="py-4 px-2">Produto / Serviço</th>
                  <th className="py-4 px-2">Qtd Vendida</th>
                  <th className="py-4 px-2 text-right">Valor Unit.</th>
                  <th className="py-4 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankingProducts(history, prices).filter(p => p.qty > 0).map(item => (
                  <tr key={item.id}>
                    <td className="py-4 px-2 font-bold text-sm">{item.id}</td>
                    <td className="py-4 px-2 font-black text-slate-400">{item.qty}</td>
                    <td className="py-4 px-2 text-right text-slate-500">R$ {item.unit.toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-2 text-right font-black">R$ {item.revenue.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white">
                  <td colSpan={3} className="py-6 px-4 font-black uppercase tracking-widest text-sm text-right">Total Geral Receita</td>
                  <td className="py-6 px-4 text-3xl font-black text-right">R$ {monthlyRevenue.toLocaleString('pt-BR')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper for sorting products by revenue
function rankingProducts(history: DailyRecord[], prices: Record<string, number>) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totals: Record<string, { qty: number, revenue: number, unit: number }> = {};

  history
    .filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .forEach(r => {
      Object.entries(r.sales).forEach(([id, qty]) => {
        const unit = prices[id] || 0;
        if (!totals[id]) totals[id] = { qty: 0, revenue: 0, unit };
        totals[id].qty += (qty as number);
        totals[id].revenue += (qty as number) * unit;
      });
    });

  return Object.entries(totals)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Daily Report Manager Printable for Store Closure
 * Renders a grid where columns are sellers and rows are products grouped by section.
 */
function DailyReportManager({ date, allUsers, dailySales }: { date: string, allUsers: User[], dailySales: Record<string, SaleEntry> }) {
  const sellers = useMemo(() => allUsers.filter(u => u.role === 'VENDEDOR'), [allUsers]);
  
  const monthNames = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
  const d = new Date(date);
  const dayStr = d.getDate().toString().padStart(2, '0');
  const monthStr = monthNames[d.getMonth()];
  const yearStr = d.getFullYear();

  return (
    <div className="bg-white p-4 font-sans text-[10px] text-slate-800 printable-report overflow-x-auto w-full">
      <div className="border-2 border-slate-900 mx-auto max-w-[1000px]">
        <div className="text-center border-b-2 border-slate-900 py-2 bg-slate-900 text-white">
          <h1 className="font-black text-base uppercase tracking-[0.2em]">DIÁRIO DE VENDAS - TIETÊ PLAZA</h1>
        </div>
        
        <div className="flex border-b-2 border-slate-900 px-6 py-2 justify-between font-black uppercase tracking-widest bg-slate-50">
          <div>SENHAS: ____________________</div>
          <div>DATA: {dayStr} / {monthStr} / {yearStr}</div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-r-2 border-slate-900 w-[180px] bg-slate-200 py-3 px-4 text-left font-black uppercase text-[9px] tracking-widest">Produtos / Serviços</th>
              {sellers.map(u => (
                <th key={u.id} className="border-r-2 border-slate-900 text-[8px] p-2 bg-white font-black uppercase border-b-2 overflow-hidden text-ellipsis whitespace-nowrap max-w-[60px]">
                  {u.nome.split(' ')[0]}
                </th>
              ))}
              <th className="p-2 font-black bg-slate-900 text-white text-center uppercase tracking-tighter">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((section, sIdx) => (
              <React.Fragment key={section.id}>
                <tr className={cn(
                  "border-y-2 border-slate-900",
                  sIdx === 0 ? "bg-blue-900/10" : 
                  sIdx === 1 ? "bg-green-900/10" : 
                  sIdx === 2 ? "bg-orange-900/10" : 
                  sIdx === 3 ? "bg-purple-900/10" : "bg-yellow-900/10"
                )}>
                  <td colSpan={sellers.length + 2} className="text-center font-black tracking-[0.5em] text-[11px] py-1.5 uppercase">
                    {section.name.replace('Seção ', '')}
                  </td>
                </tr>
                {section.products.map((product) => {
                  let rowTotal = 0;
                  return (
                    <tr key={product} className="border-b border-slate-200">
                      <td className="border-r-2 border-slate-900 px-4 py-1.5 font-bold bg-slate-50 text-[8px] uppercase tracking-tight">
                        {product}
                      </td>
                      {sellers.map(u => {
                        const val = dailySales[u.id]?.[product] || 0;
                        rowTotal += val;
                        return (
                          <td key={u.id} className="border-r-2 border-slate-900 text-center py-1.5 font-black text-xs">
                            {val || ''}
                          </td>
                        );
                      })}
                      <td className="text-center font-black bg-slate-100 py-1.5 text-xs text-slate-900 border-l border-slate-900">{rowTotal || 0}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-between px-6 text-slate-400 font-bold uppercase tracking-widest text-[8px]">
        <span>Emitido em: {new Date().toLocaleString()}</span>
        <span>Tietê Plaza • Documento de Uso Interno</span>
      </div>
    </div>
  );
}
