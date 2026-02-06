
import React, { useState, useEffect } from 'react';
import { VacationRecord, Collaborator, Holiday, RequestType, UserRole } from '../types';
import { calculateVacationMetrics, formatDate } from '../utils/dateUtils';
import { Plus, X, Edit2, Trash2, Paperclip, AlertCircle, Palmtree, ShieldAlert, Calculator, Hash, Calendar } from 'lucide-react';
import { useAuth } from '../App';

interface VacationsPageProps {
  records: VacationRecord[];
  setRecords: React.Dispatch<React.SetStateAction<VacationRecord[]>>;
  collaborators: Collaborator[];
  holidays: Holiday[];
}

const VacationsPage: React.FC<VacationsPageProps> = ({ records, setRecords, collaborators, holidays }) => {
  const { user, addLog } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VacationRecord | null>(null);

  const [formData, setFormData] = useState({
    collaboratorId: '',
    type: RequestType.AGENDADAS,
    startDate: '',
    endDate: '',
    attachmentName: '',
    unit: '',
    state: '',
    manualDays: '' 
  });

  const [metrics, setMetrics] = useState({
    calendarDays: 0,
    businessDays: 0,
    holidaysCount: 0
  });

  const isInitialBalance = formData.type === RequestType.SALDO_INICIAL;

  useEffect(() => {
    if (formData.collaboratorId) {
      const collab = collaborators.find(c => c.id === formData.collaboratorId);
      if (collab) {
        setFormData(prev => ({ ...prev, unit: collab.unit, state: collab.state }));
      }
    }
  }, [formData.collaboratorId, collaborators]);

  useEffect(() => {
    if (!isInitialBalance && formData.startDate && formData.endDate && formData.state && formData.unit) {
      // Regra definitiva de cálculo - Dias úteis considerando Unidade para feriados locais
      const result = calculateVacationMetrics(formData.startDate, formData.endDate, formData.state, formData.unit, holidays);
      setMetrics(result);
    } else if (isInitialBalance) {
      setMetrics({
        calendarDays: 0,
        businessDays: parseInt(formData.manualDays) || 0,
        holidaysCount: 0
      });
    }
  }, [formData.startDate, formData.endDate, formData.state, formData.unit, formData.manualDays, formData.type, holidays]);

  const handleOpenModal = (record?: VacationRecord) => {
    if (!isAdmin) return;
    if (record) {
      setEditingRecord(record);
      const isInitial = record.type === RequestType.SALDO_INICIAL;
      setFormData({
        collaboratorId: record.collaboratorId,
        type: record.type,
        startDate: record.startDate,
        endDate: record.endDate,
        attachmentName: record.attachmentName || '',
        unit: record.unit,
        state: record.state,
        manualDays: isInitial ? record.businessDays.toString() : ''
      });
      setMetrics({
        calendarDays: record.calendarDays,
        businessDays: record.businessDays,
        holidaysCount: record.holidaysCount
      });
    } else {
      setEditingRecord(null);
      const firstCollab = collaborators[0];
      setFormData({
        collaboratorId: firstCollab?.id || '',
        type: RequestType.AGENDADAS,
        startDate: '',
        endDate: '',
        attachmentName: '',
        unit: firstCollab?.unit || '',
        state: firstCollab?.state || '',
        manualDays: ''
      });
      setMetrics({ calendarDays: 0, businessDays: 0, holidaysCount: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalStartDate = isInitialBalance ? (formData.startDate || new Date().toISOString().split('T')[0]) : formData.startDate;
    const finalEndDate = isInitialBalance ? (formData.endDate || finalStartDate) : formData.endDate;

    const finalRecord: VacationRecord = {
      id: editingRecord?.id || Math.random().toString(36).substr(2, 9),
      ...formData,
      startDate: finalStartDate,
      endDate: finalEndDate,
      calendarDays: metrics.calendarDays,
      businessDays: metrics.businessDays,
      holidaysCount: metrics.holidaysCount
    };

    const collab = collaborators.find(c => c.id === formData.collaboratorId);

    if (editingRecord) {
      setRecords(prev => prev.map(r => r.id === editingRecord.id ? finalRecord : r));
      addLog(`Alterou registro (${formData.type}) para ${collab?.name}`);
    } else {
      setRecords(prev => [...prev, finalRecord]);
      addLog(`Lançou registro (${formData.type}) para ${collab?.name}`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (confirm('Deseja realmente excluir este registro?')) {
      const record = records.find(r => r.id === id);
      const collab = collaborators.find(c => c.id === record?.collaboratorId);
      setRecords(prev => prev.filter(r => r.id !== id));
      addLog(`Excluiu registro de férias de ${collab?.name}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, attachmentName: file.name }));
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Gestão Operacional de Férias</h2>
          <p className="text-[#8B949E] font-bold text-sm uppercase tracking-wider">Lançamentos e Movimentações de Saldo</p>
        </div>
        {isAdmin ? (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#1F6FEB] hover:bg-[#388BFD] text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Plus size={18} />
            Incluir Movimentação
          </button>
        ) : (
          <div className="bg-[#161B22] border border-[#30363D] px-4 py-3 rounded-2xl flex items-center gap-3 text-[#8B949E] text-[10px] font-black uppercase tracking-widest">
            <ShieldAlert size={16} className="text-[#1F6FEB]" />
            Somente Consulta
          </div>
        )}
      </div>

      <div className="bg-[#161B22] rounded-[2rem] border border-[#30363D] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#0D1117] text-[#8B949E] font-black uppercase tracking-[0.2em] text-[10px]">
              <tr>
                <th className="px-8 py-5">Colaborador</th>
                <th className="px-8 py-5">Categoria de Lançamento</th>
                <th className="px-8 py-5">Período Selecionado</th>
                <th className="px-8 py-5 text-center">Dias Úteis / Saldo</th>
                <th className="px-8 py-5 text-center">Doc</th>
                {isAdmin && <th className="px-8 py-5 text-right">Gestão</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]">
              {[...records].sort((a,b) => b.startDate.localeCompare(a.startDate)).map((record) => {
                const collab = collaborators.find(c => c.id === record.collaboratorId);
                return (
                  <tr key={record.id} className="hover:bg-[#1F6FEB]/5 transition-colors group">
                    <td className="px-8 py-6 font-bold text-white uppercase tracking-tight">{collab?.name || 'Excluído'}</td>
                    <td className="px-8 py-6">
                      <span className={`
                        inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border
                        ${record.type === RequestType.SALDO_INICIAL ? 'border-blue-500/30 bg-blue-900/40 text-[#1F6FEB]' : 
                          record.type === RequestType.DESCONTO ? 'border-rose-500/30 bg-rose-900/40 text-rose-500' : 
                          'border-emerald-500/30 bg-emerald-900/40 text-emerald-500'}
                      `}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-[#8B949E] font-bold text-xs tabular-nums uppercase">
                      {record.type === RequestType.SALDO_INICIAL && record.startDate === record.endDate ? '-' : (
                        <div className="flex items-center gap-2">
                          {formatDate(record.startDate)} <span className="text-[#30363D] tracking-tighter">—</span> {formatDate(record.endDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center font-black text-white text-base tabular-nums">{record.businessDays}</td>
                    <td className="px-8 py-6 text-center">
                      {record.attachmentName ? (
                        <div className="flex justify-center" title={record.attachmentName}>
                          <Paperclip size={18} className="text-[#1F6FEB]" />
                        </div>
                      ) : <span className="text-[#30363D]">-</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenModal(record)} className="p-3 text-[#8B949E] hover:text-[#1F6FEB] hover:bg-[#30363D] rounded-xl transition-all">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(record.id)} className="p-3 text-[#8B949E] hover:text-rose-500 hover:bg-rose-900/20 rounded-xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <Palmtree size={64} className="text-[#30363D]" />
                      <p className="font-black uppercase tracking-[0.3em] text-[10px]">Nenhuma movimentação registrada</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0D1117]/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#161B22] w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-[#30363D] overflow-hidden animate-in zoom-in duration-200">
            <div className="px-10 py-8 border-b border-[#30363D] flex items-center justify-between bg-[#0D1117]/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#1F6FEB] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                   <Palmtree size={24} />
                </div>
                <h3 className="font-black text-white text-lg uppercase tracking-tight">
                  {editingRecord ? 'Atualizar Movimentação' : 'Novo Lançamento Operacional'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 bg-[#30363D] hover:bg-[#484F58] rounded-full flex items-center justify-center text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E] mb-3">Colaborador Destino</label>
                    <select 
                      required
                      className="w-full px-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-2xl focus:ring-2 focus:ring-[#1F6FEB]/40 focus:border-[#1F6FEB] outline-none font-black text-xs uppercase text-white appearance-none cursor-pointer"
                      value={formData.collaboratorId}
                      onChange={e => setFormData({...formData, collaboratorId: e.target.value})}
                    >
                      <option value="">SELECIONE O FUNCIONÁRIO...</option>
                      {collaborators.map(c => <option key={c.id} value={c.id}>{c.name} — {c.unit}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E] mb-3">Tipo de Solicitação / Evento</label>
                    <select 
                      className="w-full px-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-2xl focus:ring-2 focus:ring-[#1F6FEB]/40 focus:border-[#1F6FEB] outline-none font-black text-xs uppercase text-white appearance-none cursor-pointer"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as RequestType, manualDays: '', startDate: '', endDate: ''})}
                    >
                      <option value={RequestType.SALDO_INICIAL}>SALDO INICIAL (CREDIT)</option>
                      <option value={RequestType.AGENDADAS}>FÉRIAS AGENDADAS NO RH (PLANNED)</option>
                      <option value={RequestType.DESCONTO}>DESCONTO DO SALDO (DEBIT)</option>
                    </select>
                  </div>

                  {!isInitialBalance ? (
                    <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E] mb-3">Data de Início</label>
                        <div className="relative">
                           <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#484F58]" size={16} />
                           <input 
                            required
                            type="date" 
                            className="w-full pl-12 pr-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-2xl focus:ring-2 focus:ring-[#1F6FEB]/40 focus:border-[#1F6FEB] outline-none font-bold text-white transition-all uppercase text-xs"
                            value={formData.startDate}
                            onChange={e => setFormData({...formData, startDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E] mb-3">Data de Término</label>
                        <div className="relative">
                           <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#484F58]" size={16} />
                           <input 
                            required
                            type="date" 
                            className="w-full pl-12 pr-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-2xl focus:ring-2 focus:ring-[#1F6FEB]/40 focus:border-[#1F6FEB] outline-none font-bold text-white transition-all uppercase text-xs"
                            value={formData.endDate}
                            onChange={e => setFormData({...formData, endDate: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in slide-in-from-top-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E] mb-3">Lançamento de Dias de Saldo</label>
                      <div className="relative">
                        <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-[#484F58]" size={18} />
                        <input 
                          required
                          type="number" 
                          min="0"
                          placeholder="EX: 30"
                          className="w-full pl-14 pr-6 py-4 bg-[#0D1117] border border-[#30363D] rounded-2xl focus:ring-2 focus:ring-[#1F6FEB]/40 focus:border-[#1F6FEB] outline-none font-black text-xl text-white transition-all tabular-nums"
                          value={formData.manualDays}
                          onChange={e => setFormData({...formData, manualDays: e.target.value})}
                        />
                      </div>
                      <p className="text-[10px] text-[#484F58] mt-3 font-bold uppercase italic tracking-widest">
                        O saldo manual é creditado diretamente ao colaborador.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E] mb-3">Documento de Comprovação (OPCIONAL)</label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer bg-[#0D1117] border border-[#30363D] border-dashed rounded-2xl p-4 text-center hover:border-[#1F6FEB] hover:bg-[#1F6FEB]/5 transition-all group">
                        <div className="flex items-center justify-center gap-3">
                           <Paperclip size={16} className="text-[#484F58] group-hover:text-[#1F6FEB]" />
                           <span className="text-[11px] font-bold text-[#484F58] group-hover:text-[#8B949E] uppercase tracking-widest truncate">
                            {formData.attachmentName || 'CLIQUE PARA ANEXAR ARQUIVO'}
                          </span>
                        </div>
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.png,.doc,.docx,.eml" />
                      </label>
                      {formData.attachmentName && (
                        <button type="button" onClick={() => setFormData({...formData, attachmentName: ''})} className="h-12 w-12 flex items-center justify-center text-rose-500 bg-rose-950/20 border border-rose-500/30 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`rounded-[2.5rem] p-10 flex flex-col justify-between border transition-all duration-500 ${isInitialBalance ? 'bg-[#0D1117] border-[#30363D]' : 'bg-[#1F6FEB]/10 border-[#1F6FEB]/30'}`}>
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${isInitialBalance ? 'bg-[#161B22] text-[#8B949E]' : 'bg-[#1F6FEB] text-white'}`}>
                        <Calculator size={22} />
                      </div>
                      <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isInitialBalance ? 'text-[#8B949E]' : 'text-white'}`}>
                        {isInitialBalance ? 'Projeção Manual' : 'Painel de Cálculo'}
                      </h4>
                    </div>

                    {!isInitialBalance ? (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center text-sm border-b border-[#30363D] pb-3">
                          <span className="text-[#8B949E] font-bold uppercase tracking-widest text-[10px]">Período Corrido</span>
                          <span className="font-black text-white tabular-nums">{metrics.calendarDays} DIAS</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-[#30363D] pb-3">
                          <span className="text-[#8B949E] font-bold uppercase tracking-widest text-[10px]">Feriados Locais/Nacionais</span>
                          <span className="font-black text-[#1F6FEB] tabular-nums">{metrics.holidaysCount} DIAS</span>
                        </div>
                        <div className="pt-6 flex flex-col items-center justify-center py-6">
                          <span className="text-[10px] font-black uppercase text-[#8B949E] tracking-[0.3em] mb-3">Total Líquido Úteis</span>
                          <span className="text-7xl font-black text-white tabular-nums tracking-tighter shadow-blue-500/20">{metrics.businessDays}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8 animate-in fade-in duration-300 flex flex-col items-center justify-center h-full py-10">
                        <div className="text-center">
                          <span className="block text-[10px] text-[#8B949E] uppercase font-black tracking-[0.3em] mb-4">Crédito de Saldo</span>
                          <span className="text-8xl font-black text-white tabular-nums tracking-tighter">{metrics.businessDays}</span>
                        </div>
                        <div className="p-6 bg-[#161B22] rounded-3xl border border-[#30363D] text-[10px] text-[#484F58] font-black uppercase tracking-widest leading-relaxed text-center">
                          O VALOR INFORMADO SERÁ INTEGRADO AO BANCO DE FÉRIAS DO COLABORADOR.
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!isInitialBalance && (
                    <div className="mt-10 flex items-start gap-4 bg-[#0D1117] p-6 rounded-3xl border border-[#30363D]">
                      <AlertCircle size={20} className="text-[#1F6FEB] shrink-0" />
                      <p className="text-[10px] text-[#8B949E] font-bold uppercase tracking-widest leading-relaxed">
                        CÁLCULO EXCLUI FINAIS DE SEMANA E CALENDÁRIO DE <strong>{formData.state}</strong> / <strong>{formData.unit}</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-12 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-[#0D1117] text-[#8B949E] border border-[#30363D] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#30363D] hover:text-white transition-all"
                >
                  Descartar
                </button>
                <button 
                  type="submit" 
                  disabled={!formData.collaboratorId || (!isInitialBalance && metrics.calendarDays === 0) || (isInitialBalance && !formData.manualDays)}
                  className="flex-2 px-10 py-4 bg-[#1F6FEB] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#388BFD] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VacationsPage;
