
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
      
      const balance = (initial - discounts) - scheduled;
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

  const maxBalance = Math.max(...topBalances.map(b => b.balance), 1);
  const uniqueUnits = Array.from(new Set(collaborators.map(c => c.unit)));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard de Análise</h2>
        <p className="text-slate-500 font-medium">Indicadores de saldo e volumetria da Diretoria de Operações.</p>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Filtros de Análise</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 w-full">
            <select 
              className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-500/20 outline-none font-medium text-slate-600 appearance-none cursor-pointer"
              value={filters.collaboratorId}
              onChange={e => setFilters({...filters, collaboratorId: e.target.value})}
            >
              <option value="">Todos Colaboradores</option>
              {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-500/20 outline-none font-medium text-slate-600 appearance-none cursor-pointer"
              value={filters.state}
              onChange={e => setFilters({...filters, state: e.target.value})}
            >
              <option value="">Região (UF)</option>
              {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-500/20 outline-none font-medium text-slate-600 appearance-none cursor-pointer"
              value={filters.unit}
              onChange={e => setFilters({...filters, unit: e.target.value})}
            >
              <option value="">Unidade</option>
              {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-900/20 h-full flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-slate-800 p-3 rounded-2xl">
                <Wallet className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Saldo Total de Férias</h3>
            </div>
            <p className="text-6xl font-black tabular-nums">{totalBalance.toLocaleString('pt-BR')}</p>
            <p className="text-emerald-400 font-bold mt-2">dias úteis acumulados</p>
            <div className="mt-8 pt-8 border-t border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Impactados</span>
                <span className="text-xl font-bold">{filteredBalances.length} pessoas</span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Média</span>
                <span className="text-xl font-bold">{filteredBalances.length ? (totalBalance / filteredBalances.length).toFixed(1) : 0} dias</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-slate-400" size={20} />
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Colaboradores com Maior Saldo</h3>
              </div>
              <TrendingUp className="text-emerald-500" size={20} />
            </div>

            <div className="space-y-6">
              {topBalances.map((item, index) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold tabular-nums w-4">0{index + 1}</span>
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">{item.state}</span>
                    </div>
                    <span className="font-black text-slate-900">{item.balance} dias</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${item.balance > 45 ? 'bg-rose-500' : 'bg-slate-900'}`}
                      style={{ width: `${(item.balance / maxBalance) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {topBalances.length === 0 && (
                <div className="py-20 text-center text-slate-400 italic">
                  Nenhum dado disponível para os filtros aplicados.
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
