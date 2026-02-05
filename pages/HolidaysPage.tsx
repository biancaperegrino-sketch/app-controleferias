
import React, { useState } from 'react';
import { Holiday, HolidayType, UserRole } from '../types';
import { BRAZILIAN_STATES } from '../constants';
import { Calendar, Plus, X, Edit2, Trash2, Globe, MapPin, ShieldAlert } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../App';

interface HolidaysPageProps {
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
}

const HolidaysPage: React.FC<HolidaysPageProps> = ({ holidays, setHolidays }) => {
  const { user, addLog } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: HolidayType.NACIONAL,
    state: ''
  });

  const handleOpenModal = (holiday?: Holiday) => {
    if (!isAdmin) return;
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        name: holiday.name,
        date: holiday.date,
        type: holiday.type,
        state: holiday.state || ''
      });
    } else {
      setEditingHoliday(null);
      setFormData({ name: '', date: '', type: HolidayType.NACIONAL, state: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalHoliday: Holiday = {
      id: editingHoliday?.id || Math.random().toString(36).substr(2, 9),
      ...formData,
      state: formData.type === HolidayType.ESTADUAL ? formData.state : undefined
    };

    if (editingHoliday) {
      setHolidays(prev => prev.map(h => h.id === editingHoliday.id ? finalHoliday : h));
      addLog(`Editou o feriado ${formData.name}`);
    } else {
      setHolidays(prev => [...prev, finalHoliday]);
      addLog(`Cadastrou o feriado ${formData.name}`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm('Deseja realmente excluir este feriado?')) {
      setHolidays(prev => prev.filter(h => h.id !== id));
      addLog(`Excluiu o feriado ${name}`);
    }
  };

  const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cadastro de Feriados</h2>
          <p className="text-slate-500">Gerencie os feriados nacionais e estaduais para cálculo de dias úteis.</p>
        </div>
        {isAdmin ? (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Incluir Feriado
          </button>
        ) : (
          <div className="bg-slate-100 px-3 py-2 rounded-lg flex items-center gap-2 text-slate-500 text-xs font-medium">
            <ShieldAlert size={14} />
            Perfil de Leitura - Visualização apenas
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedHolidays.map((holiday) => (
          <div key={holiday.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors">
                <Calendar size={20} />
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => handleOpenModal(holiday)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(holiday.id, holiday.name)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">{holiday.name}</h4>
              <p className="text-slate-500 text-sm mb-3">{formatDate(holiday.date)}</p>
              <div className="flex items-center gap-2">
                {holiday.type === HolidayType.NACIONAL ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    <Globe size={10} />
                    Nacional
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-1 rounded">
                    <MapPin size={10} />
                    Estadual ({holiday.state})
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {holidays.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
            Nenhum feriado cadastrado.
          </div>
        )}
      </div>

      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingHoliday ? 'Editar Feriado' : 'Novo Feriado'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Feriado</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Tiradentes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: HolidayType.NACIONAL})}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${formData.type === HolidayType.NACIONAL ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Nacional
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: HolidayType.ESTADUAL})}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${formData.type === HolidayType.ESTADUAL ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Estadual
                  </button>
                </div>
              </div>
              
              {formData.type === HolidayType.ESTADUAL && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Salvar Feriado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidaysPage;
