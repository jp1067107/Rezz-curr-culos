import React, { useState } from 'react';
import { ResumeData } from '../types';
import { generateCustomCoverLetter } from '../services/aiService';
import { Loader2, Wand2, Copy } from 'lucide-react';

interface Props {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  onDownloadPdf: (isDraft?: boolean) => void;
}

export function CoverLetterGenerator({ data, setData, onDownloadPdf }: Props) {
  const [targetJob, setTargetJob] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [tone, setTone] = useState('Profissional e Direto');
  const [highlights, setHighlights] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!targetJob.trim()) {
      alert('Por favor, informe o Cargo Desejado.');
      return;
    }

    try {
      setIsGenerating(true);
      const content = await generateCustomCoverLetter(data, {
        targetJob,
        companyName,
        recruiterName,
        tone,
        highlights
      });

      setData(prev => ({ ...prev, coverLetter: content }));
    } catch (e: any) {
      alert(e.message || 'Erro ao gerar carta de apresentação.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (data.coverLetter) {
      navigator.clipboard.writeText(data.coverLetter);
      alert('Copiado para a área de transferência!');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Formulário de Configuração */}
      <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Configurar Carta</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Preencha os detalhes abaixo para que nossa IA gere uma carta totalmente personalizada e focada na vaga.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Cargo Desejado / Nome da Vaga *</label>
            <input 
              type="text" 
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              placeholder="Ex: Engenheiro de Software Sênior" 
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Empresa</label>
            <input 
              type="text" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Google, Nubank, etc. (Opcional)" 
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Recrutador/Gerente</label>
            <input 
              type="text" 
              value={recruiterName}
              onChange={(e) => setRecruiterName(e.target.value)}
              placeholder="Ex: João Silva (Opcional)" 
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Estilo / Tom da Carta</label>
            <select 
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
            >
              <option value="Profissional e Direto">Profissional e Direto</option>
              <option value="Criativo e Entusiástico">Criativo e Entusiástico</option>
              <option value="Formal e Tradicional">Formal e Tradicional</option>
              <option value="Focado em Resultados">Focado em Resultados</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Pontos Fortes a Destacar</label>
            <textarea 
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="Ex: 5 anos de exp com React, liderança, etc. (Opcional)" 
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all h-24 resize-none text-sm"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analisando perfil e redigindo...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Gerar Carta Profissional</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visualização do Resultado */}
      <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col h-full">
        <h2 className="text-2xl font-bold text-white mb-2">Carta Gerada</h2>
        <p className="text-slate-400 mb-4 text-sm">
          Edite o texto final abaixo se desejar antes de copiar.
        </p>

        <textarea 
          value={data.coverLetter || ""}
          onChange={(e) => setData({ ...data, coverLetter: e.target.value })}
          placeholder="Sua carta de apresentação aparecerá aqui após a geração."
          className="w-full flex-1 bg-slate-900 border border-purple-500/30 rounded-xl p-4 text-white focus:outline-none min-h-[400px] resize-none leading-relaxed text-sm"
        />
        
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 w-full">
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
            <Wand2 className="w-4 h-4" />
            <span className="whitespace-nowrap">Baixar Amostra</span>
          </button>

          <button 
            onClick={() => onDownloadPdf()}
            disabled={!data.coverLetter}
            className="w-full sm:flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 text-white font-medium rounded-xl transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-4 h-4" />
            <span className="whitespace-nowrap text-xs sm:text-sm">Baixar PDF Premium</span>
          </button>
        </div>
      </div>
    </div>
  );
}
