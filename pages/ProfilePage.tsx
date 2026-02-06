
import React from 'react';
import { useAuth } from '../App';
import { User, Mail, Building, Shield, History, Clock, Key, ShieldCheck } from 'lucide-react';
import { AuditLog, UserRole } from '../types';

interface ProfilePageProps {
  logs: AuditLog[];
}

const ProfilePage: React.FC<ProfilePageProps> = ({ logs }) => {
  const { user } = useAuth();

  if (!user) return null;

  const userLogs = logs.filter(l => l.userId === user.id);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Identidade Corporativa</h2>
          <p className="text-[#8B949E] font-bold text-sm uppercase tracking-wider">Perfil Integrado via Microsoft 365 Entra ID</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-950/20 text-emerald-500 px-6 py-3 rounded-2xl border border-emerald-500/30 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/5">
          <ShieldCheck size={20} />
          Autenticação Multifator Ativa
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <div className="bg-[#161B22] rounded-[3rem] border border-[#30363D] shadow-2xl overflow-hidden text-center p-12 relative group">
            <div className="absolute top-0 left-0 w-full h-32 bg-[#0D1117] border-b border-[#30363D]"></div>
            <div className="relative z-10">
              <div className="h-40 w-40 rounded-[2.5rem] bg-[#1F6FEB] flex items-center justify-center text-white text-6xl font-black mx-auto mb-8 shadow-[0_24px_48px_-12px_rgba(31,111,235,0.4)] border-[12px] border-[#161B22] group-hover:rotate-6 transition-transform">
                {user.name.charAt(0)}
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{user.name}</h3>
              <p className="text-xs font-black text-[#1F6FEB] mt-4 uppercase tracking-[0.3em] bg-[#1F6FEB]/10 py-2 px-4 rounded-xl inline-block border border-[#1F6FEB]/20">{user.role}</p>
              
              <div className="mt-12 pt-10 border-t border-[#30363D] space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[#484F58] font-black uppercase tracking-widest text-[9px]">Microsoft Account ID</span>
                  <span className="font-mono bg-[#0D1117] px-3 py-1.5 rounded-xl text-[#8B949E] text-[10px] border border-[#30363D]">{user.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#484F58] font-black uppercase tracking-widest text-[9px]">Status de Acesso</span>
                  <span className="text-emerald-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    VERIFICADO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-10">
          <div className="bg-[#161B22] rounded-[3rem] border border-[#30363D] shadow-2xl overflow-hidden">
            <div className="px-10 py-8 border-b border-[#30363D] bg-[#0D1117]/50 flex items-center gap-4">
              <div className="h-10 w-10 bg-[#30363D] rounded-xl flex items-center justify-center text-[#1F6FEB]">
                <Key size={22} />
              </div>
              <h4 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">Metadados da Conta Corporativa</h4>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[#484F58]">
                  <Mail size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Diretório de E-mail</span>
                </div>
                <p className="text-base font-bold text-white uppercase tracking-tight">{user.email}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[#484F58]">
                  <Building size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Departamento Atribuído</span>
                </div>
                <p className="text-base font-bold text-white uppercase tracking-tight">{user.unit}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[#484F58]">
                  <Shield size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nível de Privilégio</span>
                </div>
                <p className="text-base font-bold text-[#1F6FEB] uppercase tracking-tight">{user.role}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[#484F58]">
                  <History size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Autoridade SSO</span>
                </div>
                <p className="text-base font-bold text-white uppercase tracking-tight">MICROSOFT AZURE ENTRA</p>
              </div>
            </div>
          </div>

          <div className="bg-[#161B22] rounded-[3rem] border border-[#30363D] shadow-2xl overflow-hidden">
            <div className="px-10 py-8 border-b border-[#30363D] bg-[#0D1117]/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-[#30363D] rounded-xl flex items-center justify-center text-[#8B949E]">
                  <History size={22} />
                </div>
                <h4 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">Trilha de Auditoria Individual</h4>
              </div>
              <span className="text-[9px] text-[#484F58] font-black uppercase tracking-[0.3em]">Registro em Tempo Real</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#0D1117] text-[#8B949E] font-black uppercase tracking-[0.2em] text-[10px]">
                  <tr>
                    <th className="px-10 py-5">Atividade Monitorada</th>
                    <th className="px-10 py-5">Carimbo de Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363D]">
                  {userLogs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-[#1F6FEB]/5 transition-colors">
                      <td className="px-10 py-6 font-bold text-white uppercase tracking-tight text-xs">{log.action}</td>
                      <td className="px-10 py-6 text-[#8B949E] flex items-center gap-3 tabular-nums font-bold text-xs">
                        <Clock size={16} className="text-[#30363D]" />
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                  {userLogs.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-10 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <History size={48} className="text-[#30363D]" />
                          <p className="font-black uppercase tracking-[0.3em] text-[10px]">Nenhum registro de auditoria disponível</p>
                        </div>
                      </td>
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
