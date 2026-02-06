
import React, { useMemo, useState } from 'react';
import { Collaborator, VacationRecord, Holiday, RequestType, UserRole } from '../types';
import { formatDate } from '../utils/dateUtils';
import { Palmtree, Users, CalendarDays, Info, Search, Filter, Download, UserPlus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { BRAZILIAN_STATES } from '../constants';

interface DashboardProps {
  collaborators: Collaborator[];
  records: VacationRecord[];
  holidays: Holiday[];
}

const Dashboard: React.FC<DashboardProps> = ({ collaborators, records, holidays }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: '',
    unit: '',
    state: ''
  });

  const tableData = useMemo(() => {
    const data = records.map(record => {
      const collaborator = collaborators.find(c => c.id === record.collaboratorId);
      
      const collaboratorRecords = records.filter(r => r.collaboratorId === record.collaboratorId);
      const initial = collaboratorRecords
        .filter(r => r.type === RequestType.SALDO_INICIAL)
        .reduce((sum, r) => sum + r.businessDays, 0);
      const discounts = collaboratorRecords
        .filter(r => r.type === RequestType.DESCONTO)
        .reduce((sum, r) => sum + r.businessDays, 0);
      const scheduled = collaboratorRecords
        .filter(r => r.type === RequestType.AGENDADAS)
        .reduce((sum, r) => sum + r.businessDays, 0);
      
      // NOVA FÓRMULA: Saldo atual = Saldo inicial + Férias agendadas no RH – Descontos de férias
      const currentBalance = initial + scheduled - discounts;

      return {
        ...record,
        collaboratorName: collaborator?.name || 'Excluído',
        currentBalance,
        isNegative: currentBalance < 0
      };
    });

    return data.filter(row => {
      const matchSearch = row.collaboratorName.toLowerCase().includes(filters.search.toLowerCase());
      const matchUnit = !filters.unit || row.unit === filters.unit;
      const matchState = !filters.state || row.state === filters.state;
      return matchSearch && matchUnit && matchState;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [records, collaborators, filters]);

  const exportToCSV = () => {
    const headers = ["Colaborador", "Unidade", "Estado", "Tipo", "Inicio", "Fim", "Dias Corridos", "Dias Uteis", "Feriados", "Saldo Atual"];
    const rows = tableData.map(row => [
      `"${row.collaboratorName}"`,
      `"${row.unit}"`,
      row.state,
      `"${row.type}"`,
      row.startDate,
      row.endDate,
      row.calendarDays,
      row.businessDays,
      row.holidaysCount,
      row.currentBalance
    ].join(","));
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_operacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueUnits = Array.from(new Set(collaborators.map(c => c.unit)));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Visão Geral</h2>
          <p className="text-[#8B949E] font-bold text-sm uppercase tracking-wider">Monitoramento de Saldos e Lançamentos</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <>
              <button 
                onClick={() => navigate('/collaborators')}
                className="bg-[#161B22] text-[#8B949E] border border-[#30363D] px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#30363D] hover:text-white transition-all active:scale-95"
              >
                <UserPlus size={16} className="text-[#1F6FEB]" />
                Incluir Colaborador
              </button>
              <button 
                onClick={() => navigate('/vacations')}
                className="bg-[#1F6FEB] text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#388BFD] transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <Plus size={16} />
                Incluir Férias
              </button>
            </>
          )}
          <button 
            onClick={exportToCSV}
            className="bg-transparent text-[#1F6FEB] border border-[#1F6FEB] px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#1F6FEB]/10 transition-all active:scale-95"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </header>

      <div className="bg-[#161B22] p-8 rounded-[2rem] border border-[#30363D] shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8B949E]" size={20} />
            <input 
              type="text" 
              placeholder="PESQUISAR COLABORADOR..." 
              className="w-full pl-14 pr-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-[1.5rem] focus:ring-2 focus:ring-[#1F6FEB]/40 focus:border-[#1F6FEB] outline-none transition-all font-black text-[11px] uppercase tracking-widest text-white placeholder:text-[#484F58]"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              className="flex-1 md:w-56 px-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-[1.5rem] focus:ring-2 focus:ring-[#1F6FEB]/40 outline-none font-black text-[11px] uppercase tracking-widest text-[#8B949E] appearance-none cursor-pointer"
              value={filters.unit}
              onChange={e => setFilters({...filters, unit: e.target.value})}
            >
              <option value="">TODAS UNIDADES</option>
              {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select 
              className="flex-1 md:w-36 px-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-[1.5rem] focus:ring-2 focus:ring-[#1F6FEB]/40 outline-none font-black text-[11px] uppercase tracking-widest text-[#8B949E] appearance-none cursor-pointer"
              value={filters.state}
              onChange={e => setFilters({...filters, state: e.target.value})}
            >
              <option value="">ESTADO</option>
              {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[1.5rem] border border-[#30363D]">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#0D1117] text-[#8B949E] font-black uppercase tracking-[0.2em] text-[10px]">
              <tr>
                <th className="px-8 py-5">Colaborador</th>
                <th className="px-8 py-5">Unidade/UF</th>
                <th className="px-8 py-5">Tipo de Registro</th>
                <th className="px-8 py-5">Período</th>
                <th className="px-8 py-5 text-center">Dias Úteis</th>
                <th className="px-8 py-5 text-right">Saldo Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]">
              {tableData.map((row) => (
                <tr key={row.id} className="hover:bg-[#1F6FEB]/5 transition-colors group">
                  <td className="px-8 py-6 font-bold text-white uppercase tracking-tight">{row.collaboratorName}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[#8B949E] font-bold text-xs uppercase">{row.unit}</span>
                      <span className="bg-[#30363D] text-[#8B949E] px-2 py-0.5 rounded text-[10px] font-black uppercase border border-[#484F58]">{row.state}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`
                      inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest
                      ${row.type === RequestType.SALDO_INICIAL ? 'bg-blue-900/40 text-[#1F6FEB] border border-[#1F6FEB]/30' : 
                        row.type === RequestType.DESCONTO ? 'bg-rose-900/40 text-rose-500 border border-rose-500/30' : 
                        'bg-emerald-900/40 text-emerald-500 border border-emerald-500/30'}
                    `}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[#8B949E] font-bold text-xs tabular-nums">
                    {row.type === RequestType.SALDO_INICIAL && row.startDate === row.endDate ? '-' : (
                      <div className="flex items-center gap-2">
                        {formatDate(row.startDate)} <span className="text-[#30363D] tracking-tighter">—</span> {formatDate(row.endDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center font-black text-white tabular-nums">{row.businessDays}</td>
                  <td className="px-8 py-6 text-right">
                    <span className={`inline-block px-4 py-2 rounded-2xl font-black tabular-nums border ${row.isNegative ? 'bg-rose-950/30 text-rose-500 border-rose-500/30' : 'bg-emerald-950/30 text-emerald-500 border-emerald-500/30'}`}>
                      {row.isNegative ? '-' : ''}{Math.abs(row.currentBalance)} DIAS
                    </span>
                  </td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Search size={48} className="text-[#30363D]" />
                      <p className="text-[#484F58] font-black uppercase tracking-widest text-sm">Nenhum registro encontrado</p>
                    </div>
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

export default Dashboard;
