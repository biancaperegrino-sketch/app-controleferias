
import React, { useState, useRef } from 'react';
import { Holiday, HolidayType, UserRole } from '../types';
import { BRAZILIAN_STATES } from '../constants';
import { 
  Calendar, 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  Globe, 
  MapPin, 
  ShieldAlert, 
  FileUp, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Loader2, 
  History,
  Info,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../App';

interface HolidaysPageProps {
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
}

interface RawHolidayRecord {
  nome: string;
  data: string;
  tipo: string;
  estado: string;
  observacao?: string;
  isValid?: boolean;
  errors?: string[];
}

const HolidaysPage: React.FC<HolidaysPageProps> = ({ holidays, setHolidays }) => {
  const { user, addLog } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportMode, setIsImportMode] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  
  // Import State
  const [file, setFile] = useState<File | null>(null);
  const [rawRecords, setRawRecords] = useState<RawHolidayRecord[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [columnMappingError, setColumnMappingError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Import Logic
  const downloadTemplate = () => {
    const headers = "Nome do feriado;Data do feriado;Tipo de feriado;Estado;Observação";
    const example1 = "Confraternização Universal;01/01/2024;Nacional;;Feriado mundial";
    const example2 = "Revolução Constitucionalista;09/07/2024;Estadual;SP;Feriado paulista";
    const blob = new Blob([`\uFEFF${headers}\n${example1}\n${example2}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_feriados_fgv.csv";
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsValidated(false);
      setRawRecords([]);
      setColumnMappingError(null);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(selectedFile);
    }
  };

  const parseCSV = (text: string) => {
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      setColumnMappingError("O arquivo parece estar vazio ou sem dados.");
      return;
    }

    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));

    const getIndex = (possibleNames: string[]) => {
      return headers.findIndex(h => possibleNames.some(p => h.includes(p.toLowerCase())));
    };

    const map = {
      nome: getIndex(['nome', 'feriado', 'descrição']),
      data: getIndex(['data', 'dia']),
      tipo: getIndex(['tipo']),
      estado: getIndex(['estado', 'uf']),
      obs: getIndex(['observação', 'observacao', 'obs'])
    };

    if (map.nome === -1 || map.data === -1) {
      setColumnMappingError("Não encontramos colunas essenciais: 'Nome' e 'Data'. Verifique o cabeçalho.");
      return;
    }

    const parsed: RawHolidayRecord[] = lines.slice(1).map(line => {
      const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        nome: cols[map.nome] || '',
        data: cols[map.data] || '',
        tipo: map.tipo !== -1 ? cols[map.tipo] || '' : 'Nacional',
        estado: map.estado !== -1 ? cols[map.estado] || '' : '',
        observacao: map.obs !== -1 ? cols[map.obs] || '' : ''
      };
    });

    setRawRecords(parsed);
  };

  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return null;
    const clean = dateStr.trim();
    if (clean.match(/^\d{4}-\d{2}-\d{2}$/)) return clean;
    const brMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      const d = brMatch[1].padStart(2, '0');
      const m = brMatch[2].padStart(2, '0');
      const y = brMatch[3];
      return `${y}-${m}-${d}`;
    }
    return null;
  };

  const validateData = () => {
    const validated = rawRecords.map(record => {
      const errors: string[] = [];
      if (!record.nome) errors.push("Nome ausente");
      
      const normalizedDate = normalizeDate(record.data);
      if (!normalizedDate) errors.push(`Data inválida: "${record.data}"`);

      const validTypes = Object.values(HolidayType) as string[];
      let matchedType = validTypes.find(t => t.toLowerCase() === record.tipo.toLowerCase());
      if (!matchedType) {
        if (record.tipo.toLowerCase().includes('nac')) matchedType = HolidayType.NACIONAL;
        else if (record.tipo.toLowerCase().includes('est')) matchedType = HolidayType.ESTADUAL;
      }
      
      if (!matchedType) errors.push(`Tipo inválido: "${record.tipo}"`);
      
      if (matchedType === HolidayType.ESTADUAL && !record.estado) {
        errors.push("UF obrigatória para feriado estadual");
      }

      const stateVal = record.estado.toUpperCase();
      if (matchedType === HolidayType.ESTADUAL && !BRAZILIAN_STATES.includes(stateVal)) {
        errors.push(`UF inexistente: "${record.estado}"`);
      }

      return {
        ...record,
        isValid: errors.length === 0,
        errors,
        data: normalizedDate || record.data,
        tipo: matchedType || record.tipo,
        estado: stateVal
      };
    });

    setRawRecords(validated);
    setIsValidated(true);
  };

  const processImport = async () => {
    if (!isAdmin || !isValidated) return;
    const validRows = rawRecords.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    let newHolidays = replaceExisting ? [] : [...holidays];

    validRows.forEach(raw => {
      // Prevenir duplicidade se não estiver substituindo tudo
      if (!replaceExisting) {
        const exists = newHolidays.some(h => 
          h.date === raw.data && 
          h.type === raw.tipo && 
          (raw.tipo === HolidayType.NACIONAL || h.state === raw.estado)
        );
        if (exists) return; // Pula se já existe
      }

      newHolidays.push({
        id: Math.random().toString(36).substr(2, 9),
        name: raw.nome,
        date: raw.data,
        type: raw.tipo as HolidayType,
        state: raw.tipo === HolidayType.ESTADUAL ? raw.estado : undefined
      });
    });

    setHolidays(newHolidays);
    addLog(`Importou ${validRows.length} feriados via planilha.`);
    
    setIsProcessing(false);
    setFile(null);
    setRawRecords([]);
    setIsValidated(false);
    setIsImportMode(false);
    alert(`Sucesso! ${validRows.length} feriados processados.`);
  };

  const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Cadastro de Feriados</h2>
          <p className="text-slate-500 font-medium italic">Gestão do calendário operacional FGV DO</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <>
              <button 
                onClick={() => setIsImportMode(!isImportMode)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 border ${isImportMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                <FileUp size={18} />
                {isImportMode ? 'Voltar para Lista' : 'Importar Planilha'}
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <Plus size={18} />
                Incluir Manualmente
              </button>
            </>
          ) : (
            <div className="bg-slate-100 px-3 py-2 rounded-lg flex items-center gap-2 text-slate-500 text-xs font-medium">
              <ShieldAlert size={14} />
              Perfil de Leitura
            </div>
          )}
        </div>
      </header>

      {isImportMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-300">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Download size={20} />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Passo 1: Modelo</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">Baixe o modelo e preencha as colunas Nome, Data e Tipo.</p>
                <button 
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 rounded-2xl transition-all font-black text-slate-700 text-xs uppercase tracking-widest"
                >
                  <FileSpreadsheet size={18} className="text-slate-400" />
                  Baixar Modelo CSV
                </button>
              </div>

              <div className="h-px bg-slate-100"></div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <FileUp size={20} />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Passo 2: Upload</h3>
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all ${file ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-slate-100'}`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
                  <div className="space-y-3">
                    <div className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center ${file ? 'bg-emerald-400 text-white shadow-lg' : 'bg-white shadow-sm text-slate-400'}`}>
                      {file ? <CheckCircle2 size={24} /> : <FileUp size={24} />}
                    </div>
                    <p className="font-bold text-slate-700 text-sm truncate">{file ? file.name : 'Selecionar arquivo CSV'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="peer h-5 w-5 opacity-0 absolute"
                        checked={replaceExisting}
                        onChange={e => setReplaceExisting(e.target.checked)}
                      />
                      <div className="h-5 w-5 bg-white border-2 border-slate-200 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Substituir todos os existentes</span>
                      <p className="text-[10px] text-slate-400 font-medium">Limpa o calendário antes de importar</p>
                    </div>
                  </label>

                  <div className="flex gap-3">
                    <button 
                      onClick={validateData}
                      disabled={!file || isProcessing}
                      className="flex-1 py-4 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30"
                    >
                      Validar
                    </button>
                    <button 
                      onClick={processImport}
                      disabled={!isValidated || rawRecords.some(r => !r.isValid) || isProcessing}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={16} /> : 'Importar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info size={16} className="text-blue-500" />
                  <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Pré-visualização de Feriados</h4>
                </div>
                {isValidated && (
                  <div className="flex gap-4">
                    <div className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      {rawRecords.filter(r => r.isValid).length} Ok
                    </div>
                    <div className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      {rawRecords.filter(r => !r.isValid).length} Erros
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-auto max-h-[600px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 sticky top-0 z-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Feriado</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Tipo/UF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawRecords.map((record, i) => (
                      <tr key={i} className={`hover:bg-slate-50 transition-colors ${!record.isValid && isValidated ? 'bg-rose-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          {!isValidated ? (
                            <div className="h-4 w-4 bg-slate-100 rounded"></div>
                          ) : record.isValid ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <div className="flex items-center gap-2 text-rose-600 font-bold text-[9px] uppercase">
                              <AlertCircle size={14} />
                              <span className="truncate max-w-[100px]">{record.errors?.[0]}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{record.nome}</td>
                        <td className="px-6 py-4 font-mono text-slate-500">{record.data}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${record.tipo === HolidayType.NACIONAL ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {record.tipo} {record.estado ? `(${record.estado})` : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {rawRecords.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-32 text-center text-slate-300">
                          <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="font-black uppercase tracking-widest text-[10px]">Aguardando planilha...</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedHolidays.map((holiday) => (
            <div key={holiday.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all group animate-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                  <Calendar size={20} />
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(holiday)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(holiday.id, holiday.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-black text-slate-900 mb-1 leading-tight">{holiday.name}</h4>
                <p className="text-slate-500 font-mono text-sm mb-4 tracking-tighter">{formatDate(holiday.date)}</p>
                <div className="flex items-center gap-2">
                  {holiday.type === HolidayType.NACIONAL ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                      <Globe size={12} />
                      Nacional
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">
                      <MapPin size={12} />
                      Estadual ({holiday.state})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {holidays.length === 0 && (
            <div className="col-span-full py-24 text-center text-slate-400 bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
              <Calendar size={64} className="mx-auto mb-6 opacity-20" />
              <p className="font-black uppercase tracking-[0.2em] text-xs">Calendário Vazio</p>
              <p className="text-sm font-medium mt-2">Importe ou cadastre os feriados para habilitar os cálculos.</p>
            </div>
          )}
        </div>
      )}

      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Calendar size={20} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
                  {editingHoliday ? 'Editar Feriado' : 'Novo Feriado'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nome do Feriado</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Tiradentes"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Data do Evento</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Âmbito</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as HolidayType})}
                  >
                    <option value={HolidayType.NACIONAL}>Nacional</option>
                    <option value={HolidayType.ESTADUAL}>Estadual</option>
                  </select>
                </div>
              </div>
              
              {formData.type === HolidayType.ESTADUAL && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Unidade Federativa (UF)</label>
                  <select 
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                  >
                    <option value="">Selecione o Estado...</option>
                    {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all"
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

export default HolidaysPage;
