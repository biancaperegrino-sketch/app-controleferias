
import React, { useState, useRef } from 'react';
import { Collaborator, VacationRecord, RequestType, ImportHistory, UserRole } from '../types';
import { 
  FileUp, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  History, 
  Trash2, 
  ShieldAlert,
  Loader2,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../App';

interface ImportPageProps {
  collaborators: Collaborator[];
  setCollaborators: React.Dispatch<React.SetStateAction<Collaborator[]>>;
  records: VacationRecord[];
  setRecords: React.Dispatch<React.SetStateAction<VacationRecord[]>>;
}

interface RawRecord {
  nome: string;
  funcao: string;
  unidade: string;
  estado: string;
  tipo: string;
  inicio: string;
  fim: string;
  dias_corridos: string;
  dias_uteis: string;
  observacao?: string;
  saldo_inicial?: string;
  isValid?: boolean;
  errors?: string[];
}

const ImportPage: React.FC<ImportPageProps> = ({ collaborators, setCollaborators, records, setRecords }) => {
  const { user, addLog } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  
  const [file, setFile] = useState<File | null>(null);
  const [rawRecords, setRawRecords] = useState<RawRecord[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [columnMappingError, setColumnMappingError] = useState<string | null>(null);
  
  const [importHistory, setImportHistory] = useState<ImportHistory[]>(() => {
    const saved = localStorage.getItem('vacation_import_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveImportHistory = (history: ImportHistory) => {
    const updated = [history, ...importHistory].slice(0, 10);
    setImportHistory(updated);
    localStorage.setItem('vacation_import_history', JSON.stringify(updated));
  };

  const downloadTemplate = () => {
    const headers = "Nome do colaborador;Função;Unidade;Estado;Tipo de solicitação;Data de início;Data de fim;Dias corridos;Dias úteis;Saldo inicial;Observação";
    const example = "João Silva;Analista;Sede;SP;Saldo Inicial;;;0;0;30;Importação de saldo residual";
    const blob = new Blob([`\uFEFF${headers}\n${example}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_importacao_fgv.csv";
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
      nome: getIndex(['nome', 'colaborador', 'funcionario']),
      funcao: getIndex(['função', 'funcao', 'cargo']),
      unidade: getIndex(['unidade', 'depto', 'departamento']),
      estado: getIndex(['estado', 'uf']),
      tipo: getIndex(['tipo', 'solicitação', 'solicitacao']),
      inicio: getIndex(['início', 'inicio', 'data de início']),
      fim: getIndex(['fim', 'final', 'data de fim']),
      dias_corridos: getIndex(['corridos']),
      dias_uteis: getIndex(['úteis', 'uteis']),
      observacao: getIndex(['observação', 'observacao', 'obs']),
      saldo_inicial: getIndex(['saldo inicial', 'inicial', 'saldo'])
    };

    if (map.nome === -1) {
      setColumnMappingError("Não encontramos a coluna 'Nome'. Verifique o cabeçalho do arquivo.");
      return;
    }

    const parsed: RawRecord[] = lines.slice(1).map(line => {
      const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        nome: cols[map.nome] || '',
        funcao: map.funcao !== -1 ? cols[map.funcao] || '' : '',
        unidade: map.unidade !== -1 ? cols[map.unidade] || '' : '',
        estado: map.estado !== -1 ? cols[map.estado] || '' : '',
        tipo: map.tipo !== -1 ? cols[map.tipo] || '' : '',
        inicio: map.inicio !== -1 ? cols[map.inicio] || '' : '',
        fim: map.fim !== -1 ? cols[map.fim] || '' : '',
        dias_corridos: map.dias_corridos !== -1 ? cols[map.dias_corridos] || '0' : '0',
        dias_uteis: map.dias_uteis !== -1 ? cols[map.dias_uteis] || '0' : '0',
        saldo_inicial: map.saldo_inicial !== -1 ? cols[map.saldo_inicial] || '0' : '0',
        observacao: map.observacao !== -1 ? cols[map.observacao] || '' : ''
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

  const parseNumber = (str: string) => {
    if (!str) return 0;
    const clean = str.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const validateData = () => {
    const validated = rawRecords.map(record => {
      const errors: string[] = [];
      if (!record.nome) errors.push("Nome é obrigatório");
      
      const validTypes = Object.values(RequestType) as string[];
      let matchedType = validTypes.find(t => t.toLowerCase() === record.tipo.toLowerCase());
      if (!matchedType && record.tipo) {
         if (record.tipo.toLowerCase().includes('saldo')) matchedType = RequestType.SALDO_INICIAL;
         else if (record.tipo.toLowerCase().includes('agend')) matchedType = RequestType.AGENDADAS;
         else if (record.tipo.toLowerCase().includes('desc')) matchedType = RequestType.DESCONTO;
      }

      const isInitial = matchedType === RequestType.SALDO_INICIAL;
      const normalizedStart = normalizeDate(record.inicio);
      const normalizedEnd = normalizeDate(record.fim);

      if (!isInitial) {
        if (!normalizedStart) errors.push(`Data de início necessária`);
        if (!normalizedEnd) errors.push(`Data de fim necessária`);
        if (normalizedStart && normalizedEnd && new Date(normalizedStart) > new Date(normalizedEnd)) {
          errors.push("Início após o Fim");
        }
      } else {
        const saldo = parseNumber(record.saldo_inicial || '0');
        if (saldo <= 0 && parseNumber(record.dias_uteis) <= 0) {
          errors.push("Saldo inicial deve ser > 0");
        }
      }

      if (!matchedType) {
        errors.push(`Tipo desconhecido: "${record.tipo}"`);
      }

      return { 
        ...record, 
        isValid: errors.length === 0, 
        errors,
        inicio: normalizedStart || (isInitial ? new Date().toISOString().split('T')[0] : record.inicio),
        fim: normalizedEnd || (isInitial ? (normalizedStart || new Date().toISOString().split('T')[0]) : record.fim),
        tipo: matchedType || record.tipo
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
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newCollaborators = [...collaborators];
    const newRecords = [...records];

    validRows.forEach(raw => {
      let collab = newCollaborators.find(c => c.name.toLowerCase() === raw.nome.toLowerCase());
      if (!collab) {
        collab = {
          id: Math.random().toString(36).substr(2, 9),
          name: raw.nome,
          role: raw.funcao || 'Não informada',
          unit: raw.unidade || 'Não informada',
          state: (raw.estado || 'SP').toUpperCase().substring(0, 2)
        };
        newCollaborators.push(collab);
      }

      const isInitial = raw.tipo === RequestType.SALDO_INICIAL;
      const businessDays = isInitial 
        ? (parseNumber(raw.saldo_inicial || '0') || parseNumber(raw.dias_uteis)) 
        : parseNumber(raw.dias_uteis);

      newRecords.push({
        id: Math.random().toString(36).substr(2, 9),
        collaboratorId: collab.id,
        type: raw.tipo as RequestType,
        startDate: raw.inicio,
        endDate: raw.fim,
        calendarDays: isInitial ? 0 : Math.floor(parseNumber(raw.dias_corridos)),
        businessDays: Math.floor(businessDays),
        holidaysCount: 0,
        unit: collab.unit,
        state: collab.state,
        observation: raw.observacao
      });
    });

    setCollaborators(newCollaborators);
    setRecords(newRecords);
    
    saveImportHistory({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      userName: user?.name || 'Sistema',
      fileName: file?.name || 'Arquivo',
      recordsCount: validRows.length,
      status: 'Sucesso'
    });
    
    addLog(`Importação de ${validRows.length} registros concluída.`);
    
    setIsProcessing(false);
    setFile(null);
    setRawRecords([]);
    setIsValidated(false);
    alert(`Sucesso! ${validRows.length} registros importados.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Importar Dados Históricos</h2>
          <p className="text-slate-500 font-medium italic">Migração de registros FGV DO via Planilha</p>
        </div>
        {!isAdmin && (
          <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100 text-xs font-bold uppercase flex items-center gap-2">
            <ShieldAlert size={16} />
            Acesso Restrito ao Administrador
          </div>
        )}
      </header>

      {columnMappingError && (
        <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertTriangle className="text-rose-600 shrink-0" size={20} />
          <div>
            <p className="font-bold text-rose-900 text-sm">Erro na estrutura do arquivo</p>
            <p className="text-rose-700 text-xs mt-1">{columnMappingError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Download size={20} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">1. Preparação</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Utilize o cabeçalho padrão. O sistema buscará as colunas por nome automaticamente. Saldo inicial não requer datas.
              </p>
              <button 
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 rounded-2xl transition-all font-black text-slate-700 group text-xs uppercase tracking-widest"
              >
                <FileSpreadsheet size={18} className="text-slate-400 group-hover:text-blue-600" />
                Baixar Modelo Oficial
              </button>
            </div>

            <div className="h-px bg-slate-100"></div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <FileUp size={20} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">2. Upload</h3>
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all
                  ${file ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-slate-100'}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv" 
                  onChange={handleFileChange}
                />
                <div className="space-y-3">
                  <div className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center ${file ? 'bg-emerald-400 text-white shadow-lg' : 'bg-white shadow-sm text-slate-400'}`}>
                    {file ? <CheckCircle2 size={24} /> : <FileUp size={24} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm">
                      {file ? file.name : 'Clique para carregar'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                      CSV com ";" ou ","
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={validateData}
                  disabled={!file || isProcessing || !!columnMappingError}
                  className="flex-1 py-4 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                >
                  Validar
                </button>
                <button 
                  onClick={processImport}
                  disabled={!isValidated || rawRecords.some(r => !r.isValid) || isProcessing}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={16} /> : 'Importar'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <History size={14} /> Histórico Recente
            </h3>
            <div className="space-y-3">
              {importHistory.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-700 truncate">{h.fileName}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{new Date(h.date).toLocaleDateString('pt-BR')} • {h.recordsCount} itens</p>
                  </div>
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                </div>
              ))}
              {importHistory.length === 0 && <p className="text-[10px] text-slate-400 italic text-center">Nenhuma importação.</p>}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info size={16} className="text-blue-500" />
                <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Pré-visualização e Diagnóstico</h4>
              </div>
              {isValidated && (
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {rawRecords.filter(r => r.isValid).length} Ok
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">
                      {rawRecords.filter(r => !r.isValid).length} Erros
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto max-h-[600px]">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50/80 sticky top-0 z-10 text-slate-400 font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Colaborador</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Datas</th>
                    <th className="px-6 py-4 text-center">Valor/Úteis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rawRecords.map((record, i) => (
                    <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${!record.isValid && isValidated ? 'bg-rose-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        {!isValidated ? (
                          <div className="h-4 w-4 bg-slate-100 rounded"></div>
                        ) : record.isValid ? (
                          <div className="h-5 w-5 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center">
                            <CheckCircle2 size={12} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-rose-600 font-bold uppercase text-[9px]">
                            <AlertCircle size={14} />
                            <span className="max-w-[120px] truncate" title={record.errors?.join(', ')}>
                              {record.errors?.[0]}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${!record.isValid && isValidated ? 'text-rose-600' : 'text-slate-900'}`}>
                          {record.nome || 'Vazio'}
                        </span>
                        <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">{record.funcao}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                          {record.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono">
                        {record.tipo === RequestType.SALDO_INICIAL ? '-' : `${record.inicio} → ${record.fim}`}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-900">
                        {record.tipo === RequestType.SALDO_INICIAL ? (record.saldo_inicial || record.dias_uteis) : record.dias_uteis}
                      </td>
                    </tr>
                  ))}
                  {rawRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <FileSpreadsheet size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Planilha Pendente</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
