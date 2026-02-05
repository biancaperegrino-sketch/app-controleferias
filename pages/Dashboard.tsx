
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
      
      const availableBeforeSchedule = initial - discounts;
      const currentBalance = availableBeforeSchedule - scheduled;

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Visão Geral de Férias</h2>
          <p className="text-slate-500 font-medium">Controle e monitoramento de saldos da Diretoria de Operações.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <>
              <button 
                onClick={() => navigate('/collaborators')}
                className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <UserPlus size={18} className="text-slate-900" />
                Incluir Colaborador
              </button>
              <button 
                onClick={() => navigate('/vacations')}
                className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                <Plus size={18} />
                Incluir Férias
              </button>
            </>
          )}
          <button 
            onClick={exportToCSV}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar colaborador..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none transition-all font-medium text-slate-700"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              className="flex-1 md:w-48 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-500/20 outline-none font-medium text-slate-600 appearance-none cursor-pointer"
              value={filters.unit}
              onChange={e => setFilters({...filters, unit: e.target.value})}
            >
              <option value="">Todas Unidades</option>
              {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select 
              className="flex-1 md:w-32 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-500/20 outline-none font-medium text-slate-600 appearance-none cursor-pointer"
              value={filters.state}
              onChange={e => setFilters({...filters, state: e.target.value})}
            >
              <option value="">UF</option>
              {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Unidade/Estado</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Período</th>
                <th className="px-6 py-4 text-center">Dias Úteis</th>
                <th className="px-6 py-4 text-center">Feriados</th>
                <th className="px-6 py-4 text-right">Saldo Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-slate-900">{row.collaboratorName}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">{row.unit}</span>
                      <span className="bg-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">{row.state}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`
                      inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                      ${row.type === RequestType.SALDO_INICIAL ? 'bg-blue-100 text-blue-700' : 
                        row.type === RequestType.DESCONTO ? 'bg-rose-100 text-rose-700' : 
                        'bg-emerald-100 text-emerald-700'}
                    `}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">
                    {formatDate(row.startDate)} <span className="text-slate-300">→</span> {formatDate(row.endDate)}
                  </td>
                  <td className="px-6 py-5 text-center font-black text-slate-700">{row.businessDays}</td>
                  <td className="px-6 py-5 text-center text-slate-400 font-bold">{row.holidaysCount}</td>
                  <td className="px-6 py-5 text-right">
                    <span className={`inline-block px-3 py-1 rounded-full font-black tabular-nums ${row.isNegative ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {row.isNegative ? '-' : ''}{Math.abs(row.currentBalance)} dias
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
