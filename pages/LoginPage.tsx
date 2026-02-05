
import React, { useState } from 'react';
import { useAuth } from '../App';
import { ArrowRight, Loader2, ShieldCheck, Globe, Lock } from 'lucide-react';
import { UserRole } from '../types';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleLogin = async (role: UserRole) => {
    setSelectedRole(role);
    setLoading(true);
    // Simula o redirecionamento OAuth 2.0 / OpenID Connect para Microsoft Entra ID
    setTimeout(async () => {
      await login(role);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-[480px] relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 flex flex-col">
          
          {/* Top Section with Accent Bar */}
          <div className="h-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-800"></div>

          <div className="p-10 pb-6">
            {/* FGV Logo - Horizontal Version */}
            <div className="mb-10 flex justify-between items-start">
              <img 
                src="https://logodownload.org/wp-content/uploads/2014/10/fgv-logo-1.png" 
                alt="FGV Logo" 
                className="h-10 w-auto object-contain"
              />
              <div className="bg-blue-50 p-2 rounded-xl">
                <ShieldCheck size={20} className="text-blue-600" />
              </div>
            </div>

            {/* Title Section */}
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                Controle de <span className="text-blue-600">Férias</span>
              </h2>
              <div className="flex items-center justify-center gap-3">
                <div className="h-[2px] w-6 bg-blue-600/30 rounded-full"></div>
                <h3 className="text-slate-500 font-bold uppercase tracking-[0.25em] text-[10px]">
                  Diretoria de Operações
                </h3>
                <div className="h-[2px] w-6 bg-blue-600/30 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="px-10 pb-12 pt-4 space-y-8">
            {!loading ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <button 
                    onClick={() => handleLogin(UserRole.ADMIN)}
                    className="w-full flex items-center justify-between bg-slate-50 border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/30 px-6 py-5 rounded-[1.5rem] transition-all group relative overflow-hidden shadow-sm"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <Lock size={22} />
                      </div>
                      <div className="text-left">
                        <span className="block text-lg font-black text-slate-800 leading-none">Administrador</span>
                        <span className="block text-[10px] text-blue-600 mt-1.5 uppercase font-bold tracking-widest opacity-80">Acesso Total • MS 365</span>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all relative z-10" />
                  </button>

                  <button 
                    onClick={() => handleLogin(UserRole.READONLY)}
                    className="w-full flex items-center justify-between bg-slate-50 border-2 border-slate-100 hover:border-cyan-600 hover:bg-cyan-50/30 px-6 py-5 rounded-[1.5rem] transition-all group relative overflow-hidden shadow-sm"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-sm">
                        <Globe size={22} />
                      </div>
                      <div className="text-left">
                        <span className="block text-lg font-black text-slate-800 leading-none">Consulta</span>
                        <span className="block text-[10px] text-cyan-600 mt-1.5 uppercase font-bold tracking-widest opacity-80">Acesso Leitura • MS 365</span>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all relative z-10" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative">
                  <div className="absolute inset-[-20px] bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <Loader2 className="animate-spin text-blue-600 relative z-10" size={64} strokeWidth={2.5} />
                  <div className="absolute inset-0 flex items-center justify-center relative z-20">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-6 h-6" alt="Microsoft Logo" />
                  </div>
                </div>
                <div className="text-center relative z-10">
                  <p className="text-xl font-black text-slate-800 tracking-tight">Autenticando...</p>
                  <p className="text-[11px] text-blue-600 mt-1.5 uppercase font-black tracking-[0.2em] animate-pulse">Single Sign-On Ativo</p>
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-3 h-3" alt="MS" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                     <ShieldCheck size={10} className="text-slate-400" />
                  </div>
                </div>
                <span className="text-[10px] uppercase font-black tracking-[0.15em] text-slate-400">Microsoft Entra Verified</span>
              </div>
              <p className="text-[10px] text-slate-400 text-center leading-relaxed px-6 font-medium">
                Este sistema utiliza criptografia de ponta a ponta e autenticação multifator. O acesso não autorizado é estritamente proibido.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-10 flex flex-col items-center gap-2">
          <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">
            Fundação Getulio Vargas
          </p>
          <div className="h-1 w-12 bg-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
