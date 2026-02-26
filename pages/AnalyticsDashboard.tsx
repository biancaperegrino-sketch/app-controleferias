
import React, { useMemo, useState } from 'react';
import { Collaborator, VacationRecord, RequestType } from '../types';
import { BarChart3, TrendingUp, Filter, Wallet, PieChart } from 'lucide-react';
import { BRAZILIAN_STATES } from '../constants';

interface AnalyticsDashboardProps {
  collaborators: Collaborator[];
  records: VacationRecord[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ collaborators, records }) => {
  const [filters, setFilters] = useState({
    state: '',
    unit: ''
  });

  const balances = useMemo(() => {
    return collaborators.map(c => {
      const collabRecords = records.filter(r => r.collaboratorId === c.id);
      const initial = collabRecords
        .filter(r => r.type === RequestType.SALDO_INICIAL)
        .reduce((sum, r) => sum + r.businessDays, 0);
      const scheduled = collabRecords
        .filter(r => r.type === RequestType.AGENDADAS)
        .reduce((sum, r) => sum + r.businessDays, 0);
      const discounts = collabRecords
        .filter(r => r.type === RequestType.DESCONTO)
        .reduce((sum, r) => sum + r.businessDays, 0);
      
      // Saldo Disponível = Saldo inicial + Férias agendadas no RH – Desconto do saldo de férias
      const balance = initial + scheduled - discounts;
      return { id: c.id, name: c.name, state: c.state, unit: c.unit, balance };
    });
  }, [collaborators, records]);

  const filteredBalances = useMemo(() => {
    return balances.filter(b => {
      const matchState = !filters.state || b.state === filters.state;
      const matchUnit = !filters.unit || b.unit === filters.unit;
      return matchState && matchUnit;
    });
  }, [balances, filters]);

  const totalAvailableBalance = useMemo(() => {
    return filteredBalances.reduce((sum, b) => sum + b.balance, 0);
  }, [filteredBalances]);

  const topSaldos = useMemo(() => {
    return [...filteredBalances].sort((a, b) => b.balance - a.balance).slice(0, 10);
  }, [filteredBalances]);

  const maxVal = Math.max(...topSaldos.map(b => Math.abs(b.balance)), 1);
  const uniqueUnits = Array.from(new Set(collaborators.map(c => c.unit)));

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Dashboard Estratégico</h2>
        <p className="text-[#8B949E] font-bold text-sm uppercase tracking-wider">Métricas Globais de Saldo Disponível</p>
      </header>

      <div className="bg-[#161B22] p-8 rounded-[2rem] border border-[#30363D] shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 text-[#1F6FEB]">
            <Filter size={20} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Visão por Unidade / UF</span>
          </div>
          <div className="flex gap-4 flex-1">
            <select className="flex-1 px-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-2xl font-black text-[11px] uppercase text-[#8B949E] outline-none" value={filters.unit} onChange={e => setFilters({...filters, unit: e.target.value})}>
              <option value="">TODAS UNIDADES</option>
              {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select className="w-40 px-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-2xl font-black text-[11px] uppercase text-[#8B949E] outline-none" value={filters.state} onChange={e => setFilters({...filters, state: e.target.value})}>
              <option value="">UF</option>
              {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-[#1F6FEB] p-10 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-center border border-white/10 relative overflow-hidden h-full">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                  <Wallet className="text-white" size={32} />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">Saldo Disponível Consolidado</h3>
              </div>
              <p className={`text-7xl font-black tabular-nums tracking-tighter ${totalAvailableBalance < 0 ? 'text-rose-200' : 'text-white'}`}>
                {totalAvailableBalance < 0 ? '-' : ''}{Math.abs(totalAvailableBalance).toLocaleString('pt-BR')}
              </p>
              <p className="text-white font-black uppercase text-[10px] mt-4 tracking-widest opacity-80">Dias úteis totais em aberto</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#161B22] p-10 rounded-[2.5rem] border border-[#30363D] shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="bg-[#30363D] p-3 rounded-2xl">
                  <BarChart3 className="text-[#1F6FEB]" size={24} />
                </div>
                <h3 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">Top 10 Colaboradores por Saldo Disponível</h3>
              </div>
              <TrendingUp className="text-emerald-500" size={24} />
            </div>

            <div className="space-y-6 flex-1">
              {topSaldos.map((item) => (
                <div key={item.id} className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <span className="font-black text-white uppercase tracking-tight text-xs">{item.name}</span>
                    <span className={`font-black tabular-nums text-xs ${item.balance < 0 ? 'text-rose-500' : item.balance > 0 ? 'text-emerald-500' : 'text-[#8B949E]'}`}>
                      {item.balance < 0 ? '-' : ''}{Math.abs(item.balance)} DIAS
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0D1117] rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${item.balance < 0 ? 'bg-rose-500' : 'bg-[#1F6FEB]'}`}
                      style={{ width: `${(Math.abs(item.balance) / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
