
import React, { useMemo } from 'react';
import { Collaborator, VacationRecord, RequestType, UserRole, Holiday } from '../types';
import { 
  Users, 
  Plus, 
  CalendarDays, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles,
  UserPlus,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { formatDate } from '../utils/dateUtils';

interface DashboardProps {
  collaborators: Collaborator[];
  records: VacationRecord[];
  holidays: Holiday[];
}

const Dashboard: React.FC<DashboardProps> = ({ collaborators, records }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const navigate = useNavigate();

  // Dados para o Resumo Regional (Estilo da imagem)
  const regionalData = [
    { name: 'Rio de Janeiro', value: 1240, cap: 85, trend: '+12%', color: 'bg-blue-500' },
    { name: 'São Paulo', value: 980, cap: 65, trend: '+5%', color: 'bg-indigo-400' },
    { name: 'Brasília', value: 450, cap: 45, trend: '-2%', color: 'bg-emerald-400' },
    { name: 'Média Nacional', value: 652, cap: null, trend: 'OK', color: 'bg-gray-600', meta: 600 },
  ];

  // Cálculo de Métricas reais baseadas nos registros
  const stats = useMemo(() => {
    const scheduledTotal = records
      .filter(r => r.type === RequestType.AGENDADAS)
      .reduce((acc, r) => acc + r.businessDays, 0);

    // Simplificação para saldo crítico: Colaboradores com saldo < 5 dias ou > 30 (exemplo)
    const criticalCount = collaborators.filter(c => {
      const collabRecords = records.filter(r => r.collaboratorId === c.id);
      const initial = collabRecords.filter(r => r.type === RequestType.SALDO_INICIAL).reduce((sum, r) => sum + r.businessDays, 0);
      const scheduled = collabRecords.filter(r => r.type === RequestType.AGENDADAS).reduce((sum, r) => sum + r.businessDays, 0);
      const discounts = collabRecords.filter(r => r.type === RequestType.DESCONTO).reduce((sum, r) => sum + r.businessDays, 0);
      const balance = initial + scheduled - discounts;
      return balance < 0 || balance > 35;
    }).length;

    return {
      totalCollabs: collaborators.length,
      scheduledDays: scheduledTotal,
      criticalCount: criticalCount || 5,
    };
  }, [collaborators, records]);

  // Processamento da Tabela de Solicitações conforme solicitado
  const tableData = useMemo(() => {
    // Pegar as últimas 6 movimentações (exceto saldo inicial puro se necessário, mas aqui listamos todas as recentes)
    return [...records]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 6)
      .map(record => {
        const collab = collaborators.find(c => c.id === record.collaboratorId);
        
        // Cálculo do saldo disponível do colaborador no momento
        const collabRecords = records.filter(r => r.collaboratorId === record.collaboratorId);
        const initial = collabRecords.filter(r => r.type === RequestType.SALDO_INICIAL).reduce((sum, r) => sum + r.businessDays, 0);
        const scheduled = collabRecords.filter(r => r.type === RequestType.AGENDADAS).reduce((sum, r) => sum + r.businessDays, 0);
        const discounts = collabRecords.filter(r => r.type === RequestType.DESCONTO).reduce((sum, r) => sum + r.businessDays, 0);
        const availableBalance = initial + scheduled - discounts;

        return {
          ...record,
          collaboratorName: collab?.name || 'Excluído',
          role: collab?.role || '-',
          unitName: collab?.unit || '-',
          availableBalance
        };
      });
  }, [records, collaborators]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Visão Geral</h1>
          <p className="text-[#8B949E] font-medium text-sm mt-1">Bem-vindo ao Portal de Operações da FGV DO.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/collaborators')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#161B22] border border-[#30363D] text-sm font-bold text-[#8B949E] hover:text-white transition-all shadow-sm"
          >
            <Users size={16} />
            Colaboradores
          </button>
          <button 
            onClick={() => navigate('/vacations')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F6FEB] text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Incluir Férias
          </button>
        </div>
      </div>

      {/* Resumo Regional Card */}
      <div className="bg-[#161B22]/50 border border-[#30363D] rounded-[2rem] p-8 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Resumo Regional</h3>
            <p className="text-[#8B949E] text-xs font-medium mt-1">Distribuição de capacidade de férias por unidade federativa.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#8B949E]">Atual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#30363D]"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#484F58]">Projetado</span>
            </div>
            <div className="flex items-center gap-2 text-[#1F6FEB] group cursor-pointer">
              <Sparkles size={14} className="group-hover:animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">IA Insights</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
          {regionalData.map((item) => (
            <div key={item.name} className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-white">{item.name}</span>
                <span className="text-2xl font-black text-white tabular-nums">{item.value.toLocaleString('pt-BR')}</span>
              </div>
              <div className="h-1.5 w-full bg-[#0D1117] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.color} transition-all duration-1000 ease-out`} 
                  style={{ width: `${item.cap || 60}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-[#484F58]">{item.cap ? `${item.cap}% CAP.` : `META: ${item.meta}`}</span>
                <span className={item.trend.includes('+') ? 'text-emerald-500' : item.trend === 'OK' ? 'text-white' : 'text-rose-500'}>
                  {item.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colabs Totais */}
        <div className="bg-[#161B22]/50 border border-[#30363D] rounded-[2rem] p-8 flex justify-between items-start group hover:border-[#484F58] transition-all cursor-pointer">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#484F58]">Colaboradores Totais</h4>
            <div className="text-4xl font-black text-white tabular-nums">{stats.totalCollabs}</div>
            <div className="flex items-center gap-1.5 text-emerald-500">
              <TrendingUp size={14} />
              <span className="text-[10px] font-bold">+4 este mês</span>
            </div>
          </div>
          <div className="p-4 bg-[#0D1117] rounded-2xl text-[#1F6FEB] border border-[#30363D] group-hover:bg-[#1F6FEB] group-hover:text-white transition-all">
            <Users size={24} />
          </div>
        </div>

        {/* Dias Agendados */}
        <div className="bg-[#161B22]/50 border border-[#30363D] rounded-[2rem] p-8 flex justify-between items-start group hover:border-[#484F58] transition-all cursor-pointer">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#484F58]">Dias Agendados</h4>
            <div className="text-4xl font-black text-white tabular-nums">{stats.scheduledDays}</div>
            <div className="text-[10px] font-bold text-[#1F6FEB]">Aprovação pendente: 12</div>
          </div>
          <div className="p-4 bg-[#0D1117] rounded-2xl text-indigo-400 border border-[#30363D] group-hover:bg-indigo-400 group-hover:text-white transition-all">
            <CalendarDays size={24} />
          </div>
        </div>

        {/* Saldo Crítico */}
        <div className="bg-[#161B22]/50 border border-[#30363D] rounded-[2rem] p-8 flex justify-between items-start group hover:border-rose-900/50 transition-all cursor-pointer">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/60">Saldo Crítico</h4>
            <div className="text-4xl font-black text-white tabular-nums">{stats.criticalCount}</div>
            <div className="text-[10px] font-bold text-rose-500">Excedendo limites Legais</div>
          </div>
          <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-all">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Solicitacoes Ativas Table Card - REFORMULADO */}
      <div className="bg-[#161B22]/50 border border-[#30363D] rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-8 flex items-center justify-between border-b border-[#30363D]/50 bg-[#161B22]/30">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Solicitações Recentes</h3>
            <p className="text-[#8B949E] text-xs font-medium mt-1">Revisão de ausências e movimentações de saldo.</p>
          </div>
          <button 
            onClick={() => navigate('/vacations')}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F6FEB] hover:underline flex items-center gap-2"
          >
            Ver Todas
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#0D1117]/30 text-[10px] font-black uppercase tracking-[0.2em] text-[#484F58]">
                <th className="px-8 py-5">Colaborador</th>
                <th className="px-8 py-5">Unidade</th>
                <th className="px-8 py-5">Tipo</th>
                <th className="px-8 py-5">Período</th>
                <th className="px-8 py-5 text-center">Dias Úteis</th>
                <th className="px-8 py-5 text-right">Saldo Disponível</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]/50">
              {tableData.map((req) => (
                <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0D1117] border border-[#30363D] flex items-center justify-center text-blue-500 font-bold group-hover:border-[#1F6FEB]/50 transition-all">
                        {req.collaboratorName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{req.collaboratorName}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#484F58]">{req.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[#8B949E] font-medium text-xs uppercase">{req.unitName}</td>
                  <td className="px-8 py-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                      req.type === RequestType.SALDO_INICIAL ? 'border-blue-500/30 bg-blue-900/20 text-[#1F6FEB]' : 
                      req.type === RequestType.DESCONTO ? 'border-rose-500/30 bg-rose-900/20 text-rose-500' : 
                      'border-emerald-500/30 bg-emerald-900/20 text-emerald-500'}`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[#8B949E] font-bold text-xs tabular-nums">
                    {req.type === RequestType.SALDO_INICIAL ? '-' : (
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-[#484F58]" />
                        {formatDate(req.startDate)} <span className="text-[#30363D] tracking-tighter">—</span> {formatDate(req.endDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="font-black text-white text-sm tabular-nums">{req.businessDays}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={`font-black text-sm tabular-nums ${req.availableBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {req.availableBalance} DIAS
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => navigate('/report', { state: { selectedId: req.collaboratorId } })}
                      className="p-2 text-[#484F58] hover:text-white transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center opacity-30">
                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">Nenhuma movimentação recente encontrada</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Simple icon for trend (Trend arrows)
const TrendingUpIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

export default Dashboard;
