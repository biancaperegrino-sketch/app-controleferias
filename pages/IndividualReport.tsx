
import React, { useState, useMemo } from 'react';
import { Collaborator, VacationRecord, RequestType } from '../types';
import { Palmtree, ArrowDownCircle, Wallet, FileText, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface IndividualReportProps {
  collaborators: Collaborator[];
  records: VacationRecord[];
}

const IndividualReport: React.FC<IndividualReportProps> = ({ collaborators, records }) => {
  const [selectedId, setSelectedId] = useState<string>(collaborators[0]?.id || '');

  const summary = useMemo(() => {
    if (!selectedId) return null;

    const collab = collaborators.find(c => c.id === selectedId);
    const collabRecords = records.filter(r => r.collaboratorId === selectedId);

    const initial = collabRecords
      .filter(r => r.type === RequestType.SALDO_INICIAL)
      .reduce((sum, r) => sum + r.businessDays, 0);

    const discounts = collabRecords
      .filter(r => r.type === RequestType.DESCONTO)
      .reduce((sum, r) => sum + r.businessDays, 0);

    const scheduled = collabRecords
      .filter(r => r.type === RequestType.AGENDADAS)
      .reduce((sum, r) => sum + r.businessDays, 0);

    // Rule: Saldo atual = (Saldo inicial - Descontos) - Férias agendadas
    const availableBeforeSchedule = initial - discounts;
    const balanceResult = availableBeforeSchedule - scheduled;

    return {
      collaborator: collab,
      initial,
      discounts,
      scheduled,
      availableBeforeSchedule,
      balance: balanceResult,
      isNegative: balanceResult < 0,
      history: collabRecords.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    };
  }, [selectedId, collaborators, records]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Resumo Individual</h2>
        <p className="text-slate-500">Visualize o detalhamento de saldo e histórico por colaborador.</p>
      </header>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o Colaborador</label>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Selecione um funcionário...</option>
            {collaborators.map(c => <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>)}
          </select>
        </div>
      </div>

      {summary && summary.collaborator ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 mb-3">
                <Wallet size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Saldo Inicial</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{summary.initial} <span className="text-sm font-normal text-slate-500">dias</span></p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 text-red-500 mb-3">
                <ArrowDownCircle size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Descontos</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{summary.discounts} <span className="text-sm font-normal text-slate-500">dias</span></p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 text-amber-500 mb-3">
                <Palmtree size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Agendadas</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{summary.scheduled} <span className="text-sm font-normal text-slate-500">dias</span></p>
            </div>
            <div className={`p-6 rounded-xl border shadow-sm ${summary.isNegative ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className={`flex items-center gap-3 mb-3 ${summary.isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                {summary.isNegative ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                <span className="text-xs font-bold uppercase tracking-wider">Saldo Atual</span>
              </div>
              <p className={`text-2xl font-bold ${summary.isNegative ? 'text-red-700' : 'text-emerald-700'}`}>
                {summary.balance} <span className="text-sm font-normal">dias</span>
              </p>
              <p className="text-[10px] mt-1 text-slate-500">
                {summary.isNegative ? 'Excesso de agendamento' : 'Saldo disponível'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Histórico Detalhado: {summary.collaborator.name}</h3>
              <div className="text-xs text-slate-500 italic">
                Cálculo: (Inicial ({summary.initial}) - Descontos ({summary.discounts})) - Agendadas ({summary.scheduled}) = {summary.balance}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Período</th>
                    <th className="px-6 py-4 text-center">Dias Corridos</th>
                    <th className="px-6 py-4 text-center">Feriados</th>
                    <th className="px-6 py-4 text-right">Impacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.history.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold ${record.type === RequestType.SALDO_INICIAL ? 'text-blue-600' : record.type === RequestType.DESCONTO ? 'text-red-600' : 'text-emerald-600'}`}>
                          {record.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(record.startDate)} - {formatDate(record.endDate)}</td>
                      <td className="px-6 py-4 text-center">{record.calendarDays}</td>
                      <td className="px-6 py-4 text-center text-slate-400">{record.holidaysCount}</td>
                      <td className={`px-6 py-4 text-right font-bold text-slate-900`}>
                        {record.businessDays}
                      </td>
                    </tr>
                  ))}
                  {summary.history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Nenhuma movimentação para este colaborador.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-100">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right font-medium text-slate-500">Saldo Disponível Antes do Agendamento:</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">{summary.availableBeforeSchedule} dias</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right font-medium text-slate-500">Saldo Final (Disponível - Agendadas):</td>
                    <td className={`px-6 py-4 text-right font-black text-lg ${summary.isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                      {summary.balance} dias
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 py-16 text-center rounded-xl border-2 border-dashed border-slate-200">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500">Selecione um colaborador para visualizar seu relatório detalhado.</p>
        </div>
      )}
    </div>
  );
};

export default IndividualReport;
