
import React, { useState, useEffect } from 'react';
import { VacationRecord, Collaborator, Holiday, RequestType, UserRole } from '../types';
import { calculateVacationMetrics, formatDate } from '../utils/dateUtils';
import { Plus, X, Edit2, Trash2, Paperclip, AlertCircle, Palmtree, ShieldAlert } from 'lucide-react';
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
    state: ''
  });

  const [metrics, setMetrics] = useState({
    calendarDays: 0,
    businessDays: 0,
    holidaysCount: 0
  });

  useEffect(() => {
    if (formData.collaboratorId) {
      const collab = collaborators.find(c => c.id === formData.collaboratorId);
      if (collab) {
        setFormData(prev => ({ ...prev, unit: collab.unit, state: collab.state }));
      }
    }
  }, [formData.collaboratorId, collaborators]);

  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.state) {
      const result = calculateVacationMetrics(formData.startDate, formData.endDate, formData.state, holidays);
      setMetrics(result);
    }
  }, [formData.startDate, formData.endDate, formData.state, holidays]);

  const handleOpenModal = (record?: VacationRecord) => {
    if (!isAdmin) return;
    if (record) {
      setEditingRecord(record);
      setFormData({
        collaboratorId: record.collaboratorId,
        type: record.type,
        startDate: record.startDate,
        endDate: record.endDate,
        attachmentName: record.attachmentName || '',
        unit: record.unit,
        state: record.state
      });
      setMetrics({
        calendarDays: record.calendarDays,
        businessDays: record.businessDays,
        holidaysCount: record.holidaysCount
      });
    } else {
      setEditingRecord(null);
      setFormData({
        collaboratorId: collaborators[0]?.id || '',
        type: RequestType.AGENDADAS,
        startDate: '',
        endDate: '',
        attachmentName: '',
        unit: '',
        state: ''
      });
      setMetrics({ calendarDays: 0, businessDays: 0, holidaysCount: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRecord: VacationRecord = {
      id: editingRecord?.id || Math.random().toString(36).substr(2, 9),
      ...formData,
      ...metrics
    };

    const collab = collaborators.find(c => c.id === formData.collaboratorId);

    if (editingRecord) {
      setRecords(prev => prev.map(r => r.id === editingRecord.id ? finalRecord : r));
      addLog(`Alterou registro de férias (${formData.type}) para ${collab?.name}`);
    } else {
      setRecords(prev => [...prev, finalRecord]);
      addLog(`Lançou registro de férias (${formData.type}) para ${collab?.name}`);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Férias</h2>
          <p className="text-slate-500">Registre e controle as movimentações de saldo.</p>
        </div>
        {isAdmin ? (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Incluir Férias
          </button>
        ) : (
          <div className="bg-slate-100 px-3 py-2 rounded-lg flex items-center gap-2 text-slate-500 text-xs font-medium">
            <ShieldAlert size={14} />
            Perfil de Leitura - Visualização apenas
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Início</th>
                <th className="px-6 py-4">Fim</th>
                <th className="px-6 py-4 text-center">Dias Corridos</th>
                <th className="px-6 py-4 text-center">Dias Úteis</th>
                <th className="px-6 py-4 text-center">Anexo</th>
                {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => {
                const collab = collaborators.find(c => c.id === record.collaboratorId);
                return (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{collab?.name || 'Excluído'}</td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                        ${record.type === RequestType.SALDO_INICIAL ? 'border-blue-200 bg-blue-50 text-blue-700' : 
                          record.type === RequestType.DESCONTO ? 'border-red-200 bg-red-50 text-red-700' : 
                          'border-emerald-200 bg-emerald-50 text-emerald-700'}
                      `}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(record.startDate)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(record.endDate)}</td>
                    <td className="px-6 py-4 text-center">{record.calendarDays}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{record.businessDays}</td>
                    <td className="px-6 py-4 text-center">
                      {record.attachmentName ? (
                        <div className="flex justify-center" title={record.attachmentName}>
                          <Paperclip size={14} className="text-blue-500" />
                        </div>
                      ) : '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(record)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Palmtree className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-800 text-lg">
                  {editingRecord ? 'Editar Registro' : 'Inclusão de Férias'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Colaborador</label>
                    <select 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.collaboratorId}
                      onChange={e => setFormData({...formData, collaboratorId: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Solicitação</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as RequestType})}
                    >
                      <option value={RequestType.SALDO_INICIAL}>Saldo Inicial</option>
                      <option value={RequestType.DESCONTO}>Desconto do saldo de férias</option>
                      <option value={RequestType.AGENDADAS}>Férias agendadas no RH</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Início</label>
                      <input 
                        required
                        type="date" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={formData.startDate}
                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fim</label>
                      <input 
                        required
                        type="date" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={formData.endDate}
                        onChange={e => setFormData({...formData, endDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Comprovação (Anexo)</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-2 text-center hover:bg-slate-100 transition-colors">
                        <span className="text-sm text-slate-500">
                          {formData.attachmentName || 'Selecionar arquivo...'}
                        </span>
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.png,.doc,.docx,.eml" />
                      </label>
                      {formData.attachmentName && (
                        <button type="button" onClick={() => setFormData({...formData, attachmentName: ''})} className="p-2 text-red-500">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 flex flex-col justify-between border border-blue-100">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Cálculos Automáticos</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">Dias Corridos</span>
                        <span className="font-bold text-blue-900">{metrics.calendarDays}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">Feriados no Período</span>
                        <span className="font-bold text-blue-900">{metrics.holidaysCount}</span>
                      </div>
                      <div className="h-px bg-blue-200 my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800 font-bold">Total Dias Úteis</span>
                        <span className="text-2xl font-black text-blue-900">{metrics.businessDays}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-start gap-3 bg-white p-3 rounded-lg border border-blue-200">
                    <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-600 leading-tight">
                      Os dias úteis excluem finais de semana e feriados cadastrados para o estado <strong>{formData.state || 'selecionado'}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!formData.collaboratorId || metrics.calendarDays === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar Registro
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
