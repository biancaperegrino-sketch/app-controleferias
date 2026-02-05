
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Meu Perfil Corporativo</h2>
          <p className="text-slate-500 font-medium">Identidade gerenciada via Microsoft Entra ID.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck size={16} />
          Sessão Segura Ativa
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-center p-10 relative">
            <div className="absolute top-0 left-0 w-full h-24 bg-slate-900 -z-0"></div>
            <div className="relative z-10">
              <div className="h-32 w-32 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-5xl font-black mx-auto mb-6 shadow-2xl shadow-blue-500/40 border-8 border-white transform hover:rotate-3 transition-transform">
                {user.name.charAt(0)}
              </div>
              <h3 className="text-xl font-black text-slate-900">{user.name}</h3>
              <p className="text-sm font-bold text-blue-600 mt-1 uppercase tracking-widest">{user.role}</p>
              
              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase">Microsoft ID</span>
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{user.id}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase">Status</span>
                  <span className="text-emerald-600 font-black uppercase tracking-widest">Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Key size={20} className="text-blue-600" />
              <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Detalhes da Identidade</h4>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Mail size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">E-mail Corporativo</span>
                </div>
                <p className="text-base font-bold text-slate-700">{user.email}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Building size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Unidade / Departamento</span>
                </div>
                <p className="text-base font-bold text-slate-700">{user.unit}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Shield size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Permissões de Acesso</span>
                </div>
                <p className="text-base font-bold text-slate-700">{user.role}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <History size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Provedor</span>
                </div>
                <p className="text-base font-bold text-slate-700">Microsoft 365 Entra ID</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <History size={20} className="text-slate-400" />
                <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Registro de Atividades</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Auditoria de Segurança</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-8 py-4">Ação Realizada</th>
                    <th className="px-8 py-4">Carimbo de Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-700">{log.action}</td>
                      <td className="px-8 py-5 text-slate-400 flex items-center gap-2 tabular-nums">
                        <Clock size={14} />
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                  {userLogs.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-8 py-16 text-center">
                        <History size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-medium italic">Nenhuma ação registrada nesta sessão.</p>
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
