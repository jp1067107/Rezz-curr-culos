import React from 'react';
import { ResumeData } from '../types';
import { Copy, Download } from 'lucide-react';

interface Props {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  onDownloadPdf: (isDraft?: boolean) => void;
  onAiGenerated?: (newData: ResumeData) => void;
}

export function CoverLetterGenerator({ data, setData, onDownloadPdf }: Props) {
  const copyToClipboard = () => {
    if (data.coverLetter) {
      navigator.clipboard.writeText(data.coverLetter);
      alert('Copiado para a área de transferência!');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col h-full max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-white mb-2">Carta de Apresentação</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Escreva a sua carta de apresentação abaixo. Você pode editá-la livremente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-white/5 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Seu Nome</label>
            <input 
              type="text" 
              value={data.personalInfo.fullName || ''}
              onChange={(e) => setData({ ...data, personalInfo: { ...data.personalInfo, fullName: e.target.value } })}
              placeholder="Ex: João Silva" 
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
            <input 
              type="email" 
              value={data.personalInfo.email || ''}
              onChange={(e) => setData({ ...data, personalInfo: { ...data.personalInfo, email: e.target.value } })}
              placeholder="Ex: joao@email.com" 
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        <textarea 
          value={data.coverLetter || ""}
          onChange={(e) => setData({ ...data, coverLetter: e.target.value })}
          placeholder="Escreva sua carta de apresentação aqui..."
          className="w-full flex-1 bg-slate-900 border border-indigo-500/30 rounded-xl p-4 text-white focus:outline-none min-h-[400px] resize-none leading-relaxed text-sm"
        />
        
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
          <button 
            onClick={copyToClipboard}
            disabled={!data.coverLetter}
            className="w-full sm:flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors border border-white/5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            <span className="whitespace-nowrap">Copiar Carta</span>
          </button>
          
          <button 
            onClick={() => onDownloadPdf(true)}
            disabled={!data.coverLetter}
            className="w-full sm:flex-1 px-4 py-3 bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 font-medium rounded-xl transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="whitespace-nowrap">Baixar Amostra</span>
          </button>

          <button 
            onClick={() => onDownloadPdf()}
            disabled={!data.coverLetter}
            className="w-full sm:flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 text-white font-medium rounded-xl transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="whitespace-nowrap text-xs sm:text-sm">Baixar PDF Final</span>
          </button>
        </div>
      </div>
    </div>
  );
}
