
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
    <div className="min-h-screen flex items-center justify-center bg-[#0D1117] p-6 font-sans relative overflow-hidden">
      {/* Blue glow effects for depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1F6FEB]/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#388BFD]/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-[480px] relative z-10">
        <div className="bg-[#161B22] rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] overflow-hidden border border-[#30363D] flex flex-col">
          
          {/* Top Section with Branding */}
          <div className="h-2 bg-gradient-to-r from-[#1F6FEB] to-[#388BFD]"></div>

          <div className="p-12 pb-8">
            <div className="mb-10 flex justify-center bg-white p-4 rounded-3xl shadow-lg">
              <img 
                src="https://raw.githubusercontent.com/filipe-fgv/logos/main/fgv-do-logo.png" 
                alt="FGV DO" 
                className="h-14 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = "https://logodownload.org/wp-content/uploads/2014/10/fgv-logo-1.png";
                }}
              />
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase">
                Controle de <span className="text-[#1F6FEB]">Saldo</span>
              </h2>
              <div className="flex items-center justify-center gap-3">
                <div className="h-[2px] w-8 bg-[#30363D] rounded-full"></div>
                <h3 className="text-[#8B949E] font-black uppercase tracking-[0.3em] text-[10px]">
                  Diretoria de Operações
                </h3>
                <div className="h-[2px] w-8 bg-[#30363D] rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="px-12 pb-12 pt-4 space-y-10">
            {!loading ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <button 
                    onClick={() => handleLogin(UserRole.ADMIN)}
                    className="w-full flex items-center justify-between bg-[#0D1117] border border-[#30363D] hover:border-[#1F6FEB] hover:bg-[#1F6FEB]/10 px-6 py-6 rounded-[1.5rem] transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 bg-[#161B22] border border-[#30363D] rounded-2xl flex items-center justify-center text-[#8B949E] group-hover:bg-[#1F6FEB] group-hover:text-white transition-all shadow-sm">
                        <Lock size={24} />
                      </div>
                      <div className="text-left">
                        <span className="block text-xl font-black text-white leading-none uppercase">Administrador</span>
                        <span className="block text-[10px] text-[#1F6FEB] mt-2 uppercase font-black tracking-widest opacity-80">Acesso Pleno • Microsoft 365</span>
                      </div>
                    </div>
                    <ArrowRight size={22} className="text-[#30363D] group-hover:text-[#1F6FEB] group-hover:translate-x-1 transition-all" />
                  </button>

                  <button 
                    onClick={() => handleLogin(UserRole.READONLY)}
                    className="w-full flex items-center justify-between bg-[#0D1117] border border-[#30363D] hover:border-[#1F6FEB] hover:bg-[#1F6FEB]/10 px-6 py-6 rounded-[1.5rem] transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 bg-[#161B22] border border-[#30363D] rounded-2xl flex items-center justify-center text-[#8B949E] group-hover:bg-[#1F6FEB] group-hover:text-white transition-all shadow-sm">
                        <Globe size={24} />
                      </div>
                      <div className="text-left">
                        <span className="block text-xl font-black text-white leading-none uppercase">Consulta</span>
                        <span className="block text-[10px] text-[#8B949E] mt-2 uppercase font-black tracking-widest opacity-80">Leitura • Microsoft 365</span>
                      </div>
                    </div>
                    <ArrowRight size={22} className="text-[#30363D] group-hover:text-[#1F6FEB] group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-8">
                <div className="relative">
                  <div className="absolute inset-[-30px] bg-[#1F6FEB]/20 rounded-full blur-3xl animate-pulse"></div>
                  <Loader2 className="animate-spin text-[#1F6FEB] relative z-10" size={72} strokeWidth={3} />
                  <div className="absolute inset-0 flex items-center justify-center relative z-20">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-8 h-8" alt="MS" />
                  </div>
                </div>
                <div className="text-center relative z-10">
                  <p className="text-2xl font-black text-white tracking-tight uppercase">Autenticando...</p>
                  <p className="text-[11px] text-[#1F6FEB] mt-2 uppercase font-black tracking-[0.3em] animate-pulse">Conexão Segura Ativa</p>
                </div>
              </div>
            )}

            <div className="pt-10 border-t border-[#30363D] flex flex-col items-center gap-5">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white border-4 border-[#161B22] flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-4 h-4" alt="MS" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#30363D] border-4 border-[#161B22] flex items-center justify-center">
                     <ShieldCheck size={12} className="text-[#1F6FEB]" />
                  </div>
                </div>
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#8B949E]">Microsoft Entra Verified</span>
              </div>
              <p className="text-[10px] text-[#8B949E] text-center leading-relaxed px-4 font-bold uppercase opacity-60">
                Acesso restrito a colaboradores autorizados da Fundação Getulio Vargas. 
                O sistema utiliza criptografia de ponta a ponta.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em]">
            FUNDAÇÃO GETULIO VARGAS
          </p>
          <div className="h-1.5 w-16 bg-[#30363D] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
