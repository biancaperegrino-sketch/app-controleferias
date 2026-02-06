
import React, { useMemo, useState } from 'react';
import { Collaborator, VacationRecord, RequestType } from '../types';
import { BarChart3, TrendingUp, Filter, Users, MapPin, Building2, Wallet } from 'lucide-react';
import { BRAZILIAN_STATES } from '../constants';

interface AnalyticsDashboardProps {
  collaborators: Collaborator[];
  records: VacationRecord[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ collaborators, records }) => {
  const [filters, setFilters] = useState({
    collaboratorId: '',
    state: '',
    unit: ''
  });

  const balances = useMemo(() => {
    return collaborators.map(c => {
      const collabRecords = records.filter(r => r.collaboratorId === c.id);
      const initial = collabRecords
        .filter(r => r.type === RequestType.SALDO_INICIAL)
        .reduce((sum, r) => sum + r.businessDays, 0);
      const discounts = collabRecords
        .filter(r => r.type === RequestType.DESCONTO)
        .reduce((sum, r) => sum + r.businessDays, 0);
      const scheduled = collabRecords
        .filter(r => r.type === RequestType.AGENDADAS)
        .reduce((sum, r) => sum + r.businessDays, 0);
      
      const balance = initial + scheduled - discounts;
      return {
        id: c.id,
        name: c.name,
        state: c.state,
        unit: c.unit,
        balance
      };
    });
  }, [collaborators, records]);

  const filteredBalances = useMemo(() => {
    return balances.filter(b => {
      const matchCollab = !filters.collaboratorId || b.id === filters.collaboratorId;
      const matchState = !filters.state || b.state === filters.state;
      const matchUnit = !filters.unit || b.unit === filters.unit;
      return matchCollab && matchState && matchUnit;
    });
  }, [balances, filters]);

  const totalBalance = useMemo(() => {
    return filteredBalances.reduce((sum, b) => sum + b.balance, 0);
  }, [filteredBalances]);

  const topBalances = useMemo(() => {
    return [...filteredBalances]
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);
  }, [filteredBalances]);

  const maxBalance = Math.max(...topBalances.map(b => Math.abs(b.balance)), 1);
  const uniqueUnits = Array.from(new Set(collaborators.map(c => c.unit)));

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Indicadores Analíticos</h2>
        <p className="text-[#8B949E] font-bold text-sm uppercase tracking-wider">Performance e Projeção de Férias</p>
      </header>

      <div className="bg-[#161B22] p-8 rounded-[2rem] border border-[#30363D] shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 text-[#1F6FEB]">
            <Filter size={20} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Filtros Estratégicos</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
            <select 
              className="px-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-[1.5rem] focus:ring-2 focus:ring-[#1F6FEB]/40 outline-none font-black text-[11px] uppercase tracking-widest text-[#8B949E] appearance-none cursor-pointer"
              value={filters.collaboratorId}
              onChange={e => setFilters({...filters, collaboratorId: e.target.value})}
            >
              <option value="">TODOS COLABORADORES</option>
              {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              className="px-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-[1.5rem] focus:ring-2 focus:ring-[#1F6FEB]/40 outline-none font-black text-[11px] uppercase tracking-widest text-[#8B949E] appearance-none cursor-pointer"
              value={filters.state}
              onChange={e => setFilters({...filters, state: e.target.value})}
            >
              <option value="">UF (ESTADO)</option>
              {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              className="px-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-[1.5rem] focus:ring-2 focus:ring-[#1F6FEB]/40 outline-none font-black text-[11px] uppercase tracking-widest text-[#8B949E] appearance-none cursor-pointer"
              value={filters.unit}
              onChange={e => setFilters({...filters, unit: e.target.value})}
            >
              <option value="">UNIDADE</option>
              {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-[#1F6FEB] p-10 rounded-[2.5rem] text-white shadow-[0_24px_48px_-12px_rgba(31,111,235,0.4)] h-full flex flex-col justify-center border border-white/10 relative overflow-hidden">
            {/* Pattern background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
               <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:24px_24px]"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                  <Wallet className="text-white" size={32} />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">Saldo Consolidado</h3>
              </div>
              <p className="text-7xl font-black tabular-nums tracking-tighter">{totalBalance.toLocaleString('pt-BR')}</p>
              <p className="text-white font-black uppercase text-[10px] mt-4 tracking-widest opacity-90">Dias úteis em aberto</p>
              <div className="mt-12 pt-8 border-t border-white/20 grid grid-cols-2 gap-8">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Base Ativa</span>
                  <span className="text-2xl font-black">{filteredBalances.length}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Média p/p</span>
                  <span className="text-2xl font-black">{filteredBalances.length ? (totalBalance / filteredBalances.length).toFixed(1) : 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#161B22] p-10 rounded-[2.5rem] border border-[#30363D] shadow-2xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="bg-[#30363D] p-3 rounded-2xl">
                  <BarChart3 className="text-[#1F6FEB]" size={24} />
                </div>
                <h3 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">Ranking de Saldos Acumulados</h3>
              </div>
              <TrendingUp className="text-emerald-500" size={24} />
            </div>

            <div className="space-y-8 flex-1">
              {topBalances.map((item, index) => (
                <div key={item.id} className="space-y-3 group">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <span className="text-[#30363D] font-black tabular-nums w-6 text-sm">{index + 1}</span>
                      <span className="font-black text-white uppercase tracking-tight text-sm group-hover:text-[#1F6FEB] transition-colors">{item.name}</span>
                      <span className="bg-[#0D1117] text-[#8B949E] px-2 py-0.5 rounded text-[9px] font-black uppercase border border-[#30363D]">{item.state}</span>
                    </div>
                    <span className="font-black text-white tabular-nums text-sm">{item.balance} DIAS</span>
                  </div>
                  <div className="h-2 w-full bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D]">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(31,111,235,0.3)] ${item.balance > 45 ? 'bg-rose-600' : 'bg-[#1F6FEB]'}`}
                      style={{ width: `${(Math.abs(item.balance) / maxBalance) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {topBalances.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 py-10 opacity-30 gap-4">
                  <BarChart3 size={64} className="text-[#8B949E]" />
                  <p className="font-black uppercase tracking-[0.3em] text-[10px]">Aguardando dados analíticos...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
