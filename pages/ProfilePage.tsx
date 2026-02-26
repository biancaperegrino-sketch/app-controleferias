
import React, { useRef } from 'react';
import { useAuth } from '../App';
import { 
  User as UserIcon, 
  Mail, 
  ShieldCheck, 
  Upload,
  Palette,
  RotateCcw,
  History,
  Clock,
  Lock,
  User as UserProfileIcon,
  ShieldAlert
} from 'lucide-react';
import { AuditLog, UserRole } from '../types';

interface ProfilePageProps {
  logs: AuditLog[];
}

const ROOT_ADMIN_EMAIL = 'bianca.bomfim@fgv.br';

const ProfilePage: React.FC<ProfilePageProps> = ({ logs }) => {
  const { user, logo, updateLogo, resetLogo } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const isAdmin = user.email === ROOT_ADMIN_EMAIL;
  const userLogs = logs.filter(l => l.userId === user.id);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isAdmin) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">
            {isAdmin ? 'Configurações Globais' : 'Perfil do Usuário'}
          </h2>
          <p className="text-[#8B949E] font-bold text-sm uppercase tracking-wider">
            {isAdmin ? 'Controle de Governança e Branding' : 'Informações da Conta Microsoft'}
          </p>
        </div>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${isAdmin ? 'bg-amber-950/20 text-amber-500 border-amber-500/30' : 'bg-blue-900/20 text-[#1F6FEB] border-[#1F6FEB]/30'}`}>
          <ShieldCheck size={20} />
          {isAdmin ? 'Permissão Total' : 'Acesso Padrão'}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[#161B22] rounded-[3rem] border border-[#30363D] shadow-2xl overflow-hidden p-12 text-center relative">
            <div className="absolute top-0 left-0 w-full h-32 bg-[#0D1117] border-b border-[#30363D]"></div>
            <div className="relative z-10">
              <div className={`h-40 w-40 rounded-[2.5rem] flex items-center justify-center text-white text-6xl font-black mx-auto mb-8 shadow-2xl border-[12px] border-[#161B22] ${isAdmin ? 'bg-amber-500' : 'bg-[#1F6FEB]'}`}>
                {user.name.charAt(0)}
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">{user.name}</h3>
              <p className="text-[#8B949E] font-bold text-xs lowercase mt-2">{user.email}</p>
              <div className="mt-8 flex justify-center">
                 <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${isAdmin ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-[#1F6FEB]/10 text-[#1F6FEB] border-[#1F6FEB]/20'}`}>
                    {user.role}
                 </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-[#161B22] rounded-[3rem] border border-[#30363D] shadow-2xl overflow-hidden p-8 space-y-8 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#1F6FEB]/10 rounded-xl flex items-center justify-center text-[#1F6FEB]">
                  <Palette size={20} />
                </div>
                <h4 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">Identidade Visual</h4>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-[#30363D] flex items-center justify-center min-h-[140px]">
                <img src={logo} alt="Preview" className="max-h-20 w-auto object-contain" />
              </div>

              <div className="space-y-3">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1F6FEB] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#388BFD] transition-all"
                >
                  <Upload size={18} /> Alterar Logo
                </button>
                <button 
                  onClick={resetLogo}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#0D1117] text-[#8B949E] border border-[#30363D] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                >
                  <RotateCcw size={18} /> Restaurar Padrão
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-10">
          <div className="bg-[#161B22] rounded-[3rem] border border-[#30363D] shadow-2xl overflow-hidden p-10 space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#484F58]">
                    <Mail size={16} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Identificador Corporativo</span>
                  </div>
                  <p className="text-base font-bold text-white">{user.email}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#484F58]">
                    <ShieldCheck size={16} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Escopo de Autorização</span>
                  </div>
                  <p className={`text-base font-black uppercase ${isAdmin ? 'text-amber-500' : 'text-[#1F6FEB]'}`}>{user.role}</p>
                </div>
             </div>

             {!isAdmin && (
               <div className="p-6 bg-[#0D1117] rounded-3xl border border-[#30363D] flex items-start gap-4">
                  <ShieldAlert size={20} className="text-[#1F6FEB] shrink-0" />
                  <p className="text-[10px] text-[#8B949E] font-bold uppercase tracking-widest leading-relaxed">
                    SEU PERFIL É LIMITADO À <strong>VISUALIZAÇÃO DE DADOS</strong>. PARA ALTERAÇÕES DE SALDO, ENTRE EM CONTATO COM A GESTORA DO SISTEMA.
                  </p>
               </div>
             )}
          </div>

          <div className="bg-[#161B22] rounded-[3rem] border border-[#30363D] shadow-xl overflow-hidden">
            <div className="px-10 py-8 border-b border-[#30363D] bg-[#0D1117]/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-[#30363D] rounded-xl flex items-center justify-center text-[#8B949E]">
                  <History size={20} />
                </div>
                <h4 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">Atividades Recentes</h4>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#0D1117] text-[#8B949E] font-black uppercase tracking-[0.2em] text-[10px]">
                  <tr>
                    <th className="px-10 py-5">Movimentação</th>
                    <th className="px-10 py-5">Carimbo de Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363D]">
                  {userLogs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-[#1F6FEB]/5 transition-colors">
                      <td className="px-10 py-6 font-bold text-white uppercase tracking-tight text-xs">{log.action}</td>
                      <td className="px-10 py-6 text-[#8B949E] text-xs font-bold tabular-nums">
                        <div className="flex items-center gap-3">
                           <Clock size={14} className="text-[#30363D]" />
                           {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {userLogs.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-10 py-12 text-center text-[#484F58] font-black uppercase text-[10px] tracking-widest">Nenhuma atividade registrada</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
